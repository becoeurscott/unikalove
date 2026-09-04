import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  plan: string;
  /**
   * When a paid plan lapses. Mobile money cannot auto-renew, so this is a real
   * deadline the member has to see, not an implementation detail.
   */
  planExpiresAt?: Date | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
