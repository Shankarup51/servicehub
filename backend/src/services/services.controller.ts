import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ServicesService } from './services.service.js';
import { QueryServicesDto } from './dto/query-services.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { CreateServiceImageDto } from './dto/create-service-image.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({
    summary: 'Browse public services catalog',
    description:
      'Search, filter, and paginate through active services from verified and active providers. Excludes inactive services, inactive categories, and unapproved providers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of active public catalog services',
  })
  findAll(@Query() query: QueryServicesDto) {
    return this.servicesService.findAll(query);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('services:read')
  @ApiOperation({
    summary: 'Get provider own services (Provider)',
    description:
      'Returns all catalog services owned by the authenticated service provider, including inactive services.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of services owned by the authenticated provider',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not a provider or missing services:read permission',
  })
  findMine(@Req() req: AuthenticatedRequest) {
    return this.servicesService.findProviderServices(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service details by ID',
    description:
      'Returns public service details, category metadata, active provider profile, and gallery images.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service details',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or inactive',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('services:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new service (Provider)',
    description:
      'Creates a new service under the authenticated provider profile. Requires an active, approved provider profile and services:create permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or referenced category is inactive',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - provider not approved or missing permission',
  })
  @ApiResponse({
    status: 409,
    description: 'Provider already offers a service with this title',
  })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.servicesService.create(req.user.userId, createServiceDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('services:update')
  @ApiOperation({
    summary: 'Update service (Provider)',
    description:
      'Updates details, price, duration, category, or status of an existing service owned by the provider.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or referenced category is inactive',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this service',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Service title conflicts with another service by this provider',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(
      id,
      req.user.userId,
      updateServiceDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('services:delete')
  @ApiOperation({
    summary: 'Delete or deactivate service (Provider)',
    description:
      'Deletes an unused service. If bookings or active holds exist, gracefully deactivates the service instead of hard deleting to preserve order history.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service deleted or deactivated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this service',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.servicesService.delete(id, req.user.userId);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('services:update')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add image to service gallery (Provider)',
    description:
      'Adds image metadata to a service owned by the provider. If isPrimary is true, updates existing primary image.',
  })
  @ApiResponse({
    status: 201,
    description: 'Service image registered successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this service',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  addImage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() createServiceImageDto: CreateServiceImageDto,
  ) {
    return this.servicesService.addImage(
      id,
      req.user.userId,
      createServiceImageDto,
    );
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('services:update')
  @ApiOperation({
    summary: 'Remove image from service gallery (Provider)',
    description: 'Deletes an image from a service owned by the provider.',
  })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this service',
  })
  @ApiResponse({
    status: 404,
    description: 'Service or image not found',
  })
  deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.servicesService.deleteImage(
      id,
      imageId,
      req.user.userId,
    );
  }
}
