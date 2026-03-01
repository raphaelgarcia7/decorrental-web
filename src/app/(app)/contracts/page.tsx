"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import {
  ApiError,
  generateContractDocument,
  getKitReservations,
  getKits,
  getReservationContractData,
} from "@/lib/api";
import { buildContractFileName, downloadBlob, printContract } from "@/lib/contracts";
import { formatRange } from "@/lib/date";
import { getReservationStatusLabel } from "@/lib/reservationLabels";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { ContractData, KitSummary, Reservation } from "@/lib/types";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const createEmptyContractData = (): ContractData => ({
  kitThemeId: EMPTY_GUID,
  reservationId: EMPTY_GUID,
  kitThemeName: "",
  kitCategoryName: "",
  reservationStartDate: "",
  reservationEndDate: "",
  customerName: "",
  customerDocumentNumber: "",
  customerPhoneNumber: "",
  customerAddress: "",
  customerNeighborhood: "",
  customerCity: "",
  notes: "",
  hasBalloonArch: false,
  isEntryPaid: false,
  contractDate: new Date().toISOString().slice(0, 10),
  totalAmount: null,
  entryAmount: null,
});

export default function ContractsPage() {
  const ready = useAuthGuard();

  const [kits, setKits] = useState<KitSummary[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedKitId, setSelectedKitId] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [contractData, setContractData] = useState<ContractData>(createEmptyContractData());

  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [loadingContractData, setLoadingContractData] = useState(false);
  const [processingAction, setProcessingAction] = useState<"docx" | "pdf" | "print" | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kitNameById = useMemo(
    () =>
      kits.reduce<Record<string, string>>((map, kit) => {
        map[kit.id] = kit.name;
        return map;
      }, {}),
    [kits]
  );

  const loadReservations = useCallback(async (kitId: string) => {
    if (!kitId) {
      setReservations([]);
      setSelectedReservationId("");
      return;
    }

    setLoadingReservations(true);
    try {
      const response = await getKitReservations(kitId);
      setReservations(response);
      setSelectedReservationId((currentValue) =>
        response.some((reservation) => reservation.id === currentValue) ? currentValue : ""
      );
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const kitsResponse = await getKits(1, 100);
        setKits(kitsResponse.items);

        const defaultKitId = kitsResponse.items[0]?.id ?? "";
        setSelectedKitId(defaultKitId);

        if (defaultKitId) {
          await loadReservations(defaultKitId);
        }
      } catch (requestError) {
        setError(
          requestError instanceof ApiError
            ? requestError.details?.detail ?? requestError.message
            : "Não foi possível carregar os dados de contratos."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, [ready, loadReservations]);

  useEffect(() => {
    if (!ready || !selectedKitId) {
      return;
    }

    void loadReservations(selectedKitId);
  }, [ready, selectedKitId, loadReservations]);

  const handleLoadFromReservation = async () => {
    if (!selectedKitId || !selectedReservationId) {
      setMessage("Selecione um kit e uma reserva para preencher o contrato.");
      return;
    }

    setLoadingContractData(true);
    setMessage(null);
    setError(null);

    try {
      const response = await getReservationContractData(selectedKitId, selectedReservationId);
      setContractData(response);
    } catch (requestError) {
      setMessage(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível carregar os dados da reserva."
      );
    } finally {
      setLoadingContractData(false);
    }
  };

  const validateContractData = (): boolean => {
    if (!contractData.kitThemeName.trim()) {
      setMessage("Informe o nome do tema.");
      return false;
    }

    if (!contractData.kitCategoryName.trim()) {
      setMessage("Informe a categoria.");
      return false;
    }

    if (!contractData.customerName.trim()) {
      setMessage("Informe o nome do cliente.");
      return false;
    }

    if (!contractData.customerDocumentNumber.trim()) {
      setMessage("Informe o documento do cliente.");
      return false;
    }

    if (!contractData.customerPhoneNumber.trim()) {
      setMessage("Informe o telefone do cliente.");
      return false;
    }

    if (!contractData.customerAddress.trim()) {
      setMessage("Informe o endereço do cliente.");
      return false;
    }

    if (!contractData.reservationStartDate || !contractData.reservationEndDate) {
      setMessage("Informe as datas da reserva.");
      return false;
    }

    if (!contractData.contractDate) {
      setMessage("Informe a data do contrato.");
      return false;
    }

    return true;
  };

  const handleAction = async (action: "docx" | "pdf" | "print") => {
    if (!validateContractData()) {
      return;
    }

    setProcessingAction(action);
    setMessage(null);

    try {
      if (action === "print") {
        printContract(contractData);
        return;
      }

      const blob = await generateContractDocument(action, contractData);
      const fileName = buildContractFileName(contractData, action);
      downloadBlob(blob, fileName);
    } catch (requestError) {
      setMessage(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível gerar o contrato."
      );
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Contratos</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Geração de contratos
        </h1>
        <p className="text-sm text-white/60">
          Preencha os dados manualmente ou carregue uma reserva para gerar em Word, PDF ou imprimir.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Alert tone="error" message={error} />
      ) : (
        <>
          <Card>
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Preencher a partir de reserva
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
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
                label="Reserva"
                value={selectedReservationId}
                onChange={(event) => setSelectedReservationId(event.target.value)}
                disabled={!selectedKitId || loadingReservations}
              >
                <option value="">Selecione</option>
                {reservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>
                    {formatRange(reservation.startDate, reservation.endDate)} - {getReservationStatusLabel(reservation.status)}
                  </option>
                ))}
              </Select>

              <Input
                label="Tema selecionado"
                value={selectedKitId ? kitNameById[selectedKitId] ?? "" : ""}
                readOnly
              />

              <Button
                className="h-[48px] self-end"
                onClick={() => void handleLoadFromReservation()}
                disabled={loadingContractData || !selectedKitId || !selectedReservationId}
              >
                {loadingContractData ? "Carregando..." : "Carregar dados"}
              </Button>
            </div>

            {selectedKitId && reservations.length === 0 ? (
              <div className="mt-4">
                <Alert tone="info" message="Este kit ainda não possui reservas para preenchimento automático." />
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Dados do contrato
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Nome do cliente"
                value={contractData.customerName}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, customerName: event.target.value }))
                }
                maxLength={120}
              />

              <Input
                label="Documento"
                value={contractData.customerDocumentNumber}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, customerDocumentNumber: event.target.value }))
                }
                maxLength={40}
              />

              <Input
                label="Telefone"
                value={contractData.customerPhoneNumber}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, customerPhoneNumber: event.target.value }))
                }
                maxLength={30}
              />

              <Input
                label="Endereço"
                value={contractData.customerAddress}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, customerAddress: event.target.value }))
                }
                maxLength={250}
              />

              <Input
                label="Bairro"
                value={contractData.customerNeighborhood ?? ""}
                onChange={(event) =>
                  setContractData((currentData) => ({
                    ...currentData,
                    customerNeighborhood: event.target.value || null,
                  }))
                }
                maxLength={120}
              />

              <Input
                label="Cidade"
                value={contractData.customerCity ?? ""}
                onChange={(event) =>
                  setContractData((currentData) => ({
                    ...currentData,
                    customerCity: event.target.value || null,
                  }))
                }
                maxLength={120}
              />

              <Input
                label="Tema"
                value={contractData.kitThemeName}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, kitThemeName: event.target.value }))
                }
                maxLength={120}
              />

              <Input
                label="Categoria"
                value={contractData.kitCategoryName}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, kitCategoryName: event.target.value }))
                }
                maxLength={120}
              />

              <Input
                label="Data de início"
                type="date"
                value={contractData.reservationStartDate}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, reservationStartDate: event.target.value }))
                }
              />

              <Input
                label="Data de fim"
                type="date"
                value={contractData.reservationEndDate}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, reservationEndDate: event.target.value }))
                }
              />

              <Input
                label="Data do contrato"
                type="date"
                value={contractData.contractDate}
                onChange={(event) =>
                  setContractData((currentData) => ({ ...currentData, contractDate: event.target.value }))
                }
              />

              <Input
                label="Valor total"
                type="number"
                step="0.01"
                value={contractData.totalAmount ?? ""}
                onChange={(event) =>
                  setContractData((currentData) => ({
                    ...currentData,
                    totalAmount: event.target.value === "" ? null : Number(event.target.value),
                  }))
                }
              />

              <Input
                label="Valor de entrada"
                type="number"
                step="0.01"
                value={contractData.entryAmount ?? ""}
                onChange={(event) =>
                  setContractData((currentData) => ({
                    ...currentData,
                    entryAmount: event.target.value === "" ? null : Number(event.target.value),
                  }))
                }
              />

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={contractData.hasBalloonArch}
                    onChange={(event) =>
                      setContractData((currentData) => ({ ...currentData, hasBalloonArch: event.target.checked }))
                    }
                  />
                  Inclui arco de balões
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={contractData.isEntryPaid}
                    onChange={(event) =>
                      setContractData((currentData) => ({ ...currentData, isEntryPaid: event.target.checked }))
                    }
                  />
                  Valor de entrada pago
                </label>
              </div>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/80">
                <span className="text-xs uppercase tracking-[0.2em]">Observações</span>
                <textarea
                  value={contractData.notes ?? ""}
                  onChange={(event) =>
                    setContractData((currentData) => ({ ...currentData, notes: event.target.value }))
                  }
                  rows={3}
                  maxLength={500}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none"
                />
              </label>
            </div>

            {message ? (
              <div className="mt-4">
                <Alert tone="info" message={message} />
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => void handleAction("docx")} disabled={processingAction !== null}>
                {processingAction === "docx" ? "Gerando Word..." : "Gerar em Word"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => void handleAction("pdf")}
                disabled={processingAction !== null}
              >
                {processingAction === "pdf" ? "Gerando PDF..." : "Gerar PDF"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => void handleAction("print")}
                disabled={processingAction !== null}
              >
                {processingAction === "print" ? "Preparando impressão..." : "Imprimir"}
              </Button>
            </div>
          </Card>

          {kits.length === 0 ? (
            <EmptyState
              title="Nenhum kit cadastrado"
              description="Cadastre kits para usar o preenchimento automático do contrato."
            />
          ) : null}
        </>
      )}
    </div>
  );
}
