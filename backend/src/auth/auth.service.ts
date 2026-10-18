import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { Temporal } from 'temporal-polyfill';

import { db } from '../prisma/db.js';

import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service.js';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}
  /**
   * Register a new user.
   */
  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUserByEmail = await db.orm.public.User.where({
      email: email as any,
    }).first();

    if (existingUserByEmail) {
      throw new ConflictException('Email is already registered');
    }

    if (registerDto.phone) {
      const phone = registerDto.phone.trim();

      const existingUserByPhone = await db.orm.public.User.where({
        phone: phone as any,
      }).first();

      if (existingUserByPhone) {
        throw new ConflictException('Phone number is already registered');
      }
    }

    const passwordHash = await argon2.hash(registerDto.password);

    /*
     * Generate email verification token.
     *
     * Raw token:
     *   Sent to the user
     *
     * Hashed token:
     *   Stored in database
     */
    const verificationToken = this.generateVerificationToken();

    const tokenHash = this.hashToken(verificationToken);

    const expiresAt = Temporal.Now.instant().add({
      hours: 24,
    });

    const user = await db.transaction(async (tx) => {
      const createdUser = await tx.orm.public.User.create({
        email: email as any,
        passwordHash,
        firstName: registerDto.firstName.trim() as any,
        lastName: (registerDto.lastName?.trim() ?? null) as any,
        phone: (registerDto.phone?.trim() ?? null) as any,
      });

      const customerRole = await tx.orm.public.Role.where({
        name: 'CUSTOMER' as any,
      }).first();

      if (!customerRole) {
        throw new InternalServerErrorException(
          'Default role CUSTOMER not found. Registration aborted.',
        );
      }

      await tx.orm.public.UserRole.create({
        userId: createdUser.id,
        roleId: customerRole.id,
      });

      await tx.orm.public.EmailVerificationToken.create({
        userId: createdUser.id,
        tokenHash,
        expiresAt,
      });

      await this.emailService.sendVerificationEmail(
        email,
        registerDto.firstName,
        verificationToken,
      );

      return createdUser;
    });

    /*
     * Development-only email simulation.
     *
     * Later this will be replaced with a real
     * EmailService.
     */
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[DEV EMAIL] Verification token for ${user.email}: ${verificationToken}`,
      );
    }

    return {
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Verify a user's email address.
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const tokenHash = this.hashToken(verifyEmailDto.token);

    const verificationToken = await db.orm.public.EmailVerificationToken.where({
      tokenHash,
    }).first();

    if (!verificationToken) {
      throw new BadRequestException(
        'Invalid or expired email verification token',
      );
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException(
        'Email verification token has already been used',
      );
    }

    if (
      Temporal.Instant.compare(
        verificationToken.expiresAt,
        Temporal.Now.instant(),
      ) <= 0
    ) {
      throw new BadRequestException('Email verification token has expired');
    }

    const user = await db.orm.public.User.where({
      id: verificationToken.userId,
    }).first();

    if (!user) {
      throw new NotFoundException(
        'User associated with verification token not found',
      );
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await db.transaction(async (tx) => {
      await tx.orm.public.User.where({
        id: user.id,
      }).update({
        emailVerified: true,
      });

      await tx.orm.public.EmailVerificationToken.where({
        id: verificationToken.id,
      }).update({
        usedAt: Temporal.Now.instant(),
      });
    });

    return {
      message: 'Email verified successfully',
    };
  }

  /**
   * Generate a cryptographically secure verification token.
   *
   * 32 random bytes = 64 hexadecimal characters.
   */
  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hash a token before storing/comparing it.
   *
   * The raw token is never stored in the database.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await db.orm.public.User.where({
      email: email as any,
    }).first();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your account has been suspended');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = this.generateVerificationToken();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = Temporal.Now.instant().add({ hours: 168 });
    await db.orm.public.RefreshToken.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const userRoles = await db.orm.public.UserRole.where({
      userId: user.id,
    })
      .include('role')
      .all();

    const roles = userRoles.map((ur) => ur.role.name);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshTokenExpiresAt: expiresAt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailVerified: user.emailVerified,
        status: user.status,
        roles,
        role: roles[0] ?? null,
      },
    };
  }
  async refresh(refreshTokenDto: RefreshTokenDto) {
    const oldTokenHash = this.hashToken(refreshTokenDto.refreshToken);

    const now = Temporal.Now.instant();

    const result = await db.transaction(async (tx) => {
      const oldToken = await tx.orm.public.RefreshToken.where({
        tokenHash: oldTokenHash,
      }).first();

      if (
        !oldToken ||
        oldToken.revokedAt ||
        Temporal.Instant.compare(oldToken.expiresAt, now) <= 0
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = await tx.orm.public.User.where({
        id: oldToken.userId,
      }).first();

      if (!user || !user.emailVerified || user.status === 'SUSPENDED') {
        throw new UnauthorizedException('Refresh token is no longer valid');
      }

      // Revoke the existing token before creating its replacement.
      // The conditional update prevents a token already revoked
      // by another request from being rotated again.
      const revokedToken = await tx.orm.public.RefreshToken.where({
        id: oldToken.id,
        revokedAt: null,
      }).update({
        revokedAt: now,
      });

      if (!revokedToken) {
        throw new UnauthorizedException('Refresh token has already been used');
      }

      const newRefreshToken = this.generateVerificationToken();
      const newTokenHash = this.hashToken(newRefreshToken);

      const newExpiresAt = now.add({ hours: 168 });

      await tx.orm.public.RefreshToken.create({
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      });

      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: newExpiresAt,
      };
    });

    return {
      message: 'Token refreshed successfully',
      ...result,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const tokenHash = this.hashToken(refreshTokenDto.refreshToken);

    const refreshToken = await db.orm.public.RefreshToken.where({
      tokenHash,
    }).first();

    // Make logout idempotent: an unknown or already-revoked
    // token does not prevent the client from logging out.
    if (refreshToken && !refreshToken.revokedAt) {
      const revokedAt = Temporal.Now.instant();

      await db.orm.public.RefreshToken.where({ id: refreshToken.id }).update({
        revokedAt,
      });
    }

    return {
      message: 'Logout successful',
    };
  }
}
