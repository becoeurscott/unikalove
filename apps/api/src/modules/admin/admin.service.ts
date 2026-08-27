import { Injectable } from '@nestjs/common';
import { Prisma, ReportStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private safety: SafetyService,
  ) {}

  private audit(actorId: string, action: string, targetType?: string, targetId?: string, meta?: object) {
    return this.prisma.adminAuditLog.create({
      data: { actorId, action, targetType, targetId, meta: meta as Prisma.InputJsonValue },
    });
  }

  /** KPI aggregates + 7-day growth series powering the dashboard mockup. */
  async kpis() {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const [totalUsers, totalMatches, totalConversations, usersLastWeek, matchesLastWeek] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.match.count(),
        this.prisma.conversation.count(),
        this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.match.count({ where: { matchedAt: { gte: weekAgo } } }),
      ]);

    // Cumulative total per day over the last 7 days (rising curve like the mockup).
    const growth = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(
          (NOW() - INTERVAL '6 days')::date, NOW()::date, INTERVAL '1 day'
        )::date AS day
      )
      SELECT d.day,
        (SELECT COUNT(*)::int FROM "User" u
          WHERE u."createdAt" < d.day + INTERVAL '1 day' AND u."deletedAt" IS NULL) AS count
      FROM days d ORDER BY d.day
    `);

    const genderRows = await this.prisma.profile.groupBy({
      by: ['gender'],
      _count: { _all: true },
      where: { deletedAt: null },
    });

    const matchRows = await this.prisma.match.groupBy({ by: ['status'], _count: { _all: true } });

    return {
      totals: {
        users: totalUsers,
        matches: totalMatches,
        conversations: totalConversations,
        revenue: 0, // lands with the payments provider in Phase 5
      },
      lastWeek: { newUsers: usersLastWeek, newMatches: matchesLastWeek },
      userGrowth: growth.map((r) => ({ day: r.day, count: r.count })),
      genderDistribution: genderRows.map((g) => ({ gender: g.gender, count: g._count._all })),
      matchesOverview: matchRows.map((m) => ({ status: m.status, count: m._count._all })),
    };
  }

  /** Top 5 users by active-match count (dashboard avatar list). */
  async topUsers() {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT u.id, p."displayName", p.city, p.verified, COUNT(m.id)::int AS matches
      FROM "User" u
      JOIN "Profile" p ON p."userId" = u.id
      JOIN "Match" m ON (m."userAId" = u.id OR m."userBId" = u.id) AND m.status = 'ACTIVE'
      WHERE u."deletedAt" IS NULL
      GROUP BY u.id, p."displayName", p.city, p.verified
      ORDER BY matches DESC
      LIMIT 5
    `);
    return rows;
  }

  /** Last 10 platform events for the recent-activity feed. */
  async recentActivity() {
    const [users, matches, messages, verifications] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { createdAt: true, profile: { select: { displayName: true } } },
      }),
      this.prisma.match.findMany({ orderBy: { matchedAt: 'desc' }, take: 5, select: { matchedAt: true } }),
      this.prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { createdAt: true } }),
      this.prisma.verificationRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { createdAt: true },
      }),
    ]);
    const events = [
      ...users.map((u) => ({
        type: 'user_registered',
        label: `New user registered${u.profile ? ` — ${u.profile.displayName}` : ''}`,
        at: u.createdAt,
      })),
      ...matches.map((m) => ({ type: 'match_created', label: 'New match created', at: m.matchedAt })),
      ...messages.map((m) => ({ type: 'message', label: 'New message sent', at: m.createdAt })),
      ...verifications.map((v) => ({
        type: 'verification',
        label: 'New verification request',
        at: v.createdAt,
      })),
    ];
    return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 10);
  }

  /** Payments overview: active subscriptions, MRR estimate and recent rows. */
  async payments() {
    const [byStatus, recent] = await Promise.all([
      this.prisma.subscription.groupBy({
        by: ['status', 'plan'],
        _count: { _all: true },
      }),
      this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { email: true, profile: { select: { displayName: true } } } },
        },
      }),
    ]);
    // Placeholder monthly prices in FCFA until Stripe price objects drive this.
    const MONTHLY: Record<string, number> = { FREE: 0, PREMIUM: 2500, PREMIUM_PLUS: 5000 };
    const mrr = byStatus
      .filter((row) => row.status === 'ACTIVE')
      .reduce((sum, row) => sum + (MONTHLY[row.plan] ?? 0) * row._count._all, 0);
    const activeCount = byStatus
      .filter((row) => row.status === 'ACTIVE')
      .reduce((sum, row) => sum + row._count._all, 0);
    return { mrr, currency: 'XOF', activeCount, byStatus, recent };
  }

  async listUsers(search?: string, take = 50) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        status: true,
        createdAt: true,
        profile: { select: { displayName: true, verified: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async setUserStatus(actorId: string, userId: string, status: UserStatus) {
    const result = await this.users.setStatus(userId, status);
    await this.audit(actorId, 'user.setStatus', 'User', userId, { status });
    return result;
  }

  listReports(status?: ReportStatus) {
    return this.safety.listReports(status);
  }

  async resolveReport(actorId: string, reportId: string, status: ReportStatus) {
    const result = await this.safety.resolveReport(reportId, status);
    await this.audit(actorId, 'report.resolve', 'Report', reportId, { status });
    return result;
  }

  async reviewVerification(actorId: string, id: string, approve: boolean) {
    const status = approve ? 'APPROVED' : 'REJECTED';
    const request = await this.prisma.verificationRequest.update({
      where: { id },
      data: { status, reviewedById: actorId },
    });
    if (approve) {
      await this.prisma.profile.updateMany({
        where: { userId: request.userId },
        data: { verified: true },
      });
    }
    await this.audit(actorId, 'verification.review', 'VerificationRequest', id, { status });
    return request;
  }

  listVerifications() {
    return this.prisma.verificationRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, email: true, profile: { select: { displayName: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
