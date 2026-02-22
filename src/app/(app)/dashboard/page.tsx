"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import { getKits, getKit } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { formatDate } from "@/lib/date";

const MAX_UPCOMING = 6;

type UpcomingReservation = {
  kitName: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function DashboardPage() {
  const ready = useAuthGuard();
  const [kitsCount, setKitsCount] = useState(0);
  const [upcoming, setUpcoming] = useState<UpcomingReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const kitsResponse = await getKits(1, 20);
        setKitsCount(kitsResponse.totalCount);

        const kits = kitsResponse.items;
        const reservations: UpcomingReservation[] = [];

        for (const kit of kits) {
          const detail = await getKit(kit.id);
          detail.reservations.forEach((reservation) => {
            reservations.push({
              kitName: detail.name,
              startDate: reservation.startDate,
              endDate: reservation.endDate,
              status: reservation.status,
            });
          });
        }

        const sorted = reservations
          .filter((reservation) => reservation.status === "Active")
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
          .slice(0, MAX_UPCOMING);

        setUpcoming(sorted);
      } catch {
        setError("Não foi possível carregar o dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ready]);

  const occupancyLabel = useMemo(() => {
    if (kitsCount === 0) {
      return "Sem kits cadastrados";
    }
    if (upcoming.length === 0) {
      return "Nenhuma reserva ativa";
    }
    return `${upcoming.length} reservas ativas`;
  }, [kitsCount, upcoming]);

  return (
    <div className="flex flex-col gap-8">
      <Topbar />

      <section className="grid gap-6 md:grid-cols-3">
        <StatCard label="Kits cadastrados" value={kitsCount} helper="Total na base" />
        <StatCard label="Reservas ativas" value={upcoming.length} helper="Próximos dias" />
        <StatCard label="Status" value={occupancyLabel} helper="Resumo rapido" />
      </section>

      {error ? <Alert tone="error" message={error} /> : null}

      <Card tone="highlight">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-semibold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Próximas reservas
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Visualização rápida das reservas ativas para preparar a operação.
            </p>
          </div>
          <Badge tone="neutral" label={loading ? "Atualizando" : "Hoje"} />
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Sem reservas ativas"
              description="Cadastre novos kits e crie reservas para acompanhar aqui."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {upcoming.map((reservation, index) => (
              <div
                key={`${reservation.kitName}-${reservation.startDate}-${index}`}
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{reservation.kitName}</p>
                  <p className="text-xs text-white/60">
                    {formatDate(reservation.startDate)} ate {formatDate(reservation.endDate)}
                  </p>
                </div>
                <Badge tone="success" label={reservation.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
