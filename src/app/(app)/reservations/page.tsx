"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import {
  ApiError,
  cancelReservation,
  getCategories,
  getKitReservations,
  getKits,
  reserveKit,
} from "@/lib/api";
import { formatRange } from "@/lib/date";
import { getReservationStatusLabel } from "@/lib/reservationLabels";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { Category, KitSummary, Reservation } from "@/lib/types";

const DEFAULT_ERROR_MESSAGE = "Não foi possível carregar os dados de reservas.";

export default function ReservationsPage() {
  const ready = useAuthGuard();

  const [kits, setKits] = useState<KitSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedKitId, setSelectedKitId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerDocumentNumber, setCustomerDocumentNumber] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [hasBalloonArch, setHasBalloonArch] = useState(false);

  const [allowStockException, setAllowStockException] = useState(false);
  const [stockExceptionReason, setStockExceptionReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [creatingReservation, setCreatingReservation] = useState(false);
  const [cancellingReservationId, setCancellingReservationId] = useState<string | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kitById = useMemo(
    () =>
      kits.reduce<Record<string, string>>((map, kit) => {
        map[kit.id] = kit.name;
        return map;
      }, {}),
    [kits]
  );

  const categoryById = useMemo(
    () =>
      categories.reduce<Record<string, string>>((map, category) => {
        map[category.id] = category.name;
        return map;
      }, {}),
    [categories]
  );

  const selectedKitName = selectedKitId ? kitById[selectedKitId] : "";

  const clearForm = () => {
    setStartDate("");
    setEndDate("");
    setCustomerName("");
    setCustomerDocumentNumber("");
    setCustomerAddress("");
    setNotes("");
    setHasBalloonArch(false);
    setAllowStockException(false);
    setStockExceptionReason("");
  };

  const loadReservations = useCallback(async (kitId: string) => {
    if (!kitId) {
      setReservations([]);
      return;
    }

    setLoadingReservations(true);
    try {
      const loadedReservations = await getKitReservations(kitId);
      setReservations(loadedReservations);
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFeedbackMessage(null);

    try {
      const [kitsResponse, loadedCategories] = await Promise.all([
        getKits(1, 100),
        getCategories(),
      ]);

      setKits(kitsResponse.items);
      setCategories(loadedCategories);

      const defaultKitId = kitsResponse.items[0]?.id ?? "";
      const defaultCategoryId = loadedCategories[0]?.id ?? "";

      setSelectedKitId((currentKitId) => currentKitId || defaultKitId);
      setSelectedCategoryId((currentCategoryId) => currentCategoryId || defaultCategoryId);

      if (defaultKitId) {
        await loadReservations(defaultKitId);
      } else {
        setReservations([]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : DEFAULT_ERROR_MESSAGE
      );
    } finally {
      setLoading(false);
    }
  }, [loadReservations]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void loadInitialData();
  }, [ready, loadInitialData]);

  useEffect(() => {
    if (!ready || !selectedKitId) {
      return;
    }

    void loadReservations(selectedKitId);
  }, [ready, selectedKitId, loadReservations]);

  const handleCreateReservation = async () => {
    if (!selectedKitId) {
      setFeedbackMessage("Selecione um kit para criar a reserva.");
      return;
    }

    if (!selectedCategoryId) {
      setFeedbackMessage("Selecione uma categoria para criar a reserva.");
      return;
    }

    if (!startDate || !endDate) {
      setFeedbackMessage("Informe as datas de início e fim.");
      return;
    }

    const normalizedCustomerName = customerName.trim();
    if (!normalizedCustomerName) {
      setFeedbackMessage("Informe o nome do cliente.");
      return;
    }

    const normalizedDocumentNumber = customerDocumentNumber.trim();
    if (!normalizedDocumentNumber) {
      setFeedbackMessage("Informe o número do documento.");
      return;
    }

    const normalizedAddress = customerAddress.trim();
    if (!normalizedAddress) {
      setFeedbackMessage("Informe o endereço do cliente.");
      return;
    }

    const normalizedReason = stockExceptionReason.trim();
    if (allowStockException && !normalizedReason) {
      setFeedbackMessage("Informe a observação da exceção de estoque.");
      return;
    }

    setCreatingReservation(true);
    setError(null);
    setFeedbackMessage(null);

    try {
      const response = await reserveKit(selectedKitId, {
        kitCategoryId: selectedCategoryId,
        startDate,
        endDate,
        allowStockOverride: allowStockException,
        stockOverrideReason: allowStockException ? normalizedReason : undefined,
        customerName: normalizedCustomerName,
        customerDocumentNumber: normalizedDocumentNumber,
        customerAddress: normalizedAddress,
        notes: notes.trim() || undefined,
        hasBalloonArch,
      });

      setFeedbackMessage(
        response.isStockOverride
          ? `${response.message} Exceção de estoque aplicada.`
          : response.message
      );

      clearForm();
      await loadReservations(selectedKitId);
    } catch (requestError) {
      setFeedbackMessage(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível criar a reserva."
      );
    } finally {
      setCreatingReservation(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!selectedKitId) {
      return;
    }

    setCancellingReservationId(reservationId);
    setError(null);
    setFeedbackMessage(null);

    try {
      const response = await cancelReservation(selectedKitId, reservationId);
      setFeedbackMessage(response.message);
      await loadReservations(selectedKitId);
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
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Reservas</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Gestão de reservas
        </h1>
        <p className="text-sm text-white/60">
          Selecione kit, categoria e dados do cliente para criar reservas com rastreabilidade completa.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Alert tone="error" message={error} />
      ) : (
        <>
          <Card>
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Criar reserva
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-5">
              <Select
                label="Kit"
                value={selectedKitId}
                onChange={(event) => setSelectedKitId(event.target.value)}
              >
                <option value="">Selecione</option>
                {kits.map((kit) => (
                  <option key={kit.id} value={kit.id}>
                    {kit.name}
                  </option>
                ))}
              </Select>

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

              <Button
                onClick={handleCreateReservation}
                size="md"
                className="h-[48px] self-end"
                disabled={creatingReservation || !selectedKitId}
              >
                {creatingReservation ? "Reservando..." : "Reservar"}
              </Button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Nome do cliente"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                maxLength={120}
                placeholder="Ex.: Maria Santos"
              />

              <Input
                label="Documento"
                value={customerDocumentNumber}
                onChange={(event) => setCustomerDocumentNumber(event.target.value)}
                maxLength={40}
                placeholder="CPF/CNPJ"
              />

              <Input
                label="Endereço"
                value={customerAddress}
                onChange={(event) => setCustomerAddress(event.target.value)}
                maxLength={250}
                placeholder="Rua, número, bairro"
                className="md:col-span-2"
              />

              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/80">
                <span className="text-xs uppercase tracking-[0.2em]">Observações</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Informações adicionais da montagem, entrega ou cliente."
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <label className="md:col-span-2 flex cursor-pointer items-center gap-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={hasBalloonArch}
                  onChange={(event) => setHasBalloonArch(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                />
                Inclui arco de balões
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={allowStockException}
                  onChange={(event) => setAllowStockException(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                />
                Permitir reserva fora da disponibilidade de estoque
              </label>
              <p className="mt-2 text-xs text-white/60">
                Use apenas quando houver aprovação operacional para reservar com falta de itens no período.
              </p>

              {allowStockException ? (
                <label className="mt-3 flex flex-col gap-2 text-sm text-white/80">
                  <span className="text-xs uppercase tracking-[0.2em]">Observação da exceção</span>
                  <textarea
                    value={stockExceptionReason}
                    onChange={(event) => setStockExceptionReason(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Explique o motivo da exceção de estoque."
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
              ) : null}
            </div>

            {kits.length === 0 ? (
              <div className="mt-4">
                <Alert tone="info" message="Cadastre kits antes de criar reservas." />
              </div>
            ) : null}

            {categories.length === 0 ? (
              <div className="mt-4">
                <Alert tone="info" message="Cadastre categorias antes de criar reservas." />
              </div>
            ) : null}

            {feedbackMessage ? (
              <div className="mt-4">
                <Alert tone="info" message={feedbackMessage} />
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  Reservas do kit
                </h2>
                <p className="text-xs text-white/50">
                  {selectedKitName ? selectedKitName : "Selecione um kit para visualizar reservas."}
                </p>
              </div>
              <Badge tone="neutral" label={`${reservations.length} total`} />
            </div>

            {loadingReservations ? (
              <div className="mt-6 space-y-3">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            ) : !selectedKitId ? (
              <div className="mt-6">
                <EmptyState
                  title="Selecione um kit"
                  description="Escolha um kit no formulário acima para carregar as reservas."
                />
              </div>
            ) : reservations.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="Nenhuma reserva ainda"
                  description="Crie a primeira reserva para este kit."
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
                      <p className="text-xs text-white/50">Cliente: {reservation.customerName}</p>
                      <p className="text-xs text-white/50">Documento: {reservation.customerDocumentNumber}</p>
                      <p className="text-xs text-white/50">Endereço: {reservation.customerAddress}</p>
                      <p className="text-xs text-white/50">
                        Arco de balões: {reservation.hasBalloonArch ? "Sim" : "Não"}
                      </p>
                      {reservation.notes ? (
                        <p className="mt-1 text-xs text-white/60">Observações: {reservation.notes}</p>
                      ) : null}
                      {reservation.isStockOverride ? (
                        <p className="mt-1 text-xs text-amber-200">
                          Exceção de estoque: {reservation.stockOverrideReason ?? "Sem observação."}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        tone={reservation.status === "Active" ? "success" : "neutral"}
                        label={getReservationStatusLabel(reservation.status)}
                      />

                      {reservation.isStockOverride ? <Badge tone="warning" label="Exceção" /> : null}

                      {reservation.status === "Active" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancelReservation(reservation.id)}
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

          {kits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-white/60">
              Crie um kit em{" "}
              <Link className="text-white underline-offset-2 hover:underline" href="/kits">
                Kits
              </Link>{" "}
              para começar a reservar.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
