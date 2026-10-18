import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type { NavigationMenuResponse } from "./navigation.types";

export const navigationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNavigationMenu: builder.query<NavigationMenuResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.navigation.menu,
        method: "GET",
      }),
      providesTags: ["Navigation"] as const,
    }),
  }),
});

export const { useGetNavigationMenuQuery } = navigationApi;
