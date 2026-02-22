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
  startDate: string;
  endDate: string;
  status: string;
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

export type ReserveResponse = {
  reservationId: string;
  kitId: string;
  startDate: string;
  endDate: string;
  status: string;
  message: string;
};

export type CancelResponse = {
  reservationId: string;
  kitId: string;
  status: string;
  message: string;
};
