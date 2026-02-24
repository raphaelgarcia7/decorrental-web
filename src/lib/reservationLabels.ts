export const getReservationStatusLabel = (status: string): string => {
  switch (status) {
    case "Active":
      return "Ativo";
    case "Cancelled":
      return "Cancelado";
    default:
      return status;
  }
};
