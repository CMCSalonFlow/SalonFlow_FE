import api from "@/core/api/axios";

export const getShiftsByBranchAndDateApi = async (branchId, date) => {
  const response = await api.get(
    `/api/v1/shifts/branch/${branchId}/date`,
    {
      params: { date },
    }
  );
  return response.data;
};

export const getShiftsByBranchAndRangeApi = async (branchId, startDate, endDate) => {
  const response = await api.get(
    `/api/v1/shifts/branch/${branchId}/range`,
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

export const scheduleApi = {
  getShiftsByBranchAndDate: getShiftsByBranchAndDateApi,
  getShiftsByBranchAndRange: getShiftsByBranchAndRangeApi,
};
