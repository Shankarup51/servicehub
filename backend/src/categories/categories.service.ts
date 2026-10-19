import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

export interface CategoryTreeItem {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  children: CategoryTreeItem[];
}

@Injectable()
export class CategoriesService {
  /**
   * Fetch active categories organized as a hierarchical tree for public display.
   * If includeInactive is true (administrative access), all categories are returned.
   */
  async findAll(includeInactive = false): Promise<CategoryTreeItem[]> {
    const categories = includeInactive
      ? await db.orm.public.Category.all()
      : await db.orm.public.Category.where({ isActive: true }).all();

    const categoryMap = new Map<number, CategoryTreeItem>();
    const roots: CategoryTreeItem[] = [];

    // Initialize map
    for (const cat of categories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        children: [],
      });
    }

    // Build hierarchical tree
    for (const cat of categories) {
      const item = categoryMap.get(cat.id)!;
      if (cat.parentId !== null && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(item);
      } else if (cat.parentId === null) {
        roots.push(item);
      } else if (includeInactive) {
        // Orphaned subcategory whose parent is inactive or missing
        roots.push(item);
      }
    }

    return roots;
  }

  /**
   * Fetch a single category by ID with its parent and active child subcategories.
   */
  async findOne(id: number, includeInactive = false) {
    const category = await db.orm.public.Category.where({ id })
      .include('parent')
      .include('children')
      .first();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (!includeInactive && !category.isActive) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // If viewing public catalog, enforce that parent category must also be active
    if (!includeInactive && category.parent && !category.parent.isActive) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Filter children to only active subcategories for public view
    const filteredChildren = (category.children || []).filter(
      (child) => includeInactive || child.isActive,
    );

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            description: category.parent.description,
            isActive: category.parent.isActive,
          }
        : null,
      children: filteredChildren.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parentId: c.parentId,
        isActive: c.isActive,
      })),
    };
  }

  /**
   * Create a new category. Restrict to authorized administrators.
   */
  async create(dto: CreateCategoryDto) {
    const cleanName = dto.name.trim();

    // 1. If parentId provided, verify parent exists
    if (dto.parentId !== undefined && dto.parentId !== null) {
      const parent = await db.orm.public.Category.where({
        id: dto.parentId,
      }).first();

      if (!parent) {
        throw new BadRequestException(
          `Parent category with ID ${dto.parentId} does not exist`,
        );
      }

      // Check unique constraint: [parentId, name]
      const existingChild = await db.orm.public.Category.where({
        parentId: dto.parentId,
        name: cleanName as any,
      }).first();

      if (existingChild) {
        throw new ConflictException(
          `Category with name "${cleanName}" already exists under parent category ${dto.parentId}`,
        );
      }
    } else {
      // Check unique constraint for root category: name
      const existingRoot = await db.orm.public.Category.where({
        parentId: null,
        name: cleanName as any,
      }).first();

      if (existingRoot) {
        throw new ConflictException(
          `Root category with name "${cleanName}" already exists`,
        );
      }
    }

    return db.orm.public.Category.create({
      name: cleanName as any,
      description: dto.description?.trim() ?? null,
      parentId: dto.parentId ?? null,
      isActive: dto.isActive ?? true,
    });
  }

  /**
   * Update an existing category. Restrict to authorized administrators.
   */
  async update(id: number, dto: UpdateCategoryDto) {
    const category = await db.orm.public.Category.where({ id }).first();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const targetParentId =
      dto.parentId !== undefined ? dto.parentId : category.parentId;
    const targetName =
      dto.name !== undefined ? dto.name.trim() : category.name;

    // Validate self-parenting
    if (dto.parentId !== undefined && dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    // Validate target parent exists
    if (dto.parentId !== undefined && dto.parentId !== null) {
      const parent = await db.orm.public.Category.where({
        id: dto.parentId,
      }).first();

      if (!parent) {
        throw new BadRequestException(
          `Parent category with ID ${dto.parentId} does not exist`,
        );
      }
    }

    // Check uniqueness constraint if name or parentId is updated
    if (
      (dto.name !== undefined && dto.name.trim() !== category.name) ||
      (dto.parentId !== undefined && dto.parentId !== category.parentId)
    ) {
      if (targetParentId !== null) {
        const existingChild = await db.orm.public.Category.where({
          parentId: targetParentId,
          name: targetName as any,
        }).first();

        if (existingChild && existingChild.id !== id) {
          throw new ConflictException(
            `Category with name "${targetName}" already exists under parent category ${targetParentId}`,
          );
        }
      } else {
        const existingRoot = await db.orm.public.Category.where({
          parentId: null,
          name: targetName as any,
        }).first();

        if (existingRoot && existingRoot.id !== id) {
          throw new ConflictException(
            `Root category with name "${targetName}" already exists`,
          );
        }
      }
    }

    const updatePayload: Record<string, any> = {};
    if (dto.name !== undefined) updatePayload.name = targetName;
    if (dto.description !== undefined)
      updatePayload.description = dto.description?.trim() ?? null;
    if (dto.parentId !== undefined) updatePayload.parentId = dto.parentId;
    if (dto.isActive !== undefined) updatePayload.isActive = dto.isActive;

    if (Object.keys(updatePayload).length === 0) {
      return category;
    }

    return db.orm.public.Category.where({ id }).update(updatePayload as any);
  }

  /**
   * Delete a category. Inspect relationships before deletion.
   * If child subcategories or associated services exist, reject deletion with 409 Conflict.
   */
  async delete(id: number) {
    const category = await db.orm.public.Category.where({ id }).first();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // 1. Inspect child categories
    const children = await db.orm.public.Category.where({ parentId: id }).all();
    if (children.length > 0) {
      throw new ConflictException(
        `Cannot delete category: it has ${children.length} child subcategory/subcategories. Delete or reassign child categories first.`,
      );
    }

    // 2. Inspect associated services
    const services = await db.orm.public.Service.where({ categoryId: id }).all();
    if (services.length > 0) {
      throw new ConflictException(
        `Cannot delete category: it has ${services.length} associated service(s). Deactivate or reassign services first.`,
      );
    }

    // 3. Inspect coupon category relationships
    const couponCategories = await db.orm.public.CouponCategory.where({
      categoryId: id,
    }).all();
    if (couponCategories.length > 0) {
      throw new ConflictException(
        `Cannot delete category: it is referenced by ${couponCategories.length} promotional coupon(s). Remove coupon associations first.`,
      );
    }

    await db.orm.public.Category.where({ id }).delete();

    return {
      message: `Category "${category.name}" (ID: ${id}) deleted successfully`,
    };
  }
}
