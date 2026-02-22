"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import { cancelReservation, getKit, reserveKit } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { formatRange } from "@/lib/date";
import type { Reservation } from "@/lib/types";

export default function KitDetailPage() {
  const ready = useAuthGuard();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const kitId = params?.id ?? "";
  const [kitName, setKitName] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const kit = await getKit(kitId);
      setKitName(kit.name);
      setReservations(kit.reservations);
    } catch {
      setError("Não foi possível carregar o kit.");
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    if (!ready || !kitId) {
      return;
    }
    loadKit();
  }, [ready, kitId, loadKit]);

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === "Active"),
    [reservations]
  );

  const handleReserve = async () => {
    if (!startDate || !endDate) {
      setActionMessage("Informe as datas de início e fim.");
      return;
    }

    try {
      const result = await reserveKit(kitId, startDate, endDate);
      setActionMessage(result.message);
      await loadKit();
      setStartDate("");
      setEndDate("");
    } catch {
      setActionMessage("Não foi possível reservar. Verifique conflito de datas.");
    }
  };

  const handleCancel = async (reservationId: string) => {
    try {
      const result = await cancelReservation(kitId, reservationId);
      setActionMessage(result.message);
      await loadKit();
    } catch {
      setActionMessage("Não foi possível cancelar a reserva.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Detalhes do kit</p>
          <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {kitName || "Carregando"}
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/kits")}>
          Voltar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <EmptyState title="Kit não encontrado" description="Volte para a lista e selecione outro kit." />
      ) : (
        <>
          <Card>
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Criar reserva
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Input label="Inicio" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <Input label="Fim" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              <Button onClick={handleReserve} size="md" className="h-[52px] self-end">
                Reservar
              </Button>
            </div>
            {actionMessage ? <div className="mt-3"><Alert tone="info" message={actionMessage} /></div> : null}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                Reservas
              </h2>
              <Badge tone="neutral" label={`${reservations.length} total`} />
            </div>

            {reservations.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="Nenhuma reserva ainda"
                  description="Use o formulário acima para reservar este kit."
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3 text-sm text-white/80 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {formatRange(reservation.startDate, reservation.endDate)}
                      </p>
                      <p className="text-xs text-white/50">{reservation.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        tone={reservation.status === "Active" ? "success" : "neutral"}
                        label={reservation.status}
                      />
                      {reservation.status === "Active" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancel(reservation.id)}
                        >
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {activeReservations.length > 0 ? (
            <Card>
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                Kit em uso
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Há reservas ativas. Mantenha o planejamento de retirada e devolução atualizado.
              </p>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
