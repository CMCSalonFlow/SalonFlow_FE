import { bookings } from "./bookings.mock";
import { resources } from "./resources.mock";

let bookingDB = [...bookings];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const scheduleMockService = {
  async getBookings() {
    await delay(400);
    return bookingDB;
  },

  async getResources() {
    await delay(200);
    return resources;
  },

  async updateBookingTime(id, newStart, newEnd, newResourceId) {
    await delay(300);

    bookingDB = bookingDB.map((b) =>
      b.id === id
        ? {
            ...b,
            start: newStart,
            end: newEnd,
            resourceId: newResourceId,
          }
        : b
    );

    return bookingDB.find((b) => b.id === id);
  },

  async updateBookingStatus(id, newStatus) {
    await delay(200);

    bookingDB = bookingDB.map((b) =>
      b.id === id
        ? {
            ...b,
            status: newStatus,
          }
        : b
    );

    return bookingDB.find((b) => b.id === id);
  },

  async getBookingById(id) {
    await delay(200);
    return bookingDB.find((b) => b.id === id);
  },
};