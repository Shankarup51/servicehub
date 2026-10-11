
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

import type { StringValue } from 'ms';

const jwtSecret = process.env.JWT_SECRET;
const expires = (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m') as StringValue;

if (!jwtSecret || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
  throw new Error(
    'JWT_SECRET must be configured and contain at least 32 bytes',
  );
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: {
        expiresIn: expires,
        issuer: 'servicehub-api',
        audience: 'servicehub-client',
        algorithm: 'HS256',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
