import React, { useState, useEffect } from "react";
import { Modal, Rate, Input, Upload, Button, Alert, message, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createBookingReviewApi } from "../api/reviewApi";
import { uploadMediaApi } from "@/features/media/api/mediaApi";

const { Text, Title } = Typography;
const { TextArea } = Input;

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [fileList, setFileList] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (isOpen) {
            setRating(5);
            setComment("");
            setFileList([]);
            setErrorMsg("");
        }
    }, [isOpen]);

    if (!booking) return null;

    const handleCustomUpload = async ({ file, onSuccess: uploadSuccess, onError: uploadError }) => {
        if (fileList.length >= 5) {
            message.warning("Chỉ được tải lên tối đa 5 hình ảnh.");
            uploadError("Tối đa 5 ảnh");
            return;
        }

        setIsUploading(true);
        setErrorMsg("");

        // Tạo preview URL từ trình duyệt để hiển thị ảnh tức thì không bị lỗi
        const localPreviewUrl = URL.createObjectURL(file);
        const fileUid = file.uid || `photo-${Date.now()}-${Math.random()}`;

        const newFileObj = {
            uid: fileUid,
            name: file.name || "image.png",
            status: "uploading",
            thumbUrl: localPreviewUrl,
            url: localPreviewUrl
        };

        setFileList((prev) => [...prev, newFileObj]);

        try {
            const res = await uploadMediaApi(file);
            const serverUrl = res?.url || res?.fileUrl;
            if (serverUrl) {
                setFileList((prev) =>
                    prev.map((item) =>
                        item.uid === fileUid
                            ? { ...item, status: "done", url: serverUrl, serverUrl: serverUrl }
                            : item
                    )
                );
                uploadSuccess(serverUrl);
                message.success("Đã tải ảnh lên thành công!");
            } else {
                setFileList((prev) => prev.filter((item) => item.uid !== fileUid));
                uploadError("Không nhận được URL ảnh từ server");
            }
        } catch (err) {
            console.error("Lỗi khi tải ảnh lên:", err);
            setErrorMsg("Không thể tải ảnh lên MinIO. Vui lòng thử lại.");
            setFileList((prev) => prev.filter((item) => item.uid !== fileUid));
            uploadError(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = (file) => {
        setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    };

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) {
            setErrorMsg("Vui lòng chọn số sao đánh giá (1 - 5 sao).");
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const photos = fileList
                .filter((f) => f.status === "done" && (f.serverUrl || f.url))
                .map((f) => f.serverUrl || f.url);

            const payload = {
                rating,
                comment,
                photos
            };

            await createBookingReviewApi(booking.id, payload);
            message.success("Đánh giá dịch vụ thành công!");
            if (onSuccess) onSuccess(booking.id);
            onClose();
        } catch (err) {
            console.error("Lỗi khi gửi đánh giá:", err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá.";
            if (status === 403) {
                setErrorMsg(msg || "Bạn không đủ điều kiện thực hiện đánh giá cho lịch hẹn này.");
            } else {
                setErrorMsg(msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratingTexts = ["", "Không hài lòng", "Tạm được", "Bình thường", "Hài lòng", "Tuyệt vời!"];

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            title={
                <div>
                    <Title level={4} style={{ margin: 0 }}>Đánh giá dịch vụ</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Mã lịch hẹn: #{booking.id} • {booking.branchName || "Chi nhánh Salon"}
                    </Text>
                </div>
            }
            footer={[
                <Button key="cancel" onClick={onClose} disabled={isSubmitting}>
                    Hủy bỏ
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={isSubmitting}
                    disabled={isUploading}
                    onClick={handleSubmit}
                    style={{ backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}
                >
                    Gửi đánh giá
                </Button>
            ]}
            destroyOnClose
            centered
            width={520}
        >
            <div style={{ padding: "12px 0" }}>
                {errorMsg && (
                    <Alert
                        message={errorMsg}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                        closable
                        onClose={() => setErrorMsg("")}
                    />
                )}

                {/* Rating Stars Section */}
                <div
                    style={{
                        textAlign: "center",
                        padding: "16px",
                        background: "#fffbe6",
                        border: "1px solid #ffe58f",
                        borderRadius: 12,
                        marginBottom: 20
                    }}
                >
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
                        Bạn cảm thấy dịch vụ như thế nào?
                    </Text>
                    <Rate
                        value={rating}
                        onChange={setRating}
                        style={{ fontSize: 32, color: "#fa8c16" }}
                    />
                    {rating > 0 && (
                        <Text strong style={{ display: "block", marginTop: 8, color: "#fa8c16", fontSize: 15 }}>
                            {ratingTexts[rating]}
                        </Text>
                    )}
                </div>

                {/* Comment Input */}
                <div style={{ marginBottom: 20 }}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                        Nhận xét chi tiết (tùy chọn):
                    </Text>
                    <TextArea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        showCount
                        placeholder="Chia sẻ trải nghiệm của bạn về không gian, kỹ năng nhân viên, thái độ phục vụ..."
                        style={{ borderRadius: 8 }}
                    />
                </div>

                {/* Photo Upload */}
                <div>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                        Hình ảnh đính kèm (tối đa 5 ảnh):
                    </Text>
                    <Upload
                        listType="picture-card"
                        customRequest={handleCustomUpload}
                        onRemove={handleRemovePhoto}
                        fileList={fileList}
                        accept="image/*"
                        maxCount={5}
                    >
                        {fileList.length < 5 && (
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8, fontSize: 12 }}>Tải ảnh</div>
                            </div>
                        )}
                    </Upload>
                </div>
            </div>
        </Modal>
    );
};

export default ReviewModal;


