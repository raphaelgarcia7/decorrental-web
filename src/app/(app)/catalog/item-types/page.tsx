"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Skeleton } from "@/components/Skeleton";
import { ApiError, createItemType, getItemTypes, updateItemStock } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { ItemType } from "@/lib/types";

const toNonNegativeInteger = (value: string): number | null => {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
};

export default function ItemTypesPage() {
  const ready = useAuthGuard();
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [stockDraftByItemId, setStockDraftByItemId] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadItemTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getItemTypes();
      setItems(response);
      setStockDraftByItemId(
        response.reduce<Record<string, string>>((draft, itemType) => {
          draft[itemType.id] = String(itemType.totalStock);
          return draft;
        }, {})
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível carregar os itens de estoque."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) {
      return;
    }

    void loadItemTypes();
  }, [ready]);

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.name.localeCompare(right.name)),
    [items]
  );

  const handleCreate = async () => {
    const parsedStock = toNonNegativeInteger(newStock);

    if (!newName.trim()) {
      setError("Informe o nome do item.");
      return;
    }

    if (parsedStock === null) {
      setError("Informe um estoque válido (número inteiro maior ou igual a zero).");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const createdItem = await createItemType(newName.trim(), parsedStock);
      setItems((currentItems) => [...currentItems, createdItem]);
      setStockDraftByItemId((currentDrafts) => ({
        ...currentDrafts,
        [createdItem.id]: String(createdItem.totalStock),
      }));
      setNewName("");
      setNewStock("");
      setSuccess("Item de estoque criado com sucesso.");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível criar o item de estoque."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStock = async (itemType: ItemType) => {
    const parsedStock = toNonNegativeInteger(stockDraftByItemId[itemType.id] ?? "");
    if (parsedStock === null) {
      setError("Informe um estoque válido para atualizar.");
      return;
    }

    setUpdatingItemId(itemType.id);
    setError(null);
    setSuccess(null);
    try {
      const updatedItem = await updateItemStock(itemType.id, parsedStock);
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem
        )
      );
      setSuccess(`Estoque atualizado para ${updatedItem.name}.`);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível atualizar o estoque."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Catálogo</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Itens de estoque
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Cadastre tipos de itens globais e mantenha o estoque total atualizado.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.6fr]">
          <Input
            label="Nome do item"
            placeholder="Ex.: Painel 2x2"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <Input
            label="Estoque total"
            type="number"
            min={0}
            placeholder="0"
            value={newStock}
            onChange={(event) => setNewStock(event.target.value)}
          />
          <Button onClick={handleCreate} size="lg" className="self-end" disabled={creating}>
            {creating ? "Salvando..." : "Cadastrar item"}
          </Button>
        </div>
      </Card>

      {error ? <Alert tone="error" message={error} /> : null}
      {success ? <Alert tone="info" message={success} /> : null}

      <Card>
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Lista de itens
        </h2>

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhum item cadastrado"
              description="Crie o primeiro item de estoque para começar."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {sortedItems.map((itemType) => (
              <div
                key={itemType.id}
                className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 md:grid-cols-[1.2fr_0.8fr_0.6fr]"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{itemType.name}</p>
                  <p className="text-xs text-white/50">{itemType.id}</p>
                </div>
                <Input
                  label="Estoque"
                  type="number"
                  min={0}
                  value={stockDraftByItemId[itemType.id] ?? ""}
                  onChange={(event) =>
                    setStockDraftByItemId((currentDrafts) => ({
                      ...currentDrafts,
                      [itemType.id]: event.target.value,
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  className="self-end"
                  onClick={() => handleUpdateStock(itemType)}
                  disabled={updatingItemId === itemType.id}
                >
                  {updatingItemId === itemType.id ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
