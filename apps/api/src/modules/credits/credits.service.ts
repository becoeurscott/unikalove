import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreditType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Append-only credit ledger. A balance is SUM(delta), never a mutable counter,
 * so a double-grant shows up in the audit trail instead of vanishing into a
 * silently-wrong number.
 */
@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async balance(userId: string, type: CreditType): Promise<number> {
    const agg = await this.prisma.creditLedger.aggregate({
      where: { userId, type },
      _sum: { delta: true },
    });
    return agg._sum.delta ?? 0;
  }

  async balances(userId: string): Promise<Record<CreditType, number>> {
    const rows = await this.prisma.creditLedger.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { delta: true },
    });
    const out = { BOOST: 0, SUPER_LIKE: 0, SPOTLIGHT: 0 } as Record<CreditType, number>;
    for (const r of rows) out[r.type] = r._sum.delta ?? 0;
    return out;
  }

  /** Grant credits. `paymentId` ties the grant to what paid for it. */
  async grant(
    userId: string,
    type: CreditType,
    qty: number,
    reason: string,
    paymentId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.creditLedger.create({
      data: { userId, type, delta: qty, reason, paymentId },
    });
  }

  /**
   * Spend one credit. The balance re-read and the insert run in one
   * transaction with the user's rows locked — without the lock two concurrent
   * boosts both pass the check and the balance goes negative.
   */
  async spend(userId: string, type: CreditType, reason: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      // Serialise concurrent spends on the owning User row. Postgres rejects
      // FOR UPDATE alongside an aggregate, so we lock the user, then sum.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const summed = await tx.creditLedger.aggregate({
        where: { userId, type },
        _sum: { delta: true },
      });
      const current = summed._sum.delta ?? 0;
      if (current < 1) {
        throw new BadRequestException(`Crédit ${type} insuffisant`);
      }
      await tx.creditLedger.create({
        data: { userId, type, delta: -1, reason },
      });
      return current - 1;
    });
  }

  /** Spend if available; return false instead of throwing when empty. */
  async trySpend(userId: string, type: CreditType, reason: string): Promise<boolean> {
    try {
      await this.spend(userId, type, reason);
      return true;
    } catch (err) {
      if (err instanceof BadRequestException) return false;
      throw err;
    }
  }

  history(userId: string, take = 50) {
    return this.prisma.creditLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
