export const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

export const formatRange = (start: string, end: string): string =>
  `${formatDate(start)} - ${formatDate(end)}`;
