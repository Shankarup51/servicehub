
"use client";

import { useRef, Suspense } from "react";
import { Provider } from "react-redux";
import type { AppStore } from "@/lib/store";
import { makeStore } from "@/lib/store";
import { AuthInitializer } from "@/features/auth/auth-initializer";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <Suspense fallback={null}>
        <AuthInitializer />
      </Suspense>
      {children}
    </Provider>
  );
}
