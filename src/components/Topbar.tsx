"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { clearToken } from "@/lib/auth";

export const Topbar = () => {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Visão Geral</p>
        <h1
          className="mt-2 text-3xl font-semibold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Painel Operacional
        </h1>
      </div>
      <Button variant="secondary" size="sm" onClick={handleLogout}>
        Sair
      </Button>
    </header>
  );
};
