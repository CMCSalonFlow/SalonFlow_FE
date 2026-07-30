import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { Pagination } from "antd";
import StarRatingInput from "./StarRatingInput";
import { getSalonReviewsApi, getSalonReviewSummaryApi } from "../api/reviewApi";

const SalonReviewList = ({ salonId }) => {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const pageSize = 5;

    useEffect(() => {
        if (!salonId) return;
        fetchSummary();
        fetchReviews(0);
    }, [salonId]);

    const fetchSummary = async () => {
        try {
            const data = await getSalonReviewSummaryApi(salonId);
            setSummary(data);
        } catch (err) {
            console.error("Lỗi khi tải thống kê review:", err);
        }
    };

    const fetchReviews = async (pageIndex) => {
        setLoading(true);
        try {
            const res = await getSalonReviewsApi(salonId, {
                page: pageIndex,
                size: pageSize,
                sort: "createdAt,desc"
            });
            setReviews(res.content || []);
            setTotalElements(res.totalElements || res.total || (res.content || []).length);
            setTotalPages(res.totalPages || 0);
            setPage(res.number || 0);
        } catch (err) {
            console.error("Lỗi khi tải danh sách review:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1) {
            fetchReviews(newPage - 1);
        }
    };

    return (
        <div className="space-y-6">
            {/* Rating Summary Header Card */}
            {summary && (
                <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-500/10 dark:from-amber-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-900/30 flex flex-col md:flex-row items-center gap-8">
                    {/* Left: Score */}
                    <div className="flex flex-col items-center justify-center text-center md:border-r border-amber-200/60 dark:border-amber-900/40 md:pr-8">
                        <span className="text-5xl font-extrabold text-amber-500 tracking-tight">
                            {summary.averageRating != null ? summary.averageRating.toFixed(1) : "0.0"}
                        </span>
                        <div className="my-2">
                            <StarRatingInput value={Math.round(summary.averageRating || 0)} readOnly size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {summary.totalReviews || 0} lượt đánh giá
                        </span>
                    </div>

                    {/* Right: Star distribution bars */}
                    <div className="flex-1 w-full space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = summary.ratingDistribution?.[star] || 0;
                            const total = summary.totalReviews || 1;
                            const percent = Math.round((count / total) * 100);

                            return (
                                <div key={star} className="flex items-center text-xs gap-3">
                                    <span className="w-12 text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                                        {star} <Star size={12} className="fill-amber-400 text-amber-400 inline" />
                                    </span>
                                    <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-right text-gray-500 dark:text-gray-400 font-mono">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Review List */}
            <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-rose-500" />
                    Đánh giá từ khách hàng
                </h4>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-rose-500" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <Star size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            Chưa có đánh giá nào cho Salon này.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div
                                key={rev.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={rev.customerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                                            alt={rev.customerName}
                                            className="w-10 h-10 rounded-full object-cover border border-rose-200 dark:border-rose-900"
                                        />
                                        <div>
                                            <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {rev.customerName || "Khách hàng"}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <StarRatingInput value={rev.rating} readOnly size={14} />
                                                <span className="text-xs text-gray-400">
                                                    • {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {rev.branchName && (
                                        <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                            {rev.branchName}
                                        </span>
                                    )}
                                </div>

                                {rev.comment && (
                                    <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {rev.comment}
                                    </p>
                                )}

                                {/* Photos List */}
                                {rev.photos && rev.photos.length > 0 && (
                                    <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                                        {rev.photos.map((photo, pIdx) => (
                                            <button
                                                key={pIdx}
                                                type="button"
                                                onClick={() => setSelectedPhoto(photo)}
                                                className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 hover:opacity-90 transition focus:outline-none"
                                            >
                                                <img src={photo} alt={`rev-img-${pIdx}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalElements > pageSize && (
                    <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Trang {page + 1} / {totalPages || Math.ceil(totalElements / pageSize)}
                        </span>
                        <Pagination
                            current={page + 1}
                            total={totalElements}
                            pageSize={pageSize}
                            showSizeChanger={false}
                            onChange={handlePageChange}
                            disabled={loading}
                        />
                    </div>
                )}
            </div>

            {/* Photo Lightbox Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl">
                        <img src={selectedPhoto} alt="Review Large" className="w-full h-full object-contain max-h-[85vh]" />
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalonReviewList;
