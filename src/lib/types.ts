export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code?: string;
  traceId?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
};

export type AuthTokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  tokenType: string;
  role: string;
};

export type KitSummary = {
  id: string;
  name: string;
};

export type Reservation = {
  id: string;
  kitCategoryId: string;
  startDate: string;
  endDate: string;
  status: string;
  isStockOverride: boolean;
  stockOverrideReason?: string | null;
};

export type KitDetail = {
  id: string;
  name: string;
  reservations: Reservation[];
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type ItemType = {
  id: string;
  name: string;
  totalStock: number;
};

export type CategoryItem = {
  itemTypeId: string;
  quantity: number;
};

export type Category = {
  id: string;
  name: string;
  items: CategoryItem[];
};

export type ReserveResponse = {
  reservationId: string;
  kitThemeId: string;
  kitCategoryId: string;
  startDate: string;
  endDate: string;
  status: string;
  isStockOverride: boolean;
  stockOverrideReason?: string | null;
  message: string;
};

export type CancelResponse = {
  reservationId: string;
  kitThemeId: string;
  status: string;
  message: string;
};
