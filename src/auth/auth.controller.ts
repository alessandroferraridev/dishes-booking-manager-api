import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { AppleLoginDto, GoogleLoginDto, LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { type AuthenticatedUser } from './strategies/jwt.strategy';
import { CurrentUser } from './decorators/current-user.decorator';

type AuthCookiePayload = {
  accessToken: string;
  refreshToken: string;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a customer user' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);

    this.setAuthCookies(response, result.tokens);

    return {
      user: result.user,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);

    this.setAuthCookies(response, result.tokens);

    return {
      user: result.user,
    };
  }

  @Post('google')
  @ApiOperation({ summary: 'Login with Google identity token' })
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithGoogle(dto);

    this.setAuthCookies(response, result.tokens);

    return {
      user: result.user,
    };
  }

  @Post('apple')
  @ApiOperation({ summary: 'Login with Apple identity token' })
  async appleLogin(
    @Body() dto: AppleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithApple(dto);

    this.setAuthCookies(response, result.tokens);

    return {
      user: result.user,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = await this.authService.verifyRefreshToken(refreshToken);
    const result = await this.authService.refresh(payload.sub, refreshToken);

    this.setAuthCookies(response, result.tokens);

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout current user' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token as string | undefined;

    if (refreshToken) {
      const payload = await this.authService.verifyRefreshToken(refreshToken);
      await this.authService.logout(payload.sub);
    }

    this.clearAuthCookies(response);

    return {
      success: true,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Return current authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return {
      user,
    };
  }

  private setAuthCookies(response: Response, tokens: AuthCookiePayload) {
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(response: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    response.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth/refresh',
    });
  }
}
