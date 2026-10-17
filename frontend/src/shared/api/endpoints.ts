
export const API_ENDPOINTS = {
  auth: {
    register: "/auth/register",
    verifyEmail: "/auth/verify-email",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  users: {
    me: "/users/profile",
  },

  services: {
    list: "/services",
    detail: (id: number | string) => `/services/${id}`,
  },

  bookings: {
    list: "/bookings",
    detail: (id: number | string) => `/bookings/${id}`,
    create: "/bookings",
  },
} as const;
