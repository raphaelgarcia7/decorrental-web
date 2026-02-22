import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

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
