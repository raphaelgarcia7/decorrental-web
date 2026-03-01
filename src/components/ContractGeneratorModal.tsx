"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ApiError, generateContractDocument, getReservationContractData } from "@/lib/api";
import { buildContractFileName, downloadBlob, printContract } from "@/lib/contracts";
import type { ContractData } from "@/lib/types";

type ContractGeneratorModalProps = {
  isOpen: boolean;
  kitId: string;
  reservationId: string | null;
  onClose: () => void;
};

export const ContractGeneratorModal = ({
  isOpen,
  kitId,
  reservationId,
  onClose,
}: ContractGeneratorModalProps) => {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<"docx" | "pdf" | "print" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !reservationId) {
      return;
    }

    const loadContractData = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const response = await getReservationContractData(kitId, reservationId);
        setContractData(response);
      } catch (requestError) {
        setMessage(
          requestError instanceof ApiError
            ? requestError.details?.detail ?? requestError.message
            : "Não foi possível carregar os dados do contrato."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadContractData();
  }, [isOpen, kitId, reservationId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const title = useMemo(() => {
    if (!contractData) {
      return "Gerar contrato";
    }

    return `Contrato - ${contractData.customerName}`;
  }, [contractData]);

  if (!isOpen) {
    return null;
  }

  const handleAction = async (action: "docx" | "pdf" | "print") => {
    if (!contractData) {
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
      const extension = action === "docx" ? "docx" : "pdf";
      const fileName = buildContractFileName(contractData, extension);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 md:p-6">
      <div className="flex min-h-full items-start justify-center">
        <div className="my-4 flex w-full max-w-4xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] md:max-h-[90vh]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                {title}
              </h3>
              <p className="mt-1 text-sm text-white/60">
                Revise os dados e escolha uma ação para gerar o contrato.
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>

          {message ? (
            <div className="mt-4">
              <Alert tone="error" message={message} />
            </div>
          ) : null}

          {loading ? (
            <p className="mt-6 text-sm text-white/70">Carregando dados da reserva...</p>
          ) : contractData ? (
            <div className="mt-6 overflow-y-auto pr-1 md:max-h-[calc(90vh-12rem)]">
              <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nome do cliente"
                value={contractData.customerName}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData ? { ...currentData, customerName: event.target.value } : currentData
                  )
                }
              />
              <Input
                label="Documento"
                value={contractData.customerDocumentNumber}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData
                      ? { ...currentData, customerDocumentNumber: event.target.value }
                      : currentData
                  )
                }
              />
              <Input
                label="Telefone"
                value={contractData.customerPhoneNumber}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData ? { ...currentData, customerPhoneNumber: event.target.value } : currentData
                  )
                }
              />
              <Input
                label="Endereço"
                value={contractData.customerAddress}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData ? { ...currentData, customerAddress: event.target.value } : currentData
                  )
                }
              />
              <Input
                label="Bairro"
                value={contractData.customerNeighborhood ?? ""}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData ? { ...currentData, customerNeighborhood: event.target.value || null } : currentData
                  )
                }
              />
              <Input
                label="Cidade"
                value={contractData.customerCity ?? ""}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData ? { ...currentData, customerCity: event.target.value || null } : currentData
                  )
                }
              />
              <Input label="Tema" value={contractData.kitThemeName} readOnly />
              <Input label="Categoria" value={contractData.kitCategoryName} readOnly />
              <Input label="Data de início" value={contractData.reservationStartDate} readOnly />
              <Input label="Data de fim" value={contractData.reservationEndDate} readOnly />
              <Input
                label="Data do contrato"
                type="date"
                value={contractData.contractDate}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData ? { ...currentData, contractDate: event.target.value } : currentData
                  )
                }
              />
              <Input
                label="Valor total"
                type="number"
                step="0.01"
                value={contractData.totalAmount ?? ""}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData
                      ? {
                          ...currentData,
                          totalAmount:
                            event.target.value === "" ? null : Number(event.target.value),
                        }
                      : currentData
                  )
                }
              />
              <Input
                label="Valor de entrada"
                type="number"
                step="0.01"
                value={contractData.entryAmount ?? ""}
                onChange={(event) =>
                  setContractData((currentData) =>
                    currentData
                      ? {
                          ...currentData,
                          entryAmount:
                            event.target.value === "" ? null : Number(event.target.value),
                        }
                      : currentData
                  )
                }
              />
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={contractData.hasBalloonArch}
                  onChange={(event) =>
                    setContractData((currentData) =>
                      currentData ? { ...currentData, hasBalloonArch: event.target.checked } : currentData
                    )
                  }
                />
                Inclui arco de balões
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={contractData.isEntryPaid}
                  onChange={(event) =>
                    setContractData((currentData) =>
                      currentData ? { ...currentData, isEntryPaid: event.target.checked } : currentData
                    )
                  }
                />
                Valor de entrada pago
              </label>
              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/80">
                <span className="text-xs uppercase tracking-[0.2em]">Observações</span>
                <textarea
                  value={contractData.notes ?? ""}
                  onChange={(event) =>
                    setContractData((currentData) =>
                      currentData ? { ...currentData, notes: event.target.value } : currentData
                    )
                  }
                  rows={3}
                  maxLength={500}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none"
                />
              </label>
            </div>
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
