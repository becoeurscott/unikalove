import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotImplementedException,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const REFRESH_COOKIE = 'unika_refresh';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /**
   * The API and the web app sit on different sites in production
   * (app.unikalove.com vs the API host), so a `lax` cookie is never sent on the
   * cross-site refresh call and sessions die after the 15-minute access token
   * expires. `none` fixes that, and browsers only accept it over HTTPS — hence
   * the forced `secure`. Local dev stays on `lax` (plain http).
   */
  private cookieOptions() {
    const sameSite = (process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase() as
      | 'lax'
      | 'none'
      | 'strict';
    return {
      httpOnly: true,
      sameSite,
      // SameSite=None is rejected by browsers unless the cookie is Secure.
      secure: sameSite === 'none' || process.env.NODE_ENV === 'production',
      path: '/api/v1/auth',
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7) * 86_400_000,
    });
  }

  @Public()
  @Throttle({ auth: { limit: 8, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.auth.register(dto.email, dto.password);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @HttpCode(200)
  @Throttle({ auth: { limit: 8, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.auth.login(dto.email, dto.password);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.auth.refresh(
      req.cookies?.[REFRESH_COOKIE],
    );
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Public()
  @HttpCode(202)
  @Throttle({ auth: { limit: 8, ttl: 60_000 } })
  @Post('forgot-password')
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { message: 'If the account exists, a reset link has been sent.' };
  }

  @Public()
  @HttpCode(204)
  @Throttle({ auth: { limit: 8, ttl: 60_000 } })
  @Post('reset-password')
  async reset(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
  }

  /** OAuth providers land once client keys are configured (Phase 5). */
  @Public()
  @Get('oauth/:provider')
  oauth(@Param('provider') provider: string) {
    throw new NotImplementedException(`OAuth via ${provider} not configured yet`);
  }
}
