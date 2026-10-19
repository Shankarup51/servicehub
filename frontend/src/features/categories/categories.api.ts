import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { API_TAGS } from "@/shared/api/api-tags";
import type {
  Category,
  CategoryDeleteResponse,
  CategoryDetail,
  CategoryTreeItem,
  CreateCategoryRequest,
  QueryCategoriesParams,
  UpdateCategoryRequest,
} from "./categories.types";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<CategoryTreeItem[], QueryCategoriesParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.categories.list,
        params: params?.all ? { all: "true" } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((cat) => ({
                type: API_TAGS.Category,
                id: cat.id,
              })),
              { type: API_TAGS.Category, id: "LIST" },
            ]
          : [{ type: API_TAGS.Category, id: "LIST" }],
    }),

    getCategoryById: builder.query<CategoryDetail, number | string>({
      query: (id) => API_ENDPOINTS.categories.detail(id),
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Category, id: Number(id) },
      ],
    }),

    createCategory: builder.mutation<Category, CreateCategoryRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.categories.create,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: API_TAGS.Category, id: "LIST" }],
    }),

    updateCategory: builder.mutation<
      Category,
      { id: number | string; data: UpdateCategoryRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.categories.update(id),
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Category, id: Number(id) },
        { type: API_TAGS.Category, id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation<CategoryDeleteResponse, number | string>({
      query: (id) => ({
        url: API_ENDPOINTS.categories.delete(id),
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.Category, id: Number(id) },
        { type: API_TAGS.Category, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
