
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { db } from '../../prisma/db.js';

export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;

    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error(
        'JWT_SECRET must be configured and contain at least 32 bytes',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: 'servicehub-api',
      audience: 'servicehub-client',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const user = await db.orm.public.User.where({
      id: payload.sub,
    }).first();

    if (
      !user ||
      !user.emailVerified ||
      user.status === 'SUSPENDED'
    ) {
      throw new UnauthorizedException(
        'Access token is no longer valid',
      );
    }

    return {
      userId: user.id,
      email: user.email,
    };
  }
}
