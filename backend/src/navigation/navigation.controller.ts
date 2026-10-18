import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { NavigationService } from './navigation.service.js';
import { NavigationMenuResponse } from './navigation.types.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@ApiTags('Navigation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get('menu')
  @ApiOperation({
    summary: 'Get dynamic role- and permission-filtered navigation menu',
    description:
      'Returns the deduplicated, permission-filtered sidebar menu items for the authenticated user based on their active roles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the navigation menu items allowed for the user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized if access token is invalid or missing',
  })
  async getMenu(
    @Req() req: AuthenticatedRequest,
  ): Promise<NavigationMenuResponse> {
    return this.navigationService.getMenuForUser(req.user.userId);
  }
}
