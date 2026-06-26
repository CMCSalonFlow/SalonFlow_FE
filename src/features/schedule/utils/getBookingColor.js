export const getBookingColor = (status) => {
  switch (status) {
    case "CONFIRMED":
      return "#52c41a";
    case "PENDING":
      return "#faad14";
    case "CANCELLED":
      return "#ff4d4f";
    default:
      return "#1677ff";
  }
};