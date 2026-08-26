import api from "@/core/api/axios";

// User / Help Center API
export const createTicketApi = async (data) => {
  const res = await api.post("/api/v1/support/tickets", data);
  return res.data;
};

export const getUserTicketsApi = async ({ status = null, page = 0, size = 10 } = {}) => {
  const params = { page, size };
  if (status) params.status = status;
  const res = await api.get("/api/v1/support/tickets", { params });
  return res.data;
};

export const getTicketDetailsApi = async (id) => {
  const res = await api.get(`/api/v1/support/tickets/${id}`);
  return res.data;
};

export const addReplyApi = async (id, data) => {
  const res = await api.post(`/api/v1/support/tickets/${id}/replies`, data);
  return res.data;
};

// Admin Support Dashboard API
export const getAdminTicketsApi = async (params = {}) => {
  const res = await api.get("/api/v1/admin/support/tickets", { params });
  return res.data;
};

export const getTicketKpiStatsApi = async () => {
  const res = await api.get("/api/v1/admin/support/tickets/kpi-stats");
  return res.data;
};

export const updateTicketStatusApi = async (id, data) => {
  const res = await api.put(`/api/v1/admin/support/tickets/${id}/status`, data);
  return res.data;
};

export const assignTicketApi = async (id, data) => {
  const res = await api.put(`/api/v1/admin/support/tickets/${id}/assign`, data);
  return res.data;
};
