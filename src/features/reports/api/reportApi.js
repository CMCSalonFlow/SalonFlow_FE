import api from "@/core/api/axios";

export const getReportDataApi = async ({ reportType = 'doanh_thu', from = null, to = null, branchId = null } = {}) => {
  const params = { reportType };
  if (from) params.from = from;
  if (to) params.to = to;
  if (branchId) params.branchId = branchId;

  const res = await api.get("/api/v1/owner/reports/data", { params });
  return res.data;
};

export const triggerWeeklyEmailApi = async () => {
  const res = await api.post("/api/v1/owner/reports/trigger-weekly-email");
  return res.data;
};
