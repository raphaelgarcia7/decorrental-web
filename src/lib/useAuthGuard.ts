"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export const useAuthGuard = () => {
  const router = useRouter();
  const ready = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(getToken());
  }, []);

  useEffect(() => {
    if (!ready) {
      router.push("/login");
    }
  }, [ready, router]);

  return ready;
};
