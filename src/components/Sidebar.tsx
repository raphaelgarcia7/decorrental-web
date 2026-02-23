"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/kits", label: "Kits" },
  { href: "/catalog/item-types", label: "Itens de estoque" },
  { href: "/catalog/categories", label: "Categorias" },
  { href: "/calendar", label: "Calendário" },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col gap-8 border-r border-[var(--border)] bg-[var(--surface)]/80 px-6 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">DecorRental</p>
        <p
          className="mt-3 text-2xl font-semibold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Controle de Kits
        </p>
        <p className="mt-2 text-sm text-white/50">
          Operação diária, estoque e reservas inteligentes.
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-xs text-white/60">
        Base conectada à API DecorRental.
      </div>
    </aside>
  );
};
