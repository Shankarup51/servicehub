
"use client";

import * as React from "react";
import { Suspense } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store";
import { AuthInitializer } from "@/features/auth/auth-initializer";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = React.useState(makeStore);

  return (
    <Provider store={store}>
      <Suspense fallback={null}>
        <AuthInitializer />
      </Suspense>
      {children}
    </Provider>
  );
}
