
import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";

import type { ApiMeta } from "./api-meta";
import {
  setAccessToken,
  clearCredentials,
} from "@/features/auth/auth.slice";

type Args = string | FetchArgs;

type RefreshResponse = {
  accessToken: string;
};

type AppState = {
  auth?: {
    accessToken?: string | null;
  };
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  credentials: "include",
  headers: {
    Accept: "application/json",
  },
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as AppState).auth?.accessToken;

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      headers.delete("Authorization");
    }

    return headers;
  },
});

function getMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return undefined;
  }

  const message = (data as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return message
      .filter((item): item is string => typeof item === "string")
      .join(", ");
  }

  return typeof message === "string" ? message : undefined;
}

let refreshPromise: Promise<boolean> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  Args,
  unknown,
  FetchBaseQueryError,
  ApiMeta
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const requestUrl = typeof args === "string" ? args : args.url;

  const isLoginRequest = requestUrl.includes("/auth/login");
  const isRefreshRequest = requestUrl.includes("/auth/refresh");
  const isLogoutRequest = requestUrl.includes("/auth/logout");

  const currentState = api.getState() as AppState;
  const currentToken = currentState.auth?.accessToken;

  const shouldRefresh =
    Boolean(currentToken) &&
    result.error?.status === 401 &&
    !isLoginRequest &&
    !isRefreshRequest &&
    !isLogoutRequest &&
    !extraOptions?.skipAuthRefresh;

  if (shouldRefresh) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshResult = await rawBaseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
          },
          api,
          {},
        );

        if (refreshResult.data) {
          const data = refreshResult.data as RefreshResponse;

          if (
            typeof data.accessToken === "string" &&
            data.accessToken.length > 0
          ) {
            api.dispatch(setAccessToken(data.accessToken));
            return true;
          }
        }

        api.dispatch(clearCredentials());
        return false;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      // Retry the original request using the updated access token.
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  if (result.error) {
    if (extraOptions?.showErrorToast !== false) {
      toast.error(
        getMessage(result.error.data) ??
          "Something went wrong. Please try again.",
      );
    }
  } else if (extraOptions?.showSuccessToast) {
    toast.success(
      extraOptions.successMessage ??
        getMessage(result.data) ??
        "Operation completed successfully.",
    );
  }

  return result;
};
