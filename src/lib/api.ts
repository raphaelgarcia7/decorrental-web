import { API_BASE_URL } from "./config";
import { getToken } from "./auth";
import type {
  AuthTokenResponse,
  CancelResponse,
  KitDetail,
  KitSummary,
  PagedResponse,
  ProblemDetails,
  Reservation,
  ReserveResponse,
} from "./types";

export class ApiError extends Error {
  status: number;
  details?: ProblemDetails;

  constructor(message: string, status: number, details?: ProblemDetails) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const getAuthHeaders = () => {
  const token = getToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let details: ProblemDetails | undefined;
    try {
      details = (await response.json()) as ProblemDetails;
    } catch {
      details = undefined;
    }

    throw new ApiError(
      details?.detail ?? `Erro na requisicao (${response.status}).`,
      response.status,
      details
    );
  }

  return (await response.json()) as T;
};

export const authenticate = async (
  username: string,
  password: string
): Promise<AuthTokenResponse> =>
  request<AuthTokenResponse>("/api/auth/token", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const getKits = async (
  page = 1,
  pageSize = 20
): Promise<PagedResponse<KitSummary>> =>
  request<PagedResponse<KitSummary>>(`/api/kits?page=${page}&pageSize=${pageSize}`, {
    headers: getAuthHeaders(),
  });

export const createKit = async (name: string): Promise<KitSummary> =>
  request<KitSummary>("/api/kits", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });

export const getKit = async (id: string): Promise<KitDetail> =>
  request<KitDetail>(`/api/kits/${id}`, {
    headers: getAuthHeaders(),
  });

export const getKitReservations = async (id: string): Promise<Reservation[]> =>
  request<Reservation[]>(`/api/kits/${id}/reservations`, {
    headers: getAuthHeaders(),
  });

export const reserveKit = async (
  kitId: string,
  startDate: string,
  endDate: string
): Promise<ReserveResponse> =>
  request<ReserveResponse>(`/api/kits/${kitId}/reservations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ startDate, endDate }),
  });

export const cancelReservation = async (
  kitId: string,
  reservationId: string
): Promise<CancelResponse> =>
  request<CancelResponse>(`/api/kits/${kitId}/reservations/${reservationId}/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });