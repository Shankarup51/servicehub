import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';

export interface UserRolesAndPermissions {
  roles: string[];
  permissions: Set<string>;
}

@Injectable()
export class PermissionsService {
  /**
   * Resolves active roles and effective permissions for a user from PostgreSQL.
   *
   * @param userId The ID of the authenticated user.
   * @returns Object containing role names array and a Set of permission codes.
   */
  async getUserRolesAndPermissions(
    userId: number,
  ): Promise<UserRolesAndPermissions> {
    const userRoles = await db.orm.public.UserRole.where({ userId })
      .include('role')
      .all();

    if (userRoles.length === 0) {
      return { roles: [], permissions: new Set() };
    }

    const roles = userRoles.map((ur) => ur.role.name);
    const roleIds = userRoles.map((ur) => ur.roleId);

    const rolePermissions = await db.orm.public.RolePermission.where((rp) =>
      rp.roleId.in(roleIds),
    )
      .include('permission')
      .all();

    const permissions = new Set<string>(
      rolePermissions.map((rp) => rp.permission.code),
    );

    return { roles, permissions };
  }
}
