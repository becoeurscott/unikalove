import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto } from './dto/safety.dto';

@Injectable()
export class SafetyService {
  constructor(private prisma: PrismaService) {}

  async report(reporterId: string, dto: CreateReportDto) {
    if (dto.reportedId === reporterId) throw new BadRequestException('Cannot report yourself');
    return this.prisma.report.create({
      data: {
        reporterId,
        reportedId: dto.reportedId,
        category: dto.category,
        details: dto.details,
      },
    });
  }

  async block(blockerId: string, blockedId: string) {
    if (blockedId === blockerId) throw new BadRequestException('Cannot block yourself');
    const block = await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    // A block ends any active match between the two users.
    const [userAId, userBId] = [blockerId, blockedId].sort();
    await this.prisma.match.updateMany({
      where: { userAId, userBId, status: 'ACTIVE' },
      data: { status: 'UNMATCHED' },
    });
    return block;
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }

  listBlocks(blockerId: string) {
    return this.prisma.block.findMany({
      where: { blockerId },
      include: {
        blocked: { select: { id: true, profile: { select: { displayName: true } } } },
      },
    });
  }

  /** Moderator queue. */
  listReports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reporter: { select: { id: true, email: true } },
        reported: { select: { id: true, email: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async resolveReport(id: string, status: ReportStatus) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.report.update({ where: { id }, data: { status } });
  }
}
