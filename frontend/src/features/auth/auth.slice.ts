
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "./auth.types";

interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
}

const initialState: AuthState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isInitialized: false,
};

const AUTH_STORAGE_KEY = "servicehub_auth";

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{
                user: AuthUser;
                accessToken: string;
            }>,
        ) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
            state.isInitialized = true;
            if (typeof window !== "undefined") {
                try {
                    localStorage.removeItem("servicehub_logged_in");
                    localStorage.setItem(
                        AUTH_STORAGE_KEY,
                        JSON.stringify({
                            user: action.payload.user,
                            accessToken: action.payload.accessToken,
                        })
                    );
                } catch {
                    // Ignore storage quota/security errors
                }
            }
        },

        setAccessToken(state, action: PayloadAction<string>) {
            state.accessToken = action.payload;
            state.isAuthenticated = true;
            if (typeof window !== "undefined") {
                try {
                    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
                    const current = raw ? JSON.parse(raw) : {};
                    localStorage.setItem(
                        AUTH_STORAGE_KEY,
                        JSON.stringify({
                            ...current,
                            accessToken: action.payload,
                        })
                    );
                } catch {
                    // Ignore storage quota/security errors
                }
            }
        },

        clearCredentials: (state) => {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.isInitialized = true;
            if (typeof window !== "undefined") {
                try {
                    localStorage.removeItem(AUTH_STORAGE_KEY);
                    localStorage.removeItem("servicehub_logged_in");
                } catch {
                    // Ignore storage quota/security errors
                }
            }
        },

        setAuthInitialized: (state) => {
            state.isInitialized = true;
        },
    },
});

export const {
    setCredentials,
    setAccessToken,
    clearCredentials,
    setAuthInitialized,
} = authSlice.actions;

export default authSlice.reducer;
