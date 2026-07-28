import React, { useState } from "react";
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import StarRatingInput from "./StarRatingInput";
import { createBookingReviewApi } from "../api/reviewApi";
import { uploadMediaApi } from "@/features/media/api/mediaApi";

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [photos, setPhotos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    if (!isOpen || !booking) return null;

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (photos.length + files.length > 5) {
            setErrorMsg("Bạn chỉ được tải lên tối đa 5 hình ảnh.");
            return;
        }

        setErrorMsg("");
        setIsUploading(true);

        try {
            const uploadedUrls = [];
            for (const file of files) {
                const res = await uploadMediaApi(file);
                if (res && res.url) {
                    uploadedUrls.push(res.url);
                }
            }
            setPhotos((prev) => [...prev, ...uploadedUrls]);
        } catch (err) {
            console.error("Lỗi khi tải ảnh lên:", err);
            setErrorMsg("Không thể tải ảnh lên. Vui lòng thử lại.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = (index) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            setErrorMsg("Vui lòng chọn số sao đánh giá (1 - 5 sao).");
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const payload = {
                rating,
                comment,
                photos
            };
            await createBookingReviewApi(booking.id, payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Lỗi khi gửi đánh giá:", err);
            const status = err.response?.status;
            const message = err.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá.";
            
            if (status === 403) {
                setErrorMsg(message || "Bạn không đủ điều kiện thực hiện đánh giá cho lịch hẹn này.");
            } else {
                setErrorMsg(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Đánh giá dịch vụ
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Mã lịch hẹn: #{booking.id} • {booking.branchName || "Chi nhánh Salon"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl flex items-start gap-2.5">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span className="leading-snug">{errorMsg}</span>
                        </div>
                    )}

                    {/* Star Rating Pick */}
                    <div className="flex flex-col items-center justify-center py-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bạn cảm thấy dịch vụ như thế nào?
                        </span>
                        <StarRatingInput value={rating} onChange={setRating} size={32} />
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2">
                            {rating === 5 && "Tuyệt vời!"}
                            {rating === 4 && "Hài lòng"}
                            {rating === 3 && "Bình thường"}
                            {rating === 2 && "Tạm được"}
                            {rating === 1 && "Không hài lòng"}
                        </span>
                    </div>

                    {/* Comment Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Nhận xét chi tiết (tùy chọn)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={1000}
                            rows={4}
                            placeholder="Chia sẻ trải nghiệm của bạn về không gian, kĩ năng nhân viên, thái độ phục vụ..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm resize-none transition"
                        />
                        <div className="text-right text-xs text-gray-400 mt-1">
                            {comment.length}/1000
                        </div>
                    </div>

                    {/* Photo Upload (Max 5) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Hình ảnh đính kèm ({photos.length}/5)
                            </label>
                        </div>

                        {/* Thumbnail Grid */}
                        <div className="grid grid-cols-5 gap-2 mb-3">
                            {photos.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                    <img src={url} alt={`review-${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(idx)}
                                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {photos.length < 5 && (
                                <label className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 dark:hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {isUploading ? (
                                        <Loader2 size={18} className="animate-spin text-rose-500" />
                                    ) : (
                                        <>
                                            <Upload size={18} className="text-gray-400 group-hover:text-rose-500" />
                                            <span className="text-[10px] text-gray-400 mt-1">Tải ảnh</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Đang gửi...</span>
                                </>
                            ) : (
                                <span>Gửi đánh giá</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
