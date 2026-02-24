"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Skeleton } from "@/components/Skeleton";
import { ApiError, createKit, getKits } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { KitSummary } from "@/lib/types";

export default function KitsPage() {
  const ready = useAuthGuard();
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [filter, setFilter] = useState("");
  const [newKitName, setNewKitName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getKits(1, 50);
      setKits(response.items);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível carregar os kits."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) {
      return;
    }

    void loadKits();
  }, [ready]);

  const filteredKits = useMemo(() => {
    if (!filter.trim()) {
      return kits;
    }

    const term = filter.toLowerCase();
    return kits.filter((kit) => kit.name.toLowerCase().includes(term));
  }, [kits, filter]);

  const handleCreate = async () => {
    if (!newKitName.trim()) {
      setError("Informe um nome válido para o kit.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const createdKit = await createKit(newKitName.trim());
      setKits((currentKits) => [createdKit, ...currentKits]);
      setNewKitName("");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível criar o kit."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Kits</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Temas de kits
        </h1>
        <p className="text-sm text-white/60">
          Crie temas e gerencie reservas vinculadas às categorias globais.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <Input
            label="Novo tema"
            placeholder="Ex.: Patrulha Canina"
            value={newKitName}
            onChange={(event) => setNewKitName(event.target.value)}
          />
          <Button onClick={handleCreate} disabled={creating} className="self-end" size="lg">
            {creating ? "Criando..." : "Adicionar kit"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <Input
            label="Buscar"
            placeholder="Filtrar por nome"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />

          {error ? <Alert tone="error" message={error} /> : null}

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          ) : filteredKits.length === 0 ? (
            <EmptyState
              title="Nenhum kit encontrado"
              description="Crie o primeiro tema para começar a operar."
              actionLabel="Recarregar"
              onAction={() => void loadKits()}
            />
          ) : (
            <div className="grid gap-3">
              {filteredKits.map((kit) => (
                <Link
                  key={kit.id}
                  href={`/kits/${kit.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3 text-sm text-white/80 transition hover:border-white/30 hover:bg-[var(--surface-2)]"
                >
                  <span>{kit.name}</span>
                  <span className="text-xs text-white/40">Ver detalhes</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
