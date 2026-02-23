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
        setSelectedCategoryId((currentCategoryId) =>
          currentCategoryId || loadedCategories[0].id
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível carregar os detalhes do kit."
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
      setFeedbackMessage("Informe as datas de início e fim.");
      return;
    }

    setReserving(true);
    setError(null);
    setFeedbackMessage(null);
    try {
      const response = await reserveKit(kitId, selectedCategoryId, startDate, endDate);
      setFeedbackMessage(response.message);
      setStartDate("");
      setEndDate("");
      await loadData();
    } catch (requestError) {
      setFeedbackMessage(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível criar a reserva."
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
          : "Não foi possível cancelar a reserva."
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
        <EmptyState title="Kit não encontrado" description="Volte para a lista e selecione outro kit." />
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
                label="Início"
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
              <Button onClick={handleReserve} size="md" className="h-[52px] self-end" disabled={reserving}>
                {reserving ? "Reservando..." : "Reservar"}
              </Button>
            </div>

            {categories.length === 0 ? (
              <div className="mt-4">
                <Alert
                  tone="info"
                  message="Cadastre categorias primeiro em Catálogo > Categorias."
                />
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
                      <p className="text-xs text-white/50">
                        Categoria: {categoryById[reservation.kitCategoryId] ?? reservation.kitCategoryId}
                      </p>
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
                Há reservas ativas. Mantenha o planejamento de retirada e devolução atualizado.
              </p>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
