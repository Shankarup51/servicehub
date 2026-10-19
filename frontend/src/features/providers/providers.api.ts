import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { API_TAGS } from "@/shared/api/api-tags";
import type {
  AdminRejectVerificationRequest,
  AdminVerificationDetail,
  CreateProviderProfileRequest,
  CreateServiceAreaRequest,
  CreateVerificationDocumentRequest,
  PaginatedVerificationsResponse,
  ProviderActionResponse,
  ProviderOnboardingRequest,
  ProviderOnboardingResponse,
  ProviderOwnProfile,
  ProviderServiceArea,
  ProviderVerificationDetail,
  PublicProviderProfile,
  QueryVerificationsParams,
  UpdateProviderProfileRequest,
  UpdateServiceAreaRequest,
  VerificationDocument,
} from "./providers.types";

export const providersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    onboardProvider: builder.mutation<
      ProviderOnboardingResponse,
      ProviderOnboardingRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.providers.onboard,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Provider, id: "ME" },
        { type: API_TAGS.Verification, id: "ME" },
        { type: API_TAGS.Auth },
        { type: API_TAGS.User },
      ],
    }),

    createProviderProfile: builder.mutation<
      ProviderOwnProfile,
      CreateProviderProfileRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.providers.profile,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Provider, id: "ME" },
        { type: API_TAGS.Verification, id: "ME" },
      ],
    }),

    getOwnProviderProfile: builder.query<ProviderOwnProfile, void>({
      query: () => API_ENDPOINTS.providers.meProfile,
      providesTags: [{ type: API_TAGS.Provider, id: "ME" }],
    }),

    updateOwnProviderProfile: builder.mutation<
      ProviderOwnProfile,
      UpdateProviderProfileRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.providers.meProfile,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: API_TAGS.Provider, id: "ME" }],
    }),

    getPublicProviderProfile: builder.query<
      PublicProviderProfile,
      number | string
    >({
      query: (id) => API_ENDPOINTS.providers.detail(id),
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Provider, id: Number(id) },
      ],
    }),

    getOwnServiceAreas: builder.query<ProviderServiceArea[], void>({
      query: () => API_ENDPOINTS.providers.serviceAreas,
      providesTags: [{ type: API_TAGS.Provider, id: "AREAS" }],
    }),

    addServiceArea: builder.mutation<
      ProviderServiceArea,
      CreateServiceAreaRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.providers.serviceAreas,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Provider, id: "AREAS" },
        { type: API_TAGS.Provider, id: "ME" },
      ],
    }),

    updateServiceArea: builder.mutation<
      ProviderServiceArea,
      { id: number | string; data: UpdateServiceAreaRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.providers.serviceAreaDetail(id),
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [
        { type: API_TAGS.Provider, id: "AREAS" },
        { type: API_TAGS.Provider, id: "ME" },
      ],
    }),

    deleteServiceArea: builder.mutation<
      ProviderActionResponse,
      number | string
    >({
      query: (id) => ({
        url: API_ENDPOINTS.providers.serviceAreaDetail(id),
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: API_TAGS.Provider, id: "AREAS" },
        { type: API_TAGS.Provider, id: "ME" },
      ],
    }),

    getOwnVerification: builder.query<ProviderVerificationDetail, void>({
      query: () => API_ENDPOINTS.providers.verification,
      providesTags: [{ type: API_TAGS.Verification, id: "ME" }],
    }),

    addVerificationDocument: builder.mutation<
      VerificationDocument,
      CreateVerificationDocumentRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.providers.verificationDocuments,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Verification, id: "ME" },
        { type: API_TAGS.Provider, id: "ME" },
      ],
    }),

    deleteVerificationDocument: builder.mutation<
      ProviderActionResponse,
      number | string
    >({
      query: (documentId) => ({
        url: API_ENDPOINTS.providers.verificationDocumentDetail(documentId),
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: API_TAGS.Verification, id: "ME" },
        { type: API_TAGS.Provider, id: "ME" },
      ],
    }),

    submitVerification: builder.mutation<ProviderVerificationDetail, void>({
      query: () => ({
        url: API_ENDPOINTS.providers.submitVerification,
        method: "POST",
      }),
      invalidatesTags: [
        { type: API_TAGS.Verification, id: "ME" },
        { type: API_TAGS.Provider, id: "ME" },
      ],
    }),

    adminListVerifications: builder.query<
      PaginatedVerificationsResponse,
      QueryVerificationsParams | void
    >({
      query: (params) => ({
        url: API_ENDPOINTS.providers.adminVerifications,
        params: params ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        ) : undefined,
      }),
      providesTags: [{ type: API_TAGS.Verification, id: "ADMIN_LIST" }],
    }),

    adminGetVerification: builder.query<
      AdminVerificationDetail,
      number | string
    >({
      query: (id) => API_ENDPOINTS.providers.adminVerificationDetail(id),
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Verification, id: Number(id) },
      ],
    }),

    adminApproveVerification: builder.mutation<
      AdminVerificationDetail,
      number | string
    >({
      query: (id) => ({
        url: API_ENDPOINTS.providers.adminApproveVerification(id),
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.Verification, id: Number(id) },
        { type: API_TAGS.Verification, id: "ADMIN_LIST" },
      ],
    }),

    adminRejectVerification: builder.mutation<
      AdminVerificationDetail,
      { id: number | string; data: AdminRejectVerificationRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.providers.adminRejectVerification(id),
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Verification, id: Number(id) },
        { type: API_TAGS.Verification, id: "ADMIN_LIST" },
      ],
    }),
  }),
});

export const {
  useOnboardProviderMutation,
  useCreateProviderProfileMutation,
  useGetOwnProviderProfileQuery,
  useUpdateOwnProviderProfileMutation,
  useGetPublicProviderProfileQuery,
  useGetOwnServiceAreasQuery,
  useAddServiceAreaMutation,
  useUpdateServiceAreaMutation,
  useDeleteServiceAreaMutation,
  useGetOwnVerificationQuery,
  useAddVerificationDocumentMutation,
  useDeleteVerificationDocumentMutation,
  useSubmitVerificationMutation,
  useAdminListVerificationsQuery,
  useAdminGetVerificationQuery,
  useAdminApproveVerificationMutation,
  useAdminRejectVerificationMutation,
} = providersApi;
