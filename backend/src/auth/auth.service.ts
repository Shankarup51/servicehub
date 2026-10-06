import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { Temporal } from 'temporal-polyfill';

import { db } from '../prisma/db.js';

import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';

@Injectable()
export class AuthService {
  /**
   * Register a new user.
   */
  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUserByEmail =
      await db.orm.public.User.where({
        email: email as any,
      }).first();

    if (existingUserByEmail) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    if (registerDto.phone) {
      const phone = registerDto.phone.trim();

      const existingUserByPhone =
        await db.orm.public.User.where({
          phone: phone as any,
        }).first();

      if (existingUserByPhone) {
        throw new ConflictException(
          'Phone number is already registered',
        );
      }
    }

    const passwordHash = await argon2.hash(
      registerDto.password,
    );

    /*
     * Generate email verification token.
     *
     * Raw token:
     *   Sent to the user
     *
     * Hashed token:
     *   Stored in database
     */
    const verificationToken =
      this.generateVerificationToken();

    const tokenHash =
      this.hashToken(verificationToken);

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

      await tx.orm.public.EmailVerificationToken.create({
        userId: createdUser.id,
        tokenHash,
        expiresAt,
      });

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
      message:
        'User registered successfully. Please verify your email.',
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
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ) {
    const tokenHash =
      this.hashToken(verifyEmailDto.token);

    const verificationToken =
      await db.orm.public.EmailVerificationToken
        .where({
          tokenHash,
        })
        .first();

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
      throw new BadRequestException(
        'Email verification token has expired',
      );
    }

    const user =
      await db.orm.public.User.where({
        id: verificationToken.userId,
      }).first();

    if (!user) {
      throw new NotFoundException(
        'User associated with verification token not found',
      );
    }

    if (user.emailVerified) {
      throw new BadRequestException(
        'Email is already verified',
      );
    }

    await db.transaction(async (tx) => {
      await tx.orm.public.User.where({
        id: user.id,
      }).update({
        emailVerified: true,
      });

      await tx.orm.public.EmailVerificationToken
        .where({
          id: verificationToken.id,
        })
        .update({
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
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }
}