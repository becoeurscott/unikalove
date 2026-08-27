import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  /** Liveness/readiness probe used by the hosting platform. */
  @Public()
  @Get('health')
  async health() {
    let database = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      /* reported as down */
    }
    return { status: database === 'up' ? 'ok' : 'degraded', database, uptime: process.uptime() };
  }
}
