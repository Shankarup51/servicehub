import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { API_TAGS } from "@/shared/api/api-tags";
import type {
  BookingItem,
  CancelBookingRequest,
  CreateBookingRequest,
  PaginatedBookingsResponse,
  QueryBookingsParams,
  UpdateBookingStatusRequest,
} from "./bookings.types";

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBooking: builder.mutation<BookingItem, CreateBookingRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.bookings.create,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: API_TAGS.Booking, id: "CUSTOMER_LIST" },
        { type: API_TAGS.BookingHold, id: "ME" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),

    getBookings: builder.query<
      PaginatedBookingsResponse,
      QueryBookingsParams | void
    >({
      query: (params) => ({
        url: API_ENDPOINTS.bookings.list,
        params: params ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        ) : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((b) => ({
                type: API_TAGS.Booking,
                id: b.id,
              })),
              { type: API_TAGS.Booking, id: "CUSTOMER_LIST" },
            ]
          : [{ type: API_TAGS.Booking, id: "CUSTOMER_LIST" }],
    }),

    getMyBookings: builder.query<
      PaginatedBookingsResponse,
      QueryBookingsParams | void
    >({
      query: (params) => ({
        url: API_ENDPOINTS.bookings.me,
        params: params ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        ) : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((b) => ({
                type: API_TAGS.Booking,
                id: b.id,
              })),
              { type: API_TAGS.Booking, id: "CUSTOMER_LIST" },
            ]
          : [{ type: API_TAGS.Booking, id: "CUSTOMER_LIST" }],
    }),

    getProviderBookings: builder.query<
      PaginatedBookingsResponse,
      QueryBookingsParams | void
    >({
      query: (params) => ({
        url: API_ENDPOINTS.bookings.assigned,
        params: params ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        ) : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((b) => ({
                type: API_TAGS.Booking,
                id: b.id,
              })),
              { type: API_TAGS.Booking, id: "PROVIDER_ASSIGNED" },
            ]
          : [{ type: API_TAGS.Booking, id: "PROVIDER_ASSIGNED" }],
    }),

    getProviderBookingById: builder.query<BookingItem, number | string>({
      query: (id) => API_ENDPOINTS.bookings.assignedDetail(id),
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Booking, id: Number(id) },
      ],
    }),

    getBookingById: builder.query<BookingItem, number | string>({
      query: (id) => API_ENDPOINTS.bookings.detail(id),
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Booking, id: Number(id) },
      ],
    }),

    updateBookingStatus: builder.mutation<
      BookingItem,
      { id: number | string; data: UpdateBookingStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.bookings.updateStatus(id),
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Booking, id: Number(id) },
        { type: API_TAGS.Booking, id: "CUSTOMER_LIST" },
        { type: API_TAGS.Booking, id: "PROVIDER_ASSIGNED" },
      ],
    }),

    cancelBooking: builder.mutation<
      BookingItem,
      { id: number | string; data: CancelBookingRequest }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.bookings.cancel(id),
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Booking, id: Number(id) },
        { type: API_TAGS.Booking, id: "CUSTOMER_LIST" },
        { type: API_TAGS.Booking, id: "PROVIDER_ASSIGNED" },
        { type: API_TAGS.Availability, id: "PUBLIC" },
      ],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetBookingsQuery,
  useGetMyBookingsQuery,
  useGetProviderBookingsQuery,
  useGetProviderBookingByIdQuery,
  useGetBookingByIdQuery,
  useUpdateBookingStatusMutation,
  useCancelBookingMutation,
} = bookingsApi;
