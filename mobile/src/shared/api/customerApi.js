import { ENDPOINTS } from "./endpoints";
import { request } from "./http";

export function loginApi(payload) {
  return request(ENDPOINTS.LOGIN, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchBranchesApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`${ENDPOINTS.SEARCH_BRANCHES}${query ? `?${query}` : ""}`);
}

export function createPublicBookingApi(branchId, payload) {
  return request(ENDPOINTS.PUBLIC_BOOKINGS(branchId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

