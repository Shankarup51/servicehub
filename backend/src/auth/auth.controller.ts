
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  private readonly refreshCookieName = 'servicehub_refresh_token';

  private getRefreshCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  // Register
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account and initiates the email verification process.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already exists',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Verify email
  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify user email address',
    description:
      'Verifies the user email address using the verification token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid, expired, or already used verification token',
  })
  @ApiResponse({
    status: 404,
    description:
      'User associated with verification token not found',
  })
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  // Login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in a user',
    description:
      'Authenticates the user, returns an access token, and sets the refresh token in an HttpOnly cookie.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. Returns the access token and user details; sets the refresh token cookie.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Invalid credentials, unverified email, or account not permitted to log in',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid login data',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    const { refreshToken, ...response } = result;

    res.cookie(
      this.refreshCookieName,
      refreshToken,
      this.getRefreshCookieOptions(),
    );

    return response;
  }

  // Refresh access token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Reads the refresh token from the HttpOnly cookie, rotates it, and returns a new access token.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Access token refreshed successfully. Sets the rotated refresh token in the HttpOnly cookie.',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is missing, invalid, revoked, or expired',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[this.refreshCookieName];

    if (
      typeof refreshToken !== 'string' ||
      !/^[a-fA-F0-9]{64}$/.test(refreshToken)
    ) {
      throw new UnauthorizedException(
        'Invalid or missing refresh token',
      );
    }

    const result = await this.authService.refresh({ refreshToken });

    const {
      refreshToken: newRefreshToken,
      ...response
    } = result;

    res.cookie(
      this.refreshCookieName,
      newRefreshToken,
      this.getRefreshCookieOptions(),
    );

    return response;
  }

  // Logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out a user',
    description:
      'Revokes the refresh token associated with the HttpOnly cookie and clears the cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized request, if applicable',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[this.refreshCookieName];

    try {
      if (
        typeof refreshToken === 'string' &&
        /^[a-fA-F0-9]{64}$/.test(refreshToken)
      ) {
        await this.authService.logout({ refreshToken });
      }
    } finally {
      const {
        maxAge: _maxAge,
        ...clearOptions
      } = this.getRefreshCookieOptions();

      res.clearCookie(
        this.refreshCookieName,
        clearOptions,
      );
    }

    return { message: 'Logout successful' };
  }
}
