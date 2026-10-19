export interface CategoryTreeItem {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children: CategoryTreeItem[];
}

export interface CategorySummary {
  id: number;
  name: string;
  description: string | null;
  parentId?: number | null;
  isActive: boolean;
}

export interface CategoryDetail {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent: {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
  } | null;
  children: CategorySummary[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
}

export interface QueryCategoriesParams {
  all?: boolean;
}

export interface CategoryDeleteResponse {
  message: string;
}
