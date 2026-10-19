import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service.js';
import { db } from '../prisma/db.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should build a hierarchical category tree with root and nested children', async () => {
      const mockCategories = [
        {
          id: 1,
          parentId: null,
          name: 'Home Cleaning',
          description: 'Cleaning services',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          parentId: 1,
          name: 'Sofa Cleaning',
          description: 'Sofa cleaning',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue(mockCategories),
      } as any);

      const tree = await service.findAll(false);
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if category does not exist', async () => {
      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if category is inactive in public catalog', async () => {
      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 5,
          name: 'Archived',
          isActive: false,
          children: [],
        }),
      } as any);

      await expect(service.findOne(5, false)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if parent category is inactive in public catalog', async () => {
      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 10,
          name: 'Sub Under Inactive Parent',
          isActive: true,
          parentId: 1,
          parent: { id: 1, name: 'Inactive Root', isActive: false },
          children: [],
        }),
      } as any);

      await expect(service.findOne(10, false)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if parent category does not exist', async () => {
      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.create({ name: 'Sub', parentId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if category attempts self-parenting', async () => {
      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 5,
          name: 'Test',
          parentId: null,
          isActive: true,
        }),
      } as any);

      await expect(
        service.update(5, { parentId: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should reject deletion with ConflictException if child categories exist', async () => {
      jest.spyOn(db.orm.public.Category, 'where').mockImplementation((criteria: any) => {
        if (criteria?.id === 1) {
          return { first: jest.fn().mockResolvedValue({ id: 1, name: 'Root' }) } as any;
        }
        if (criteria?.parentId === 1) {
          return { all: jest.fn().mockResolvedValue([{ id: 2, parentId: 1 }]) } as any;
        }
        return { all: jest.fn().mockResolvedValue([]) } as any;
      });

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
    });
  });
});
