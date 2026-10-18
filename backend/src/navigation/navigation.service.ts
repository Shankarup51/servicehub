import { Injectable } from '@nestjs/common';
import { PermissionsService } from '../auth/permissions.service.js';
import { MenuItem, NavigationMenuResponse } from './navigation.types.js';
import { ROLE_MENU_CONFIG } from './navigation.config.js';

/**
 * Filters a list of menu items according to granted permissions.
 *
 * Rules:
 * 1. An item is included only if the user holds its requiredPermission.
 * 2. If an item has children:
 *    - Inaccessible children are filtered out recursively.
 *    - If all children are filtered out:
 *      - If parent has an independent accessible destination (non-empty route),
 *        it is retained without children.
 *      - If parent has no independent destination (empty route or '#'),
 *        it is omitted completely.
 */
export function filterMenuItemsByPermissions(
  items: readonly MenuItem[],
  grantedPermissions: Set<string>,
): MenuItem[] {
  const result: MenuItem[] = [];

  for (const item of items) {
    if (!grantedPermissions.has(item.requiredPermission)) {
      continue;
    }

    if (item.children && item.children.length > 0) {
      const filteredChildren = filterMenuItemsByPermissions(
        item.children,
        grantedPermissions,
      );

      if (filteredChildren.length > 0) {
        result.push({
          ...item,
          children: filteredChildren,
        });
      } else {
        // No accessible children remain.
        // Check if parent has an independently accessible destination.
        const hasIndependentDestination =
          typeof item.route === 'string' &&
          item.route.trim() !== '' &&
          item.route.trim() !== '#';

        if (hasIndependentDestination) {
          const { children, ...parentWithoutChildren } = item;
          result.push(parentWithoutChildren);
        }
      }
    } else {
      result.push({ ...item });
    }
  }

  return result;
}

/**
 * Combines menus for multiple roles, deduplicating items by stable ID.
 * If multiple roles define the same parent ID, their children are merged and deduplicated.
 */
export function mergeRoleMenus(
  roles: readonly string[],
  roleConfig: Record<string, readonly MenuItem[]> = ROLE_MENU_CONFIG,
): MenuItem[] {
  const itemsById = new Map<string, MenuItem>();

  for (const role of roles) {
    const roleItems = roleConfig[role] ?? [];
    for (const item of roleItems) {
      if (!itemsById.has(item.id)) {
        // Clone item to avoid mutating static config
        itemsById.set(item.id, {
          ...item,
          children: item.children ? [...item.children] : undefined,
        });
      } else if (item.children && item.children.length > 0) {
        // Merge children for already-existing parent
        const existing = itemsById.get(item.id)!;
        const existingChildren = existing.children
          ? [...existing.children]
          : [];
        const childIds = new Set(existingChildren.map((c) => c.id));

        for (const child of item.children) {
          if (!childIds.has(child.id)) {
            existingChildren.push(child);
            childIds.add(child.id);
          }
        }
        existing.children = existingChildren;
      }
    }
  }

  return Array.from(itemsById.values());
}

@Injectable()
export class NavigationService {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Resolves the dynamic navigation menu for an authenticated user.
   *
   * @param userId The ID of the authenticated user from JWT.
   * @returns NavigationMenuResponse containing only permitted, deduplicated menu items.
   */
  async getMenuForUser(userId: number): Promise<NavigationMenuResponse> {
    const { roles, permissions } =
      await this.permissionsService.getUserRolesAndPermissions(userId);

    // Users with no roles or permissions receive an empty menu
    if (roles.length === 0 || permissions.size === 0) {
      return { items: [] };
    }

    const mergedItems = mergeRoleMenus(roles);
    const filteredItems = filterMenuItemsByPermissions(
      mergedItems,
      permissions,
    );

    return { items: filteredItems };
  }
}
