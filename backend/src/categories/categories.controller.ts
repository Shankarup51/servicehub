import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { PermissionsService } from '../auth/permissions.service.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List active service categories',
    description:
      'Returns active service categories organized as a hierarchical tree for public catalog browsing. The all=true query parameter requires categories:manage permission.',
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description: 'Include inactive categories (requires admin categories:manage permission)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active category tree nodes',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - all=true requires categories:manage permission',
  })
  async findAll(@Req() req: Request, @Query('all') all?: string) {
    let includeInactive = false;

    if (all === 'true') {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ForbiddenException(
          'Viewing inactive categories requires categories:manage permission',
        );
      }

      const token = authHeader.split(' ')[1];
      try {
        const payload = await this.jwtService.verifyAsync(token);
        const { permissions } =
          await this.permissionsService.getUserRolesAndPermissions(payload.sub);

        if (!permissions.has('categories:manage')) {
          throw new ForbiddenException(
            'Viewing inactive categories requires categories:manage permission',
          );
        }
        includeInactive = true;
      } catch (err: any) {
        if (err instanceof ForbiddenException) throw err;
        throw new ForbiddenException(
          'Viewing inactive categories requires a valid session with categories:manage permission',
        );
      }
    }

    return this.categoriesService.findAll(includeInactive);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category details by ID',
    description:
      'Returns public category information, parent metadata, and active child subcategories.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category details with active subcategories',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or inactive',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new category (Admin)',
    description:
      'Creates a root or child service category. Requires categories:manage permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or parent category not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - missing categories:manage permission',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with the same name already exists in this scope',
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:manage')
  @ApiOperation({
    summary: 'Update category (Admin)',
    description:
      'Updates category name, description, parent, or active state. Requires categories:manage permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or self-parenting loop',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with the same name already exists in target parent',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:manage')
  @ApiOperation({
    summary: 'Delete category (Admin)',
    description:
      'Deletes an unused category. Rejects deletion with 409 Conflict if child subcategories or services exist.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete: category has dependent subcategories or services',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.delete(id);
  }
}
