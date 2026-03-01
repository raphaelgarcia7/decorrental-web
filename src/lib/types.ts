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
  customerName: string;
  customerDocumentNumber: string;
  customerPhoneNumber: string;
  customerAddress: string;
  customerZipCode?: string | null;
  customerStreet?: string | null;
  customerNumber?: string | null;
  customerComplement?: string | null;
  customerNeighborhood?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerReference?: string | null;
  notes?: string | null;
  hasBalloonArch: boolean;
  isEntryPaid: boolean;
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
  customerName: string;
  customerDocumentNumber: string;
  customerPhoneNumber: string;
  customerAddress: string;
  customerZipCode?: string | null;
  customerStreet?: string | null;
  customerNumber?: string | null;
  customerComplement?: string | null;
  customerNeighborhood?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerReference?: string | null;
  notes?: string | null;
  hasBalloonArch: boolean;
  isEntryPaid: boolean;
  message: string;
};

export type UpdateReservationResponse = {
  reservationId: string;
  kitThemeId: string;
  kitCategoryId: string;
  startDate: string;
  endDate: string;
  status: string;
  isStockOverride: boolean;
  stockOverrideReason?: string | null;
  customerName: string;
  customerDocumentNumber: string;
  customerPhoneNumber: string;
  customerAddress: string;
  customerZipCode?: string | null;
  customerStreet?: string | null;
  customerNumber?: string | null;
  customerComplement?: string | null;
  customerNeighborhood?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerReference?: string | null;
  notes?: string | null;
  hasBalloonArch: boolean;
  isEntryPaid: boolean;
  message: string;
};

export type CancelResponse = {
  reservationId: string;
  kitThemeId: string;
  status: string;
  message: string;
};

export type ContractData = {
  kitThemeId: string;
  reservationId: string;
  kitThemeName: string;
  kitCategoryName: string;
  reservationStartDate: string;
  reservationEndDate: string;
  customerName: string;
  customerDocumentNumber: string;
  customerPhoneNumber: string;
  customerAddress: string;
  customerZipCode?: string | null;
  customerStreet?: string | null;
  customerNumber?: string | null;
  customerComplement?: string | null;
  customerNeighborhood?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerReference?: string | null;
  notes?: string | null;
  hasBalloonArch: boolean;
  isEntryPaid: boolean;
  contractDate: string;
  totalAmount?: number | null;
  entryAmount?: number | null;
};

export type AddressLookupResponse = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};
