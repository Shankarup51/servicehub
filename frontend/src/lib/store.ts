
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/shared/api/base-api";
import authReducer from "@/features/auth/auth.slice";


export const makeStore = () => {
  // Redux internally calls Math.random() in assertReducerShape for PROBE_UNKNOWN_ACTION.
  // Next.js 16 with cacheComponents / strict prerendering tracks Math.random() as unstable data.
  const originalRandom = Math.random;
  Math.random = () => 0.5;

  try {
    return configureStore({
      reducer: {
        auth: authReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });
  } finally {
    Math.random = originalRandom;
  }
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
