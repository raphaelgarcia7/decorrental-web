"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { getKits, getKit } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { formatRange } from "@/lib/date";

const MAX_ITEMS = 12;

type CalendarItem = {
  kitName: string;
  range: string;
  status: string;
};

export default function CalendarPage() {
  const ready = useAuthGuard();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const kitsResponse = await getKits(1, 20);
        const results: CalendarItem[] = [];

        for (const kit of kitsResponse.items) {
          const detail = await getKit(kit.id);
          detail.reservations.forEach((reservation) => {
            results.push({
              kitName: detail.name,
              range: formatRange(reservation.startDate, reservation.endDate),
              status: reservation.status,
            });
          });
        }

        const sorted = results
          .sort((a, b) => a.range.localeCompare(b.range))
          .slice(0, MAX_ITEMS);
        setItems(sorted);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ready]);

  const activeCount = useMemo(
    () => items.filter((item) => item.status === "Active").length,
    [items]
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Agenda</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Calendario de reservas
        </h1>
        <p className="text-sm text-white/60">
          Visualize rapidamente os kits em uso e os proximos periodos.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
            Resumo
          </h2>
          <Badge tone="neutral" label={`${activeCount} ativas`} />
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-white/60">Carregando agenda...</p>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Sem reservas"
              description="Cadastre kits e reservas para ver a agenda completa."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {items.map((item, index) => (
              <div
                key={`${item.kitName}-${item.range}-${index}`}
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3 text-sm text-white/80 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.kitName}</p>
                  <p className="text-xs text-white/60">{item.range}</p>
                </div>
                <Badge tone={item.status === "Active" ? "success" : "neutral"} label={item.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
