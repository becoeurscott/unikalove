import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AI_SERVICE, AiService } from '../ai/ai.service';

export interface Candidate {
  id: string;
  userId: string;
  displayName: string;
  city: string | null;
  verified: boolean;
  bio: string | null;
  intent: string | null;
  photo: string | null;
  interests: string[];
  age: number;
  distanceKm: number | null;
  sharedInterests: number;
  score: number;
}

@Injectable()
export class DiscoveryService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @Inject(AI_SERVICE) private ai: AiService,
  ) {}

  /** Cached AI compatibility for a pair; falls back to the heuristic on failure. */
  private async aiScore(me: any, candidate: Candidate): Promise<number | null> {
    const key = `ai:compat:${[me.userId, candidate.userId].sort().join(':')}`;
    const cached = await this.redis.getJson<{ s: number }>(key);
    if (cached) return cached.s;
    const score = await this.ai.compatibilityScore(
      {
        ville: me.city,
        intention: me.intent,
        interets: me.interests?.map((i: any) => i.interestId),
      },
      {
        ville: candidate.city,
        intention: candidate.intent,
        interets: candidate.interests,
        age: candidate.age,
        distanceKm: candidate.distanceKm,
      },
    );
    if (!Number.isFinite(score)) return null;
    await this.redis.setJson(key, { s: score }, 86_400);
    return score;
  }

  /**
   * Candidate feed: preference filters + Haversine distance + exclusions
   * (self, already swiped, blocked either way, non-active users).
   * Ranking blends the heuristic (shared interests + proximity) with the AI
   * compatibility score, which is cached per pair for 24h.
   */
  async feed(userId: string, limit = 20): Promise<Candidate[]> {
    const me = await this.prisma.profile.findUnique({
      where: { userId },
      include: { interests: true },
    });
    if (!me) throw new BadRequestException('Create your profile first');
    const pref = await this.prisma.preference.findUnique({ where: { userId } });

    const genders = pref?.genders?.length ? pref.genders : undefined;
    const minAge = pref?.minAge ?? 18;
    const maxAge = pref?.maxAge ?? 100;
    const maxKm = pref?.maxDistanceKm ?? 20000;

    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT p.id, p."userId", p."displayName", p.city, p.verified, p.latitude, p.longitude,
        p.bio, p.intent,
        (SELECT ph.url FROM "Photo" ph
          WHERE ph."profileId" = p.id AND ph."deletedAt" IS NULL
          ORDER BY ph.position LIMIT 1) AS photo,
        (SELECT COALESCE(json_agg(i.slug), '[]') FROM "ProfileInterest" pi2
          JOIN "Interest" i ON i.id = pi2."interestId"
          WHERE pi2."profileId" = p.id) AS interests,
        DATE_PART('year', AGE(p."birthDate"))::int AS age,
        CASE WHEN p.latitude IS NOT NULL AND CAST(${me.latitude} AS float8) IS NOT NULL THEN
          6371 * acos(LEAST(1.0,
            cos(radians(CAST(${me.latitude} AS float8))) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(CAST(${me.longitude} AS float8))) +
            sin(radians(CAST(${me.latitude} AS float8))) * sin(radians(p.latitude))))
        ELSE NULL END AS distance_km,
        (SELECT COUNT(*)::int FROM "ProfileInterest" pi
          WHERE pi."profileId" = p.id
            AND pi."interestId" IN (SELECT "interestId" FROM "ProfileInterest" WHERE "profileId" = ${me.id})
        ) AS shared_interests
      FROM "Profile" p
      JOIN "User" u ON u.id = p."userId"
      WHERE p."userId" <> ${userId}
        AND u.status = 'ACTIVE'
        AND p."deletedAt" IS NULL
        AND DATE_PART('year', AGE(p."birthDate")) BETWEEN ${minAge} AND ${maxAge}
        ${genders ? Prisma.sql`AND p.gender::text IN (${Prisma.join(genders)})` : Prisma.empty}
        AND NOT EXISTS (SELECT 1 FROM "Swipe" s WHERE s."actorId" = ${userId} AND s."targetId" = p."userId")
        AND NOT EXISTS (SELECT 1 FROM "Block" b
          WHERE (b."blockerId" = ${userId} AND b."blockedId" = p."userId")
             OR (b."blockerId" = p."userId" AND b."blockedId" = ${userId}))
      LIMIT 500
    `);

    const ranked = rows
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        displayName: r.displayName,
        city: r.city,
        verified: r.verified,
        bio: r.bio,
        intent: r.intent,
        photo: r.photo,
        interests: r.interests ?? [],
        age: r.age,
        distanceKm: r.distance_km == null ? null : Math.round(Number(r.distance_km)),
        sharedInterests: r.shared_interests,
        score:
          r.shared_interests * 10 +
          (r.distance_km == null ? 0 : Math.max(0, 50 - Number(r.distance_km) / 10)),
      }))
      .filter((c) => c.distanceKm == null || c.distanceKm <= maxKm)
      .sort((a, b) => b.score - a.score);

    // Re-rank only the strongest heuristic candidates with the AI score, to
    // bound cost: heuristic 60% + AI 40%.
    const head = ranked.slice(0, Math.min(limit * 2, 20));
    const scored = await Promise.all(
      head.map(async (c) => {
        const ai = await this.aiScore(me, c);
        return ai == null ? c : { ...c, score: c.score * 0.6 + ai * 100 * 0.4 };
      }),
    );
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /** Small curated set — the anti-fatigue differentiator. */
  async dailyPicks(userId: string) {
    return (await this.feed(userId, 5)).map((c) => ({ ...c, dailyPick: true }));
  }
}
