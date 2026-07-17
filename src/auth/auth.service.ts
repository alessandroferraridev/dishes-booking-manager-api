import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthProvider, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import {
  LoginDto,
  RegisterDto,
  AppleLoginDto,
  GoogleLoginDto,
} from '../auth/dto';
import { OAuth2Client } from 'google-auth-library';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

const appleJwksUrl = new URL('https://appleid.apple.com/auth/keys');
let appleJwksPromise: ReturnType<typeof createAppleJwks> | null = null;

async function createAppleJwks() {
  const { createRemoteJWKSet } = await import('jose');

  return createRemoteJWKSet(appleJwksUrl);
}

async function verifyAppleIdToken(idToken: string, audience: string) {
  const { jwtVerify } = await import('jose');

  appleJwksPromise ??= createAppleJwks();
  const appleJwks = await appleJwksPromise;

  return jwtVerify(idToken, appleJwks, {
    issuer: 'https://appleid.apple.com',
    audience,
  });
}

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private async createSession(user: User) {
    const tokens = await this.generateTokens(user);

    await this.usersService.updateRefreshTokenHash(
      user.id,
      tokens.refreshToken,
    );

    return {
      user: this.toSafeUser(user),
      tokens,
    };
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.createPasswordUser(dto);

    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: getRequiredEnv('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const user = await this.usersService.findOrCreateOAuthUser({
      provider: AuthProvider.GOOGLE,
      providerAccountId: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
    });

    return this.createSession(user);
  }

  async loginWithApple(dto: AppleLoginDto) {
    const { payload } = await verifyAppleIdToken(
      dto.idToken,
      getRequiredEnv('APPLE_CLIENT_ID'),
    );

    const providerAccountId = payload.sub;
    const email = payload.email;

    if (typeof providerAccountId !== 'string' || typeof email !== 'string') {
      throw new UnauthorizedException('Invalid Apple token');
    }

    const user = await this.usersService.findOrCreateOAuthUser({
      provider: AuthProvider.APPLE,
      providerAccountId,
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return this.createSession(user);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.createSession(user);
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshTokenHash(userId);

    return {
      success: true,
    };
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenOptions: JwtSignOptions = {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
        '15m') as JwtSignOptions['expiresIn'],
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
        '7d') as JwtSignOptions['expiresIn'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessTokenOptions),
      this.jwtService.signAsync(payload, refreshTokenOptions),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
