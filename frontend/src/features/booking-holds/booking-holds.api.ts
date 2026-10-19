import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { API_TAGS } from "@/shared/api/api-tags";
import type {
  ActiveBookingHold,
  BookingHoldReleaseResponse,
  BookingHoldResponse,
  CreateBookingHoldRequest,
} from "./booking-holds.types";

export const bookingHoldsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBookingHold: builder.mutation<
      BookingHoldResponse,
      CreateBookingHoldRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.bookingHolds.create,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.BookingHold, id: "ME" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    getActiveBookingHold: builder.query<ActiveBookingHold | null, void>({
      query: () => API_ENDPOINTS.bookingHolds.me,
      providesTags: [{ type: API_TAGS.BookingHold, id: "ME" }],
    }),

    releaseBookingHold: builder.mutation<
      BookingHoldReleaseResponse,
      number | string
    >({
      query: (id) => ({
        url: API_ENDPOINTS.bookingHolds.release(id),
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: API_TAGS.BookingHold, id: "ME" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    releaseBookingHoldPost: builder.mutation<
      BookingHoldReleaseResponse,
      number | string
    >({
      query: (id) => ({
        url: API_ENDPOINTS.bookingHolds.releasePost(id),
        method: "POST",
      }),
      invalidatesTags: [
        { type: API_TAGS.BookingHold, id: "ME" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),
  }),
});

export const {
  useCreateBookingHoldMutation,
  useGetActiveBookingHoldQuery,
  useReleaseBookingHoldMutation,
  useReleaseBookingHoldPostMutation,
} = bookingHoldsApi;
