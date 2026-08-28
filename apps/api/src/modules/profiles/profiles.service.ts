import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerationService } from '../safety/moderation.service';
import { INTEREST_CATALOG, INTEREST_CATEGORIES } from './interests.catalog';
import {
  AddPhotoDto,
  LifestyleDto,
  PrivacyDto,
  ProfileStepDto,
  SetInterestsDto,
  UpdatePreferenceDto,
  UpsertProfileDto,
} from './dto/profile.dto';

const MIN_AGE = 18;

/** Free accounts search locally; wider radii and gender filters are paid. */
export const FREE_MAX_DISTANCE_KM = 100;

@Injectable()
export class ProfilesService implements OnModuleInit {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private prisma: PrismaService,
    private moderation: ModerationService,
  ) {}

  /**
   * Keeps the interest table in step with the catalogue on every boot, so the
   * grouped chip list on onboarding screen 7 never depends on the demo seed.
   */
  async onModuleInit() {
    try {
      for (const { slug, labelFr, labelEn, category } of INTEREST_CATALOG) {
        await this.prisma.interest.upsert({
          where: { slug },
          create: { slug, labelFr, labelEn, category },
          update: { labelFr, labelEn, category },
        });
      }
    } catch (err) {
      // A cold database must not stop the API from booting.
      this.logger.warn(`Interest sync skipped: ${(err as Error).message}`);
    }
  }

  async getMine(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        photos: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
        interests: { include: { interest: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not created yet');
    return profile;
  }

  async upsert(userId: string, dto: UpsertProfileDto) {
    const age = (Date.now() - dto.birthDate.getTime()) / (365.25 * 86_400_000);
    if (age < MIN_AGE) throw new BadRequestException('You must be at least 18');

    if (dto.bio) this.moderation.review(userId, dto.bio, 'bio');
    const data = { ...dto };
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.recomputeCompleteness(profile.id, userId);
  }

  /**
   * Partial save used by each onboarding screen. Creating the row needs a name,
   * a gender and a birth date (screens 2 and 4), so earlier screens update an
   * existing row only.
   */
  async saveStep(userId: string, dto: ProfileStepDto) {
    if (dto.birthDate) {
      const age = (Date.now() - dto.birthDate.getTime()) / (365.25 * 86_400_000);
      if (age < MIN_AGE) throw new BadRequestException('Vous devez avoir au moins 18 ans');
    }
    if (dto.bio) this.moderation.review(userId, dto.bio, 'bio');

    const existing = await this.prisma.profile.findUnique({ where: { userId } });
    if (!existing) {
      if (!dto.displayName || !dto.birthDate || !dto.gender) {
        throw new BadRequestException(
          'Prénom, date de naissance et genre sont requis pour créer le profil',
        );
      }
      await this.prisma.profile.create({
        data: {
          userId,
          displayName: dto.displayName,
          birthDate: dto.birthDate,
          gender: dto.gender,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          intent: dto.intent,
          bio: dto.bio,
          onboardingStep: dto.onboardingStep ?? 2,
        },
      });
    } else {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          ...dto,
          // Progress only moves forward, so a back-navigation cannot rewind it.
          onboardingStep: Math.max(existing.onboardingStep, dto.onboardingStep ?? 0),
        },
      });
    }
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });
    return this.recomputeCompleteness(profile.id, userId);
  }

  /** Screen 8. */
  async updateLifestyle(userId: string, dto: LifestyleDto) {
    const profile = await this.getMine(userId);
    await this.prisma.profile.update({ where: { userId }, data: { ...dto } });
    return this.recomputeCompleteness(profile.id, userId);
  }

  /** Screen 11 — privacy switches plus the consent stamp. */
  async updatePrivacy(userId: string, dto: PrivacyDto) {
    const { acceptTerms, marketingOptIn, ...profileFields } = dto;
    const profile = await this.getMine(userId);
    await this.prisma.profile.update({ where: { userId }, data: profileFields });
    if (acceptTerms !== undefined || marketingOptIn !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(acceptTerms ? { acceptedTermsAt: new Date() } : {}),
          ...(marketingOptIn !== undefined ? { marketingOptIn } : {}),
        },
      });
    }
    return this.recomputeCompleteness(profile.id, userId);
  }

  /**
   * Gender filtering and a search radius beyond FREE_MAX_DISTANCE_KM are the two
   * paid levers on this screen, so they are enforced here rather than trusted
   * from the client.
   */
  async updatePreference(userId: string, dto: UpdatePreferenceDto, plan = 'FREE') {
    if (dto.minAge && dto.maxAge && dto.minAge > dto.maxAge) {
      throw new BadRequestException('minAge cannot exceed maxAge');
    }
    if (plan === 'FREE') {
      if (dto.maxDistanceKm && dto.maxDistanceKm > FREE_MAX_DISTANCE_KM) {
        throw new ForbiddenException(
          `Au-delà de ${FREE_MAX_DISTANCE_KM} km, la recherche est réservée aux membres Premium.`,
        );
      }
      // One gender is what everyone gets; combining several is a paid filter.
      if (dto.genders && dto.genders.length > 1) {
        throw new ForbiddenException(
          'Choisir plusieurs genres à la fois est réservé aux membres Premium.',
        );
      }
    }
    return this.prisma.preference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  /**
   * Flat list plus the category order, so the client can render one section per
   * category without hard-coding the taxonomy.
   */
  async listInterests() {
    const rows = await this.prisma.interest.findMany({ orderBy: { labelFr: 'asc' } });
    const rank = new Map(INTEREST_CATEGORIES.map((c, i) => [c.key, i]));
    return {
      categories: INTEREST_CATEGORIES,
      interests: rows.sort(
        (a, b) =>
          (rank.get(a.category) ?? 99) - (rank.get(b.category) ?? 99) ||
          a.labelFr.localeCompare(b.labelFr, 'fr'),
      ),
    };
  }

  async setInterests(userId: string, dto: SetInterestsDto) {
    const profile = await this.getMine(userId);
    const interests = await this.prisma.interest.findMany({
      where: { slug: { in: dto.slugs } },
    });
    await this.prisma.$transaction([
      this.prisma.profileInterest.deleteMany({ where: { profileId: profile.id } }),
      this.prisma.profileInterest.createMany({
        data: interests.map((i) => ({ profileId: profile.id, interestId: i.id })),
      }),
    ]);
    return this.recomputeCompleteness(profile.id, userId);
  }

  async addPhoto(userId: string, dto: AddPhotoDto) {
    const profile = await this.getMine(userId);
    await this.prisma.photo.create({
      data: { profileId: profile.id, url: dto.url, position: dto.position ?? 0 },
    });
    return this.recomputeCompleteness(profile.id, userId);
  }

  async removePhoto(userId: string, photoId: string) {
    const profile = await this.getMine(userId);
    const result = await this.prisma.photo.updateMany({
      where: { id: photoId, profileId: profile.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Photo not found');
    return this.recomputeCompleteness(profile.id, userId);
  }

  async submitVerification(userId: string, selfieUrl: string) {
    await this.getMine(userId);
    return this.prisma.verificationRequest.create({ data: { userId, selfieUrl } });
  }

  /**
   * Another member's profile as the viewer is allowed to see it: privacy
   * switches applied, distance derived from both coordinates, and the viewer's
   * own relationship to them (liked, saved, matched) so the page can offer the
   * right actions.
   */
  async getPublic(viewerId: string, targetUserId: string) {
    if (targetUserId === viewerId) return { ...(await this.getMine(viewerId)), self: true };

    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: viewerId },
        ],
      },
    });
    if (blocked) throw new NotFoundException('Profil indisponible');

    const profile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: {
        photos: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
        interests: { include: { interest: true } },
        user: { select: { status: true, plan: true } },
      },
    });
    if (!profile || profile.deletedAt || profile.user.status !== 'ACTIVE') {
      throw new NotFoundException('Profil indisponible');
    }

    const me = await this.prisma.profile.findUnique({
      where: { userId: viewerId },
      include: { interests: true },
    });

    const [mySwipe, theirSwipe, match] = await Promise.all([
      this.prisma.swipe.findUnique({
        where: { actorId_targetId: { actorId: viewerId, targetId: targetUserId } },
      }),
      this.prisma.swipe.findUnique({
        where: { actorId_targetId: { actorId: targetUserId, targetId: viewerId } },
      }),
      this.prisma.match.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            { userAId: viewerId, userBId: targetUserId },
            { userAId: targetUserId, userBId: viewerId },
          ],
        },
        include: { conversation: { select: { id: true } } },
      }),
    ]);

    const mine = new Set(me?.interests.map((i) => i.interestId) ?? []);
    const shared = profile.interests.filter((i) => mine.has(i.interestId));

    return {
      userId: targetUserId,
      displayName: profile.displayName,
      bio: profile.bio,
      gender: profile.gender,
      city: profile.city,
      country: profile.country,
      intent: profile.intent,
      verified: profile.verified,
      completeness: profile.completeness,
      heightCm: profile.heightCm,
      education: profile.education,
      occupation: profile.occupation,
      smoking: profile.smoking,
      drinking: profile.drinking,
      religion: profile.religion,
      children: profile.children,
      languages: profile.languages,
      traits: profile.traits,
      photos: profile.photos.map((p) => p.url),
      interests: profile.interests.map((i) => ({
        slug: i.interest.slug,
        labelFr: i.interest.labelFr,
        shared: mine.has(i.interestId),
      })),
      sharedInterests: shared.length,
      age: profile.showAge ? this.ageFrom(profile.birthDate) : null,
      distanceKm:
        profile.showDistance ? this.distanceKm(me, profile) : null,
      // Relationship to the viewer — drives the buttons on the detail page.
      liked: mySwipe?.type === 'LIKE' || mySwipe?.type === 'SUPERLIKE',
      saved: mySwipe?.type === 'FAVORITE',
      likesYou: theirSwipe?.type === 'LIKE' || theirSwipe?.type === 'SUPERLIKE',
      matched: Boolean(match),
      conversationId: match?.conversation?.id ?? null,
      self: false,
    };
  }

  private ageFrom(birthDate: Date) {
    return Math.floor((Date.now() - birthDate.getTime()) / 31_557_600_000);
  }

  /** Haversine, rounded — mirrors the discovery feed so both agree. */
  private distanceKm(
    a: { latitude: number | null; longitude: number | null } | null,
    b: { latitude: number | null; longitude: number | null },
  ): number | null {
    if (!a?.latitude || !a.longitude || !b.latitude || !b.longitude) return null;
    const rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(b.latitude - a.latitude);
    const dLon = rad(b.longitude - a.longitude);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return Math.round(6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h))));
  }

  /** Completeness: bio 15, photos 30 (10 each up to 3), interests 20 (5 each up
   *  to 4), location 10, intent 10, lifestyle 15 (3 each up to 5 fields). */
  private async recomputeCompleteness(profileId: string, userId: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: {
        photos: { where: { deletedAt: null } },
        interests: true,
      },
    });
    let score = 0;
    if (profile.bio && profile.bio.length >= 20) score += 15;
    score += Math.min(profile.photos.length, 3) * 10;
    score += Math.min(profile.interests.length, 4) * 5;
    if (profile.latitude != null && profile.longitude != null) score += 10;
    if (profile.intent) score += 10;
    const lifestyle = [
      profile.occupation,
      profile.education,
      profile.smoking,
      profile.children,
      profile.languages?.length ? 'x' : null,
    ].filter(Boolean).length;
    score += Math.min(lifestyle, 5) * 3;

    await this.prisma.profile.update({
      where: { id: profileId },
      data: { completeness: score },
    });
    return this.getMine(userId);
  }
}
