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
import { getReservationStatusLabel } from "@/lib/reservationLabels";
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
  const [customerName, setCustomerName] = useState("");
  const [customerDocumentNumber, setCustomerDocumentNumber] = useState("");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [hasBalloonArch, setHasBalloonArch] = useState(false);
  const [isEntryPaid, setIsEntryPaid] = useState(false);

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

  const clearForm = () => {
    setStartDate("");
    setEndDate("");
    setCustomerName("");
    setCustomerDocumentNumber("");
    setCustomerPhoneNumber("");
    setCustomerAddress("");
    setNotes("");
    setHasBalloonArch(false);
    setIsEntryPaid(false);
    setAllowStockOverride(false);
    setStockOverrideReason("");
  };

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

    const normalizedPhoneNumber = customerPhoneNumber.trim();
    if (!normalizedPhoneNumber) {
      setFeedbackMessage("Informe o telefone do cliente.");
      return;
    }

    const normalizedAddress = customerAddress.trim();
    if (!normalizedAddress) {
      setFeedbackMessage("Informe o endereço do cliente.");
      return;
    }

    const normalizedReason = stockOverrideReason.trim();
    if (allowStockOverride && !normalizedReason) {
      setFeedbackMessage("Informe a observação da exceção de estoque.");
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
        customerName: normalizedCustomerName,
        customerDocumentNumber: normalizedDocumentNumber,
        customerPhoneNumber: normalizedPhoneNumber,
        customerAddress: normalizedAddress,
        notes: notes.trim() || undefined,
        hasBalloonArch,
        isEntryPaid,
      });

      setFeedbackMessage(
        response.isStockOverride
          ? `${response.message} Exceção de estoque aplicada.`
          : response.message
      );

      clearForm();
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
              <Button onClick={handleReserve} size="md" className="h-[48px] self-end" disabled={reserving}>
                {reserving ? "Reservando..." : "Reservar"}
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
                label="Telefone"
                value={customerPhoneNumber}
                onChange={(event) => setCustomerPhoneNumber(event.target.value)}
                maxLength={30}
                placeholder="(11) 99999-9999"
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
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={hasBalloonArch}
                  onChange={(event) => setHasBalloonArch(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                />
                <span className="flex flex-col gap-1">
                  <span>Inclui arco de balões</span>
                  <span className="text-xs text-white/60">
                    Marque quando a montagem da reserva precisar de arco de balões.
                  </span>
                </span>
              </label>

              <div className="my-4 h-px bg-white/10" />

              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={isEntryPaid}
                  onChange={(event) => setIsEntryPaid(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                />
                <span className="flex flex-col gap-1">
                  <span>Valor de entrada pago</span>
                  <span className="text-xs text-white/60">
                    Marque quando o sinal da reserva já tiver sido pago.
                  </span>
                </span>
              </label>

              <div className="my-4 h-px bg-white/10" />

              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={allowStockOverride}
                  onChange={(event) => setAllowStockOverride(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                />
                <span className="flex flex-col gap-1">
                  <span>Permitir reserva fora da disponibilidade de estoque</span>
                  <span className="text-xs text-white/60">
                    Use apenas quando houver aprovação operacional para reservar mesmo com falta de itens.
                  </span>
                </span>
              </label>

              {allowStockOverride ? (
                <label className="mt-3 flex flex-col gap-2 text-sm text-white/80">
                  <span className="text-xs uppercase tracking-[0.2em]">Observação da exceção</span>
                  <textarea
                    value={stockOverrideReason}
                    onChange={(event) => setStockOverrideReason(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Explique o motivo da exceção de estoque."
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
                      <p className="text-xs text-white/50">Cliente: {reservation.customerName}</p>
                      <p className="text-xs text-white/50">Documento: {reservation.customerDocumentNumber}</p>
                      <p className="text-xs text-white/50">Telefone: {reservation.customerPhoneNumber}</p>
                      <p className="text-xs text-white/50">Endereço: {reservation.customerAddress}</p>
                      <p className="text-xs text-white/50">
                        Arco de balões: {reservation.hasBalloonArch ? "Sim" : "Não"}
                      </p>
                      <p className="text-xs text-white/50">
                        Entrada paga: {reservation.isEntryPaid ? "Sim" : "Não"}
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
