"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useGetMeQuery } from "./auth.api";
import { setCredentials, clearCredentials, setAuthInitialized } from "./auth.slice";

function AuthInitializerContent() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);

  // Only query user profile if an accessToken is already present in Redux state
  const { data: fetchedUser, isSuccess, isError } = useGetMeQuery(undefined, {
    skip: !accessToken || !!user,
  });

  // Check sessionStorage or localStorage on mount if Redux in-memory state is empty
  useEffect(() => {
    if (!accessToken) {
      try {
        const raw =
          sessionStorage.getItem("servicehub_auth") ||
          localStorage.getItem("servicehub_auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.accessToken && parsed?.user) {
            dispatch(setCredentials(parsed));
          }
        }
      } catch {
        // Storage access or JSON error ignored
      }
    }
    if (!isInitialized) {
      dispatch(setAuthInitialized());
    }
  }, [accessToken, isInitialized, dispatch]);

  useEffect(() => {
    if (isSuccess && fetchedUser && accessToken) {
      dispatch(
        setCredentials({
          user: fetchedUser,
          accessToken,
        })
      );
    }
  }, [dispatch, isSuccess, fetchedUser, accessToken]);

  useEffect(() => {
    if (isError && accessToken) {
      dispatch(clearCredentials());
    }
  }, [dispatch, isError, accessToken]);

  return null;
}

export function AuthInitializer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <AuthInitializerContent />;
}
