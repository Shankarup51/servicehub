
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

  categories: {
    list: "/categories",
    detail: (id: number | string) => `/categories/${id}`,
    create: "/categories",
    update: (id: number | string) => `/categories/${id}`,
    delete: (id: number | string) => `/categories/${id}`,
  },

  services: {
    list: "/services",
    mine: "/services/mine",
    detail: (id: number | string) => `/services/${id}`,
    create: "/services",
    update: (id: number | string) => `/services/${id}`,
    delete: (id: number | string) => `/services/${id}`,
    addImage: (id: number | string) => `/services/${id}/images`,
    deleteImage: (id: number | string, imageId: number | string) =>
      `/services/${id}/images/${imageId}`,
  },

  providers: {
    onboard: "/providers/onboard",
    apply: "/providers/apply",
    profile: "/providers/profile",
    meProfile: "/providers/profile/me",
    detail: (id: number | string) => `/providers/${id}`,
    serviceAreas: "/providers/me/service-areas",
    serviceAreaDetail: (id: number | string) =>
      `/providers/me/service-areas/${id}`,
    verification: "/providers/me/verification",
    verificationDocuments: "/providers/me/verification/documents",
    verificationDocumentDetail: (documentId: number | string) =>
      `/providers/me/verification/documents/${documentId}`,
    submitVerification: "/providers/me/verification/submit",
    adminVerifications: "/admin/verifications",
    adminVerificationDetail: (id: number | string) =>
      `/admin/verifications/${id}`,
    adminApproveVerification: (id: number | string) =>
      `/admin/verifications/${id}/approve`,
    adminRejectVerification: (id: number | string) =>
      `/admin/verifications/${id}/reject`,
  },

  availability: {
    me: "/providers/me/availability",
    meDetail: (id: number | string) => `/providers/me/availability/${id}`,
    blockedSlots: "/providers/me/blocked-slots",
    blockedSlotDetail: (id: number | string) =>
      `/providers/me/blocked-slots/${id}`,
    public: (providerId: number | string) =>
      `/providers/${providerId}/availability`,
  },

  bookingHolds: {
    create: "/booking-holds",
    me: "/booking-holds/me",
    release: (id: number | string) => `/booking-holds/${id}`,
    releasePost: (id: number | string) => `/booking-holds/${id}/release`,
  },

  bookings: {
    create: "/bookings",
    list: "/bookings",
    me: "/bookings/me",
    assigned: "/bookings/assigned",
    assignedDetail: (id: number | string) => `/bookings/assigned/${id}`,
    detail: (id: number | string) => `/bookings/${id}`,
    updateStatus: (id: number | string) => `/bookings/${id}/status`,
    cancel: (id: number | string) => `/bookings/${id}/cancel`,
  },

  navigation: {
    menu: "/navigation/menu",
  },
} as const;
