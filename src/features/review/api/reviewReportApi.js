import api from "@/core/api/axios";

// Salon Owner phản hồi đánh giá (1 reply per review)
export const replyReviewApi = async (reviewId, replyContent) => {
  const response = await api.post(`/api/v1/reviews/${reviewId}/reply`, {
    replyContent,
  });
  return response.data;
};

// Báo cáo đánh giá vi phạm
export const reportReviewApi = async (reviewId, reason) => {
  const response = await api.post(`/api/v1/reviews/${reviewId}/report`, {
    reason,
  });
  return response.data;
};

// Admin lấy danh sách hàng đợi báo cáo vi phạm
export const getAdminReviewReportsApi = async (status = "PENDING", page = 0, size = 10) => {
  const response = await api.get(`/api/v1/admin/review-reports`, {
    params: { status, page, size },
  });
  return response.data;
};

// Admin duyệt chấp nhận báo cáo vi phạm (Ẩn bài & gửi email)
export const approveReviewReportApi = async (reportId, adminNotes = "") => {
  const response = await api.put(`/api/v1/admin/review-reports/${reportId}/approve`, {
    adminNotes,
  });
  return response.data;
};

// Admin từ chối báo cáo vi phạm (Giữ bài & gửi email)
export const rejectReviewReportApi = async (reportId, adminNotes = "") => {
  const response = await api.put(`/api/v1/admin/review-reports/${reportId}/reject`, {
    adminNotes,
  });
  return response.data;
};
