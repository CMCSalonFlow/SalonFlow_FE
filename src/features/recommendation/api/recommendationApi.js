import api from "@/core/api/axios";

// Lấy danh sách gợi ý dịch vụ AI (Collaborative Filtering / Fallback Popularity / A/B Test)
export const getRecommendationsApi = async (params = {}) => {
  const response = await api.get("/api/v1/recommendations", { params });
  return response.data;
};
