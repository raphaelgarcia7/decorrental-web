"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { getKits, getKit } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { getReservationStatusLabel } from "@/lib/reservationLabels";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatRange,
  isSameDay,
  parseDateKey,
  startOfMonth,
  startOfWeek,
  toDateKey,
  weekDays,
} from "@/lib/date";

const MAX_ITEMS = 42;

type CalendarItem = {
  kitName: string;
  startDate: string;
  endDate: string;
  range: string;
  status: string;
  reservationId: string;
};

type DayBucket = {
  dateKey: string;
  label: string;
  items: CalendarItem[];
  isCurrentMonth: boolean;
};

type CalendarView = "month" | "week";

const parseIsoDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const expandRange = (start: string, end: string): string[] => {
  const days: string[] = [];
  let cursor = parseIsoDate(start);
  const limit = parseIsoDate(end);
  while (cursor <= limit) {
    days.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
};

export default function CalendarPage() {
  const ready = useAuthGuard();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    if (!ready) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const kitsResponse = await getKits(1, 20);
        const results: CalendarItem[] = [];

        for (const kit of kitsResponse.items) {
          const detail = await getKit(kit.id);
          detail.reservations.forEach((reservation) => {
            results.push({
              kitName: detail.name,
              startDate: reservation.startDate,
              endDate: reservation.endDate,
              range: formatRange(reservation.startDate, reservation.endDate),
              status: reservation.status,
              reservationId: reservation.id,
            });
          });
        }

        const sorted = results
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
          .slice(0, MAX_ITEMS);
        setItems(sorted);
      } catch {
        setError("Não foi possível carregar o calendário.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ready]);

  const activeCount = useMemo(
    () => items.filter((item) => item.status === "Active").length,
    [items]
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((item) => {
      const dayKeys = expandRange(item.startDate, item.endDate);
      dayKeys.forEach((key) => {
        const existing = map.get(key) ?? [];
        existing.push(item);
        map.set(key, existing);
      });
    });
    return map;
  }, [items]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(cursorDate);
    const gridStart = startOfWeek(monthStart);
    const days: DayBucket[] = [];

    for (let i = 0; i < 42; i += 1) {
      const day = addDays(gridStart, i);
      const dateKey = toDateKey(day);
      const isCurrentMonth = day.getMonth() === cursorDate.getMonth();
      days.push({
        dateKey,
        label: day.getDate().toString(),
        items: itemsByDate.get(dateKey) ?? [],
        isCurrentMonth,
      });
    }

    return days.filter((day) => {
      const date = parseDateKey(day.dateKey);
      return date >= gridStart && date <= addDays(gridStart, 41);
    });
  }, [cursorDate, itemsByDate]);

  const weekDaysList = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [selectedDate]);

  const selectedKey = toDateKey(selectedDate);
  const selectedItems = itemsByDate.get(selectedKey) ?? [];

  const handlePrev = () => {
    if (view === "month") {
      setCursorDate((prev) => addMonths(prev, -1));
    } else {
      setSelectedDate((prev) => addDays(prev, -7));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCursorDate((prev) => addMonths(prev, 1));
    } else {
      setSelectedDate((prev) => addDays(prev, 7));
    }
  };

  const weekLabels = weekDays();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Agenda</p>
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Calendário de reservas
        </h1>
        <p className="text-sm text-white/60">
          Visualize rapidamente os kits em uso e os próximos períodos.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Resumo
            </h2>
            <p className="text-sm text-white/60">Clique em um dia para ver detalhes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="neutral" label={`${activeCount} ativas`} />
            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-1 py-1">
              <Button
                variant={view === "month" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("month")}
              >
                Mês
              </Button>
              <Button
                variant={view === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
              >
                Semana
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4">
            <Alert tone="error" message={error} />
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Sem reservas"
              description="Cadastre kits e reservas para ver a agenda completa."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={handlePrev}>
                  Voltar
                </Button>
                <p className="text-sm font-semibold text-white">
                  {view === "month" ? formatMonthLabel(cursorDate) : "Semana selecionada"}
                </p>
                <Button variant="ghost" size="sm" onClick={handleNext}>
                  Avançar
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-white/50">
                {weekLabels.map((label) => (
                  <span key={label} className="text-center">
                    {label}
                  </span>
                ))}
              </div>

              {view === "month" ? (
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {monthDays.map((day) => {
                    const dayDate = parseDateKey(day.dateKey);
                    const isSelected = isSameDay(dayDate, selectedDate);
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => setSelectedDate(dayDate)}
                        className={`flex flex-col gap-2 rounded-2xl border px-2 py-2 text-left text-xs transition ${
                          day.isCurrentMonth ? "bg-[var(--surface-2)]/70 text-white" : "bg-white/5 text-white/40"
                        } ${isSelected ? "border-white/60" : "border-[var(--border)]"}`}
                      >
                        <span className="text-sm font-semibold">{day.label}</span>
                        {day.items.length > 0 ? (
                          <span className="text-[11px] text-white/60">
                            {day.items.length} reserva(s)
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/30">Sem reservas</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {weekDaysList.map((day) => {
                    const dateKey = toDateKey(day);
                    const itemsForDay = itemsByDate.get(dateKey) ?? [];
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`flex flex-col gap-2 rounded-2xl border px-2 py-2 text-left text-xs transition ${
                          isSelected ? "border-white/60 bg-[var(--surface-2)]/70" : "border-[var(--border)] bg-[var(--surface)]/40"
                        }`}
                      >
                        <span className="text-sm font-semibold text-white">{day.getDate()}</span>
                        <span className="text-[11px] text-white/60">
                          {itemsForDay.length} reserva(s)
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Dia selecionado</p>
                  <p className="text-lg font-semibold text-white">{selectedKey}</p>
                </div>
                <Badge tone="neutral" label={`${selectedItems.length} reservas`} />
              </div>

              {selectedItems.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="Sem reservas neste dia"
                    description="Selecione outro dia ou crie uma nova reserva."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-3">
                  {selectedItems.map((item) => (
                    <div
                      key={`${item.reservationId}-${item.kitName}`}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3 text-sm text-white/80"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{item.kitName}</p>
                        <Badge
                          tone={item.status === "Active" ? "success" : "neutral"}
                          label={getReservationStatusLabel(item.status)}
                        />
                      </div>
                      <p className="mt-2 text-xs text-white/60">{item.range}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
