import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PermissionCode,
} from '../decorators/permissions.decorator.js';
import { PermissionsService } from '../permissions.service.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionCode[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // Routes without permission metadata inherit existing auth behavior
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verify authentication was completed prior to permission check
    if (!user || typeof user.userId !== 'number') {
      throw new UnauthorizedException(
        'Authentication required before verifying permissions',
      );
    }

    // Load active role assignments and granted permissions from database
    const { roles, permissions } =
      await this.permissionsService.getUserRolesAndPermissions(user.userId);

    if (roles.length === 0) {
      throw new ForbiddenException('Access denied: user has no assigned roles');
    }

    // Verify all required permissions are satisfied
    const missingPermissions = requiredPermissions.filter(
      (perm) => !permissions.has(perm),
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Access denied: missing required permissions (${missingPermissions.join(', ')})`,
      );
    }

    return true;
  }
}
