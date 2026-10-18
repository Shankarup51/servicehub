
import { baseApi } from "@/shared/api/base-api";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import {
    clearCredentials,
    setCredentials,
} from "./auth.slice";
import type { AuthUser } from "./auth.types";

import type {
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RefreshTokenResponse,
    RegisterRequest,
    VerifyEmailRequest,
} from "./auth.types";

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation<MessageResponse, RegisterRequest>({
            query: (body) => ({
                url: API_ENDPOINTS.auth.register,
                method: "POST",
                body,
            }),
        }),

        verifyEmail: builder.mutation<MessageResponse, VerifyEmailRequest>({
            query: (body) => ({
                url: API_ENDPOINTS.auth.verifyEmail,
                method: "POST",
                body,
            }),
        }),

        login: builder.mutation<LoginResponse, LoginRequest>({
            query: ({ email, password }) => ({
                url: API_ENDPOINTS.auth.login,
                method: "POST",
                body: { email, password },
            }),

            async onQueryStarted(args, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    dispatch(baseApi.util.resetApiState());
                    dispatch(
                        setCredentials({
                            user: data.user,
                            accessToken: data.accessToken,
                            rememberMe: args.rememberMe,
                        }),
                    );
                } catch {
                    // RTK Query exposes the login error to the caller.
                }
            },
        }),

        refresh: builder.mutation<RefreshTokenResponse, void>({
            query: () => ({
                url: API_ENDPOINTS.auth.refresh,
                method: "POST",
            }),
        }),

        logout: builder.mutation<MessageResponse, void>({
            query: () => ({
                url: API_ENDPOINTS.auth.logout,
                method: "POST",
            }),

            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                } finally {
                    dispatch(clearCredentials());
                    dispatch(baseApi.util.resetApiState());
                }
            },
        }),
        getMe: builder.query<AuthUser, void>({
            query: () => API_ENDPOINTS.users.me,
        }),
    }),
});

export const {
    useRegisterMutation,
    useVerifyEmailMutation,
    useLoginMutation,
    useRefreshMutation,
    useLogoutMutation,
    useGetMeQuery,
} = authApi;
