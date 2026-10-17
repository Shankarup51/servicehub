import { cn as baseCn } from "cn";
import { type ClassValue } from "clsx";

/**
 * Standard utility function to merge class names with Tailwind class conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return baseCn(...inputs);
}
