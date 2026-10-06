import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  async findAll() {
    return db.orm.public.User.all();
  }

  async findOne(id: number) {
    const user = await db.orm.public.User.where({ id }).first();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    return db.orm.public.User.create({
      email: createUserDto.email as any,
      passwordHash: createUserDto.passwordHash,
      firstName: createUserDto.firstName as any,
      lastName: (createUserDto.lastName ?? null) as any,
      phone: (createUserDto.phone ?? null) as any,
    });
  }

  async update(id: number, updateUserDto?: UpdateUserDto) {
    const user = await this.findOne(id);

    if (!updateUserDto || typeof updateUserDto !== 'object') {
      return user;
    }

    const data: Record<string, any> = {};

    if (updateUserDto.firstName !== undefined) data.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) data.lastName = updateUserDto.lastName;
    if (updateUserDto.phone !== undefined) data.phone = updateUserDto.phone;
    if (updateUserDto.email !== undefined) data.email = updateUserDto.email;

    if (Object.keys(data).length === 0) {
      return user;
    }

    return db.orm.public.User.where({ id }).update(data as any);
  }
}
