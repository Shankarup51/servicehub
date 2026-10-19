import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { API_TAGS } from "@/shared/api/api-tags";
import type {
  CreateServiceImageRequest,
  CreateServiceRequest,
  PaginatedServicesResponse,
  QueryServicesParams,
  ServiceActionResponse,
  ServiceDetail,
  ServiceImage,
  ServiceListItem,
  UpdateServiceRequest,
} from "./services.types";

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<PaginatedServicesResponse, QueryServicesParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.services.list,
        params: params ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        ) : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((srv) => ({
                type: API_TAGS.Service,
                id: srv.id,
              })),
              { type: API_TAGS.Service, id: "LIST" },
            ]
          : [{ type: API_TAGS.Service, id: "LIST" }],
    }),

    getMineServices: builder.query<ServiceListItem[], void>({
      query: () => API_ENDPOINTS.services.mine,
      providesTags: (result) =>
        result
          ? [
              ...result.map((srv) => ({
                type: API_TAGS.Service,
                id: srv.id,
              })),
              { type: API_TAGS.Service, id: "PROVIDER_MINE" },
            ]
          : [{ type: API_TAGS.Service, id: "PROVIDER_MINE" }],
    }),

    getServiceById: builder.query<ServiceDetail, number | string>({
      query: (id) => API_ENDPOINTS.services.detail(id),
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Service, id: Number(id) },
      ],
    }),

    createService: builder.mutation<ServiceListItem, CreateServiceRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.services.create,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Service, id: "LIST" },
        { type: API_TAGS.Service, id: "PROVIDER_MINE" },
      ],
    }),

    updateService: builder.mutation<
      ServiceListItem,
      { id: number | string; data: UpdateServiceRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.services.update(id),
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Service, id: Number(id) },
        { type: API_TAGS.Service, id: "LIST" },
        { type: API_TAGS.Service, id: "PROVIDER_MINE" },
      ],
    }),

    deleteService: builder.mutation<ServiceActionResponse, number | string>({
      query: (id) => ({
        url: API_ENDPOINTS.services.delete(id),
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.Service, id: Number(id) },
        { type: API_TAGS.Service, id: "LIST" },
        { type: API_TAGS.Service, id: "PROVIDER_MINE" },
      ],
    }),

    addServiceImage: builder.mutation<
      ServiceImage,
      { id: number | string; data: CreateServiceImageRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.services.addImage(id),
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Service, id: Number(id) },
      ],
    }),

    deleteServiceImage: builder.mutation<
      ServiceActionResponse,
      { id: number | string; imageId: number | string }
    >({
      query: ({ id, imageId }) => ({
        url: API_ENDPOINTS.services.deleteImage(id, imageId),
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Service, id: Number(id) },
      ],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetMineServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useAddServiceImageMutation,
  useDeleteServiceImageMutation,
} = servicesApi;
