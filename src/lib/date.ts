export const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

export const formatRange = (start: string, end: string): string =>
  `${formatDate(start)} - ${formatDate(end)}`;

const pad = (value: number) => value.toString().padStart(2, "0");

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDateKey = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export const addDays = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const addMonths = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount, 1);
  return next;
};

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const mondayBased = day === 0 ? -6 : 1 - day;
  return addDays(date, mondayBased);
};

export const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const formatMonthLabel = (date: Date): string =>
  date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export const weekDays = (): string[] => ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
