import { scheduleMockService } from "../mocks/schedule.mockService";

export const getBookings = () => scheduleMockService.getBookings();
export const getResources = () => scheduleMockService.getResources();

export const moveBooking = (id, start, end, resourceId) =>
  scheduleMockService.updateBookingTime(id, start, end, resourceId);

export const getBookingDetail = (id) =>
  scheduleMockService.getBookingById(id);

export const scheduleApi = {
  getBookings,
  getResources,
  moveBooking,
  getBookingDetail,
  cancelBooking: (id) => scheduleMockService.updateBookingStatus(id, "CANCELLED"),
};