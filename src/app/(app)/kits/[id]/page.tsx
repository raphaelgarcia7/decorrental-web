"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { ApiError, cancelReservation, getCategories, getKit, reserveKit } from "@/lib/api";
import { formatRange } from "@/lib/date";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { Category, Reservation } from "@/lib/types";

export default function KitDetailPage() {
  const ready = useAuthGuard();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const kitId = params?.id ?? "";

  const [kitName, setKitName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allowStockOverride, setAllowStockOverride] = useState(false);
  const [stockOverrideReason, setStockOverrideReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [cancellingReservationId, setCancellingReservationId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryById = useMemo(
    () =>
      categories.reduce<Record<string, string>>((map, category) => {
        map[category.id] = category.name;
        return map;
      }, {}),
    [categories]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [kit, loadedCategories] = await Promise.all([getKit(kitId), getCategories()]);
      setKitName(kit.name);
      setReservations(kit.reservations);
      setCategories(loadedCategories);

      if (loadedCategories.length > 0) {
        setSelectedCategoryId((currentCategoryId) => currentCategoryId || loadedCategories[0].id);
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Nao foi possivel carregar os detalhes do kit."
      );
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    if (!ready || !kitId) {
      return;
    }

    void loadData();
  }, [ready, kitId, loadData]);

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === "Active"),
    [reservations]
  );

  const handleReserve = async () => {
    if (!selectedCategoryId) {
      setFeedbackMessage("Selecione uma categoria antes de reservar.");
      return;
    }

    if (!startDate || !endDate) {
      setFeedbackMessage("Informe as datas de inicio e fim.");
      return;
    }

    const normalizedReason = stockOverrideReason.trim();
    if (allowStockOverride && !normalizedReason) {
      setFeedbackMessage("Informe a observacao do override de estoque.");
      return;
    }

    setReserving(true);
    setError(null);
    setFeedbackMessage(null);

    try {
      const response = await reserveKit(kitId, {
        kitCategoryId: selectedCategoryId,
        startDate,
        endDate,
        allowStockOverride,
        stockOverrideReason: allowStockOverride ? normalizedReason : undefined,
      });

      setFeedbackMessage(
        response.isStockOverride
          ? `${response.message} Override de estoque aplicado.`
          : response.message
      );

      setStartDate("");
      setEndDate("");
      setAllowStockOverride(false);
      setStockOverrideReason("");
      await loadData();
    } catch (requestError) {
      setFeedbackMessage(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Nao foi possivel criar a reserva."
      );
    } finally {
      setReserving(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    setCancellingReservationId(reservationId);
    setError(null);
    setFeedbackMessage(null);

    try {
      const response = await cancelReservation(kitId, reservationId);
      setFeedbackMessage(response.message);
      await loadData();
    } catch (requestError) {
      setFeedbackMessage(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Nao foi possivel cancelar a reserva."
      );
    } finally {
      setCancellingReservationId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Detalhes do kit</p>
          <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {kitName || "Carregando..."}
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
        <EmptyState title="Kit nao encontrado" description="Volte para a lista e selecione outro kit." />
      ) : (
        <>
          <Card>
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Criar reserva
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Select
                label="Categoria"
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
              >
                <option value="">Selecione</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Inicio"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <Input
                label="Fim"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
              <Button onClick={handleReserve} size="md" className="h-[48px] self-end" disabled={reserving}>
                {reserving ? "Reservando..." : "Reservar"}
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={allowStockOverride}
                  onChange={(event) => setAllowStockOverride(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                />
                Permitir reserva com override de estoque
              </label>
              <p className="mt-2 text-xs text-white/60">
                Use apenas quando houver aprovacao operacional para reservar mesmo com falta de itens.
              </p>

              {allowStockOverride ? (
                <label className="mt-3 flex flex-col gap-2 text-sm text-white/80">
                  <span className="text-xs uppercase tracking-[0.2em]">Observacao da excecao</span>
                  <textarea
                    value={stockOverrideReason}
                    onChange={(event) => setStockOverrideReason(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Explique o motivo da excecao de estoque."
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
              ) : null}
            </div>

            {categories.length === 0 ? (
              <div className="mt-4">
                <Alert tone="info" message="Cadastre categorias antes de reservar este kit." />
              </div>
            ) : null}

            {feedbackMessage ? (
              <div className="mt-3">
                <Alert tone="info" message={feedbackMessage} />
              </div>
            ) : null}
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
                  description="Use o formulario acima para reservar este kit."
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
                      <p className="text-xs text-white/50">
                        Categoria: {categoryById[reservation.kitCategoryId] ?? reservation.kitCategoryId}
                      </p>
                      {reservation.isStockOverride ? (
                        <p className="mt-1 text-xs text-amber-200">
                          Override de estoque: {reservation.stockOverrideReason ?? "Sem observacao."}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        tone={reservation.status === "Active" ? "success" : "neutral"}
                        label={reservation.status}
                      />
                      {reservation.isStockOverride ? (
                        <Badge tone="warning" label="Override" />
                      ) : null}
                      {reservation.status === "Active" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancel(reservation.id)}
                          disabled={cancellingReservationId === reservation.id}
                        >
                          {cancellingReservationId === reservation.id ? "Cancelando..." : "Cancelar"}
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
                Ha reservas ativas. Mantenha o planejamento de retirada e devolucao atualizado.
              </p>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
