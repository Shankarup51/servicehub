import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { API_TAGS } from "@/shared/api/api-tags";
import type {
  AvailabilityActionResponse,
  BlockedSlot,
  CreateAvailabilityRequest,
  CreateBlockedSlotRequest,
  PublicAvailabilityResponse,
  QueryPublicAvailabilityParams,
  UpdateBlockedSlotRequest,
  WeeklyAvailability,
} from "./availability.types";

export const availabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOwnWeeklyAvailability: builder.query<WeeklyAvailability[], void>({
      query: () => API_ENDPOINTS.availability.me,
      providesTags: [{ type: API_TAGS.Availability, id: "WEEKLY" }],
    }),

    addWeeklyAvailability: builder.mutation<
      WeeklyAvailability,
      CreateAvailabilityRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.availability.me,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Availability, id: "WEEKLY" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    deleteWeeklyAvailability: builder.mutation<
      AvailabilityActionResponse,
      number | string
    >({
      query: (id) => ({
        url: API_ENDPOINTS.availability.meDetail(id),
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: API_TAGS.Availability, id: "WEEKLY" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    getOwnBlockedSlots: builder.query<BlockedSlot[], void>({
      query: () => API_ENDPOINTS.availability.blockedSlots,
      providesTags: [{ type: API_TAGS.Availability, id: "BLOCKED" }],
    }),

    createBlockedSlot: builder.mutation<BlockedSlot, CreateBlockedSlotRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.availability.blockedSlots,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Availability, id: "BLOCKED" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    updateBlockedSlot: builder.mutation<
      BlockedSlot,
      { id: number | string; data: UpdateBlockedSlotRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.availability.blockedSlotDetail(id),
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [
        { type: API_TAGS.Availability, id: "BLOCKED" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    deleteBlockedSlot: builder.mutation<
      AvailabilityActionResponse,
      number | string
    >({
      query: (id) => ({
        url: API_ENDPOINTS.availability.blockedSlotDetail(id),
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: API_TAGS.Availability, id: "BLOCKED" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    getPublicAvailability: builder.query<
      PublicAvailabilityResponse,
      { providerId: number | string; params?: QueryPublicAvailabilityParams }
    >({
      query: ({ providerId, params }) => ({
        url: API_ENDPOINTS.availability.public(providerId),
        params: params ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        ) : undefined,
      }),
      providesTags: (_result, _error, { providerId }) => [
        { type: API_TAGS.Availability, id: `PUBLIC_${providerId}` },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),
  }),
});

export const {
  useGetOwnWeeklyAvailabilityQuery,
  useAddWeeklyAvailabilityMutation,
  useDeleteWeeklyAvailabilityMutation,
  useGetOwnBlockedSlotsQuery,
  useCreateBlockedSlotMutation,
  useUpdateBlockedSlotMutation,
  useDeleteBlockedSlotMutation,
  useGetPublicAvailabilityQuery,
} = availabilityApi;
