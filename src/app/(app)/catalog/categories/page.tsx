"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { addCategoryItem, ApiError, createCategory, getCategories, getItemTypes } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { Category, ItemType } from "@/lib/types";

const toPositiveInteger = (value: string): number | null => {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
};

export default function CategoriesPage() {
  const ready = useAuthGuard();
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedItemTypeId, setSelectedItemTypeId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedCategories, loadedItemTypes] = await Promise.all([
        getCategories(),
        getItemTypes(),
      ]);

      setCategories(loadedCategories);
      setItemTypes(loadedItemTypes);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível carregar categorias e itens."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) {
      return;
    }

    void loadCatalog();
  }, [ready]);

  const itemTypeById = useMemo(
    () =>
      itemTypes.reduce<Record<string, ItemType>>((map, itemType) => {
        map[itemType.id] = itemType;
        return map;
      }, {}),
    [itemTypes]
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name)),
    [categories]
  );

  const sortedItemTypes = useMemo(
    () => [...itemTypes].sort((left, right) => left.name.localeCompare(right.name)),
    [itemTypes]
  );

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError("Informe o nome da categoria.");
      return;
    }

    setCreatingCategory(true);
    setError(null);
    setSuccess(null);
    try {
      const createdCategory = await createCategory(newCategoryName.trim());
      setCategories((currentCategories) => [...currentCategories, createdCategory]);
      setSelectedCategoryId((currentSelectedCategoryId) =>
        currentSelectedCategoryId || createdCategory.id
      );
      setNewCategoryName("");
      setSuccess("Categoria criada com sucesso.");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível criar a categoria."
      );
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleAddItem = async () => {
    const parsedQuantity = toPositiveInteger(itemQuantity);

    if (!selectedCategoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    if (!selectedItemTypeId) {
      setError("Selecione um item de estoque.");
      return;
    }

    if (parsedQuantity === null) {
      setError("Informe uma quantidade válida (inteiro maior que zero).");
      return;
    }

    setAddingItem(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedCategory = await addCategoryItem(
        selectedCategoryId,
        selectedItemTypeId,
        parsedQuantity
      );

      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category
        )
      );
      setItemQuantity("");
      setSuccess("Item adicionado na categoria.");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.details?.detail ?? requestError.message
          : "Não foi possível adicionar o item na categoria."
      );
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Catálogo</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Categorias globais
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Monte as categorias reutilizáveis com os itens e quantidades de composição.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <Input
            label="Nova categoria"
            placeholder="Ex.: Básico"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
          />
          <Button className="self-end" size="lg" onClick={handleCreateCategory} disabled={creatingCategory}>
            {creatingCategory ? "Salvando..." : "Criar categoria"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.8fr_0.7fr]">
          <Select
            label="Categoria"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
          >
            <option value="">Selecione</option>
            {sortedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Item de estoque"
            value={selectedItemTypeId}
            onChange={(event) => setSelectedItemTypeId(event.target.value)}
          >
            <option value="">Selecione</option>
            {sortedItemTypes.map((itemType) => (
              <option key={itemType.id} value={itemType.id}>
                {itemType.name}
              </option>
            ))}
          </Select>
          <Input
            label="Quantidade"
            type="number"
            min={1}
            placeholder="1"
            value={itemQuantity}
            onChange={(event) => setItemQuantity(event.target.value)}
          />
          <Button variant="secondary" className="self-end" onClick={handleAddItem} disabled={addingItem}>
            {addingItem ? "Adicionando..." : "Adicionar item"}
          </Button>
        </div>
      </Card>

      {error ? <Alert tone="error" message={error} /> : null}
      {success ? <Alert tone="info" message={success} /> : null}

      <Card>
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Composição das categorias
        </h2>

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhuma categoria cadastrada"
              description="Crie uma categoria e adicione os itens de composição."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {sortedCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{category.name}</p>
                  <p className="text-xs text-white/50">{category.items.length} item(ns)</p>
                </div>
                {category.items.length === 0 ? (
                  <p className="mt-2 text-xs text-white/50">Sem itens vinculados.</p>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {category.items.map((categoryItem) => (
                      <div
                        key={`${category.id}-${categoryItem.itemTypeId}`}
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-2 text-sm"
                      >
                        <span className="text-white/80">
                          {itemTypeById[categoryItem.itemTypeId]?.name ?? categoryItem.itemTypeId}
                        </span>
                        <span className="text-white/60">Qtd.: {categoryItem.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
