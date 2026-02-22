"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import { createKit, getKits } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { KitSummary } from "@/lib/types";

export default function KitsPage() {
  const ready = useAuthGuard();
  const router = useRouter();
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
    } catch {
      setError("Nao foi possivel carregar os kits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) {
      return;
    }
    loadKits();
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
      setError("Informe um nome valido para o kit.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const created = await createKit(newKitName.trim());
      setKits((prev) => [created, ...prev]);
      setNewKitName("");
    } catch {
      setError("Nao foi possivel criar o kit.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Catalogo</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Kits Disponiveis
        </h1>
        <p className="text-sm text-white/60">
          Crie, edite e acompanhe os kits ativos no sistema.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <Input
            label="Novo kit"
            placeholder="Ex: Kit Basico Monica"
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
              description="Crie o primeiro kit para comecar a operar."
              actionLabel="Criar kit"
              onAction={() => router.push("/kits")}
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
