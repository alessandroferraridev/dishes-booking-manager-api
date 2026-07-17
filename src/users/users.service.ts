import { ConflictException, Injectable } from '@nestjs/common';
import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

type CreatePasswordUserInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

type FindOrCreateOAuthUserInput = {
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createPasswordUser(input: CreatePasswordUserInput) {
    const existingUser = await this.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.CUSTOMER,
      },
    });
  }

  async findOrCreateOAuthUser(input: FindOrCreateOAuthUserInput) {
    const existingAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingAccount) {
      return existingAccount.user;
    }

    const existingUser = await this.findByEmail(input.email);

    if (existingUser) {
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          accounts: {
            create: {
              provider: input.provider,
              providerAccountId: input.providerAccountId,
              email: input.email,
            },
          },
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.CUSTOMER,
        accounts: {
          create: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
            email: input.email,
          },
        },
      },
    });
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  clearRefreshTokenHash(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }
}
