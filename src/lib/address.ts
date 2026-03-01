import type { ContractData } from "./types";

export const extractZipCodeDigits = (value: string): string => value.replace(/\D/g, "").slice(0, 8);

export const formatZipCode = (value: string): string => {
  const digits = extractZipCodeDigits(value);
  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const buildAddressLine = ({
  street,
  number,
  complement,
  fallbackAddress,
}: {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  fallbackAddress?: string | null;
}): string => {
  const normalizedStreet = street?.trim();
  const normalizedNumber = number?.trim();
  const normalizedComplement = complement?.trim();
  const normalizedFallbackAddress = fallbackAddress?.trim() ?? "";

  if (!normalizedStreet || !normalizedNumber) {
    return normalizedFallbackAddress;
  }

  if (!normalizedComplement) {
    return `${normalizedStreet}, ${normalizedNumber}`;
  }

  return `${normalizedStreet}, ${normalizedNumber} - ${normalizedComplement}`;
};

export const buildCityLine = (city?: string | null, state?: string | null): string => {
  const normalizedCity = city?.trim();
  const normalizedState = state?.trim();

  if (normalizedCity && normalizedState) {
    return `${normalizedCity} - ${normalizedState}`;
  }

  if (normalizedCity) {
    return normalizedCity;
  }

  if (normalizedState) {
    return normalizedState;
  }

  return "Não informado";
};

export const hasCompleteStructuredAddress = (contractData: ContractData): boolean =>
  Boolean(
    contractData.customerStreet?.trim() &&
      contractData.customerNumber?.trim() &&
      contractData.customerNeighborhood?.trim() &&
      contractData.customerCity?.trim()
  );
