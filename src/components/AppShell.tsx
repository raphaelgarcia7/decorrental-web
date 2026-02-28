"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const Sidebar = dynamic(
  () => import("@/components/Sidebar").then((module) => module.Sidebar),
  {
    ssr: false,
    loading: () => (
      <aside className="flex min-h-screen w-64 flex-col gap-8 border-r border-[var(--border)] bg-[var(--surface)]/80 px-6 py-8" />
    ),
  }
);

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="flex-1 px-10 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {children}
      </div>
    </main>
  </div>
);
