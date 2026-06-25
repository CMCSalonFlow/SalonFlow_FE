import { useEffect, useState } from "react";
import {
    Card, Button, Form, Input, TimePicker, Switch,
    Steps, Row, Col, Typography, Divider, Space,
    Upload, message, Spin, List, Image, Tag, Popconfirm, Drawer
} from "antd";
import {
    UploadOutlined,
    ClockCircleOutlined,
    PictureOutlined,
    CheckOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    MailOutlined,
    GlobalOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
    getMySalonApi,
    createSalonApi,
    updateSalonApi,
    deleteSalonApi
} from "../api/salonApi";

import { uploadMediaApi } from "@/features/media/api/mediaApi";

const { Title, Paragraph, Text } = Typography;

const DAYS_OF_WEEK = [
    { key: 1, name: "Thứ Hai" },
    { key: 2, name: "Thứ Ba" },
    { key: 3, name: "Thứ Tư" },
    { key: 4, name: "Thứ Năm" },
    { key: 5, name: "Thứ Sáu" },
    { key: 6, name: "Thứ Bảy" },
    { key: 0, name: "Chủ Nhật" }
];

const defaultHours = () =>
    DAYS_OF_WEEK.map(d => ({
        dayOfWeek: d.key,
        dayName: d.name,
        isClosed: false,
        openTime: dayjs("09:00:00", "HH:mm:ss"),
        closeTime: dayjs("21:00:00", "HH:mm:ss")
    }));

const mapHoursToPayload = (hours) =>
    hours.map(h => ({
        dayOfWeek: h.dayOfWeek,
        isClosed: h.isClosed,
        openTime: h.isClosed ? null : h.openTime.format("HH:mm:ss"),
        closeTime: h.isClosed ? null : h.closeTime.format("HH:mm:ss")
    }));

export default function MySalonPage() {
    const [loading, setLoading] = useState(false);
    const [salon, setSalon] = useState(null);

    // ── Onboarding ──────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState(0);
    const [onboardingForm] = Form.useForm();
    const [onboardingHours, setOnboardingHours] = useState(defaultHours());
    // Each item: { file: File, previewUrl: string }
    const [onboardingPhotos, setOnboardingPhotos] = useState([]);

    // ── Edit Drawer ──────────────────────────────────────────
    const [editDrawerVisible, setEditDrawerVisible] = useState(false);
    const [editForm] = Form.useForm();
    const [editHours, setEditHours] = useState([]);
    // Existing photos from server: { id, url, isPrimary }
    // New photos pending upload: { file: File, previewUrl: string }
    const [editExistingPhotos, setEditExistingPhotos] = useState([]);
    const [editNewPhotos, setEditNewPhotos] = useState([]);

    // ── Load ─────────────────────────────────────────────────
    const loadSalon = async () => {
        setLoading(true);
        try {
            const data = await getMySalonApi();
            setSalon(data);
        } catch (e) {
            if (e?.response?.status === 404) setSalon(null);
            else message.error("Load salon thất bại");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalon();
    }, []);

    // ── Upload helper ────────────────────────────────────────
    const uploadFiles = async (files) => {
        if (!files.length) return [];
        const results = await Promise.all(files.map(f => uploadMediaApi(f)));
        return results; // [{ id, url }, ...]
    };

    // ════════════════════════════════════════════════════════
    // ONBOARDING HANDLERS
    // ════════════════════════════════════════════════════════
    const handleOnboardingHoursChange = (dayKey, field, value) => {
        setOnboardingHours(prev =>
            prev.map(item =>
                item.dayOfWeek === dayKey ? { ...item, [field]: value } : item
            )
        );
    };

    const handleNextStep = async () => {
        if (currentStep === 0) {
            try {
                await onboardingForm.validateFields();
                setCurrentStep(1);
            } catch {
                message.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            }
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => setCurrentStep(prev => prev - 1);

    const handleAddOnboardingPhoto = (file) => {
        setOnboardingPhotos(prev => [
            ...prev,
            { file, previewUrl: URL.createObjectURL(file) }
        ]);
        return false; // prevent default ant upload behaviour
    };

    const handleRemoveOnboardingPhoto = (index) => {
        setOnboardingPhotos(prev => {
            const copy = [...prev];
            URL.revokeObjectURL(copy[index].previewUrl);
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleCreateSalon = async () => {
        try {
            setLoading(true);
            const basic = onboardingForm.getFieldsValue(true);

            // Clean up optional fields so empty strings become null (to avoid backend validation errors, e.g. @Email)
            const cleanedInfo = {};
            Object.keys(basic).forEach(key => {
                const val = basic[key];
                cleanedInfo[key] = (typeof val === "string" && val.trim() === "") ? null : val;
            });

            const uploadedPhotos = await uploadFiles(
                onboardingPhotos.map(p => p.file)
            );

            const payload = {
                ...cleanedInfo,
                hours: mapHoursToPayload(onboardingHours),
                logoMediaId: null,
                photoMediaIds: uploadedPhotos.map(p => p.id)
            };

            await createSalonApi(payload);
            message.success("Tạo salon thành công!");

            // Reset
            setCurrentStep(0);
            onboardingForm.resetFields();
            setOnboardingHours(defaultHours());
            setOnboardingPhotos([]);

            loadSalon();
        } catch (error) {
            const errData = error.response?.data;
            if (errData?.details && typeof errData.details === "object") {
                const detailsStr = Object.entries(errData.details)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(", ");
                message.error(`Lỗi validation: ${detailsStr}`);
            } else {
                message.error(errData?.message || "Lỗi tạo salon");
            }
        } finally {
            setLoading(false);
        }
    };

    // ════════════════════════════════════════════════════════
    // EDIT HANDLERS
    // ════════════════════════════════════════════════════════
    const handleOpenEdit = () => {
        if (!salon) return;

        editForm.setFieldsValue({
            name: salon.name,
            description: salon.description,
            address: salon.address,
            phone: salon.phone,
            email: salon.email,
            website: salon.website
        });

        const initializedHours = DAYS_OF_WEEK.map(day => {
            const match = salon.hours?.find(h => h.dayOfWeek === day.key);
            return {
                dayOfWeek: day.key,
                dayName: day.name,
                isClosed: match ? match.isClosed : false,
                openTime:
                    match?.openTime
                        ? dayjs(match.openTime, "HH:mm:ss")
                        : dayjs("09:00:00", "HH:mm:ss"),
                closeTime:
                    match?.closeTime
                        ? dayjs(match.closeTime, "HH:mm:ss")
                        : dayjs("21:00:00", "HH:mm:ss")
            };
        });
        setEditHours(initializedHours);
        setEditExistingPhotos(salon.photos || []);
        setEditNewPhotos([]);
        setEditDrawerVisible(true);
    };

    const handleEditHoursChange = (dayKey, field, value) => {
        setEditHours(prev =>
            prev.map(item =>
                item.dayOfWeek === dayKey ? { ...item, [field]: value } : item
            )
        );
    };

    const handleAddEditPhoto = (file) => {
        setEditNewPhotos(prev => [
            ...prev,
            { file, previewUrl: URL.createObjectURL(file) }
        ]);
        return false;
    };

    const handleRemoveExistingPhoto = (id) => {
        setEditExistingPhotos(prev => prev.filter(p => p.id !== id));
    };

    const handleRemoveNewPhoto = (index) => {
        setEditNewPhotos(prev => {
            const copy = [...prev];
            URL.revokeObjectURL(copy[index].previewUrl);
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleUpdateSalon = async () => {
        try {
            setLoading(true);
            const basic = editForm.getFieldsValue();

            // Clean up optional fields so empty strings become null (to avoid backend validation errors, e.g. @Email)
            const cleanedInfo = {};
            Object.keys(basic).forEach(key => {
                const val = basic[key];
                cleanedInfo[key] = (typeof val === "string" && val.trim() === "") ? null : val;
            });

            const uploadedPhotos = await uploadFiles(
                editNewPhotos.map(p => p.file)
            );

            const payload = {
                ...cleanedInfo,
                hours: mapHoursToPayload(editHours),
                photoMediaIds: [
                    ...editExistingPhotos.map(p => p.id),
                    ...uploadedPhotos.map(p => p.id)
                ]
            };

            await updateSalonApi(payload);
            message.success("Cập nhật thành công!");
            setEditDrawerVisible(false);
            loadSalon();
        } catch (error) {
            const errData = error.response?.data;
            if (errData?.details && typeof errData.details === "object") {
                const detailsStr = Object.entries(errData.details)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(", ");
                message.error(`Lỗi validation: ${detailsStr}`);
            } else {
                message.error(errData?.message || "Cập nhật thất bại");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSalon = async () => {
        setLoading(true);
        try {
            await deleteSalonApi();
            message.success("Xóa salon thành công!");
            setSalon(null);
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi xóa salon.");
        } finally {
            setLoading(false);
        }
    };

    // ════════════════════════════════════════════════════════
    // RENDER: LOADING
    // ════════════════════════════════════════════════════════
    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // RENDER: ONBOARDING (salon chưa tồn tại)
    // ════════════════════════════════════════════════════════
    if (!salon) {
        return (
            <div style={{ maxWidth: 850, margin: "0 auto", padding: "20px 0" }}>
                <Card style={{ borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
                    <div style={{ textAlign: "center", marginBottom: 30 }}>
                        <Title level={2}>Chào mừng bạn đến với SalonFlow!</Title>
                        <Paragraph style={{ color: "#8c8c8c" }}>
                            Hãy thiết lập cửa hàng salon của bạn để bắt đầu đón tiếp khách hàng.
                        </Paragraph>
                    </div>

                    <Steps
                        current={currentStep}
                        items={[
                            { title: "Thông tin chung" },
                            { title: "Lịch hoạt động" },
                            { title: "Bộ sưu tập ảnh" },
                            { title: "Hoàn tất" }
                        ]}
                        style={{ marginBottom: 40 }}
                    />

                    {/* STEP 0: BASIC INFO */}
                    {currentStep === 0 && (
                        <Form form={onboardingForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item
                                        name="name"
                                        label="Tên Salon"
                                        rules={[{ required: true, message: "Vui lòng nhập tên salon!" }]}
                                    >
                                        <Input placeholder="Ví dụ: Salon Tóc 30Shine" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="description" label="Mô tả">
                                        <Input.TextArea placeholder="Giới thiệu đôi nét về salon của bạn..." rows={4} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        name="address"
                                        label="Địa chỉ"
                                        rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
                                    >
                                        <Input placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="phone" label="Số điện thoại">
                                        <Input placeholder="0987654321" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        name="email"
                                        label="Email liên hệ"
                                        rules={[{ type: "email", message: "Email không đúng định dạng!" }]}
                                    >
                                        <Input placeholder="contact@salon.com" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="website" label="Website">
                                        <Input placeholder="https://salon.com" size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <div style={{ textAlign: "right", marginTop: 20 }}>
                                <Button type="primary" size="large" onClick={handleNextStep}>
                                    Tiếp tục
                                </Button>
                            </div>
                        </Form>
                    )}

                    {/* STEP 1: OPERATING HOURS */}
                    {currentStep === 1 && (
                        <div>
                            <Title level={4} style={{ marginBottom: 20 }}>
                                <ClockCircleOutlined style={{ marginRight: 8 }} />
                                Thiết lập lịch làm việc trong tuần
                            </Title>
                            <List
                                bordered
                                dataSource={onboardingHours}
                                renderItem={item => (
                                    <List.Item style={{ padding: "16px 24px" }}>
                                        <Row style={{ width: "100%", alignItems: "center" }} gutter={16}>
                                            <Col xs={24} sm={8}>
                                                <Text strong>{item.dayName}</Text>
                                            </Col>
                                            <Col xs={12} sm={4}>
                                                <Switch
                                                    checked={item.isClosed}
                                                    onChange={(checked) =>
                                                        handleOnboardingHoursChange(item.dayOfWeek, "isClosed", checked)
                                                    }
                                                    checkedChildren="Nghỉ"
                                                    unCheckedChildren="Mở"
                                                />
                                            </Col>
                                            <Col xs={12} sm={12}>
                                                {!item.isClosed ? (
                                                    <Space>
                                                        <TimePicker
                                                            value={item.openTime}
                                                            format="HH:mm"
                                                            onChange={(time) =>
                                                                handleOnboardingHoursChange(item.dayOfWeek, "openTime", time)
                                                            }
                                                            allowClear={false}
                                                            placeholder="Giờ mở"
                                                        />
                                                        <Text>-</Text>
                                                        <TimePicker
                                                            value={item.closeTime}
                                                            format="HH:mm"
                                                            onChange={(time) =>
                                                                handleOnboardingHoursChange(item.dayOfWeek, "closeTime", time)
                                                            }
                                                            allowClear={false}
                                                            placeholder="Giờ đóng"
                                                        />
                                                    </Space>
                                                ) : (
                                                    <Text type="secondary">Cửa hàng đóng cửa ngày này</Text>
                                                )}
                                            </Col>
                                        </Row>
                                    </List.Item>
                                )}
                            />
                            <Space style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
                                <Button size="large" onClick={handlePrevStep}>Quay lại</Button>
                                <Button type="primary" size="large" onClick={handleNextStep}>Tiếp tục</Button>
                            </Space>
                        </div>
                    )}

                    {/* STEP 2: PHOTOS — upload thực sự qua MediaAPI */}
                    {currentStep === 2 && (
                        <div>
                            <Title level={4} style={{ marginBottom: 8 }}>
                                <PictureOutlined style={{ marginRight: 8 }} />
                                Album ảnh Salon
                            </Title>
                            <Paragraph style={{ color: "#8c8c8c", marginBottom: 16 }}>
                                Ảnh đầu tiên sẽ được chọn làm hình đại diện (Primary). Ảnh sẽ được upload lên MinIO khi bạn hoàn tất.
                            </Paragraph>

                            <Upload
                                multiple
                                accept="image/*"
                                beforeUpload={handleAddOnboardingPhoto}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />} type="dashed">
                                    Chọn ảnh để upload
                                </Button>
                            </Upload>

                            {onboardingPhotos.length > 0 && (
                                <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                                    {onboardingPhotos.map((photo, index) => (
                                        <Col key={index} span={6}>
                                            <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 100 }}>
                                                <img
                                                    src={photo.previewUrl}
                                                    alt={`preview-${index}`}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                                {index === 0 && (
                                                    <Tag
                                                        color="gold"
                                                        style={{ position: "absolute", top: 4, left: 4, margin: 0, fontSize: 10, padding: "0 4px" }}
                                                    >
                                                        Chính
                                                    </Tag>
                                                )}
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    size="small"
                                                    onClick={() => handleRemoveOnboardingPhoto(index)}
                                                    style={{
                                                        position: "absolute", top: 4, right: 4,
                                                        background: "rgba(255,255,255,0.85)",
                                                        borderRadius: 4, padding: "0 4px"
                                                    }}
                                                />
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            )}

                            <Space style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
                                <Button size="large" onClick={handlePrevStep}>Quay lại</Button>
                                <Button type="primary" size="large" onClick={handleNextStep}>Tiếp tục</Button>
                            </Space>
                        </div>
                    )}

                    {/* STEP 3: CONFIRM & SUBMIT */}
                    {currentStep === 3 && (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <CheckOutlined style={{ fontSize: 60, color: "#52c41a", marginBottom: 20 }} />
                            <Title level={3}>Mọi thứ đã sẵn sàng!</Title>
                            <Paragraph>
                                Salon của bạn đã sẵn sàng để được khởi tạo. Nhấn <b>Hoàn tất</b> để lưu thông tin.
                            </Paragraph>

                            <Card style={{ maxWidth: 500, margin: "20px auto", textAlign: "left", borderRadius: 12 }} size="small">
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <div>
                                        <Text type="secondary">Tên cửa hàng:</Text>{" "}
                                        <Text strong>{onboardingForm.getFieldValue("name")}</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary">Địa chỉ:</Text>{" "}
                                        <Text strong>{onboardingForm.getFieldValue("address")}</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary">Số ngày mở cửa:</Text>{" "}
                                        <Text strong>{onboardingHours.filter(h => !h.isClosed).length} ngày</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary">Số lượng ảnh:</Text>{" "}
                                        <Text strong>{onboardingPhotos.length} ảnh</Text>
                                    </div>
                                </Space>
                            </Card>

                            <Space style={{ marginTop: 30 }}>
                                <Button size="large" onClick={handlePrevStep}>Quay lại</Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    loading={loading}
                                    onClick={handleCreateSalon}
                                >
                                    Hoàn tất &amp; Khởi tạo
                                </Button>
                            </Space>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // RENDER: DASHBOARD (salon đã tồn tại)
    // ════════════════════════════════════════════════════════
    const primaryPhoto =
        salon.photos?.find(p => p.isPrimary)?.url || salon.photos?.[0]?.url;

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Row gutter={[24, 24]}>

                {/* SALON HERO CARD */}
                <Col span={24}>
                    <Card
                        style={{
                            borderRadius: 20,
                            overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                            border: "none",
                            background: "#fff"
                        }}
                        styles={{ body: { padding: 0 } }}
                    >
                        <div style={{ position: "relative", height: 260, backgroundColor: "#001529" }}>
                            {primaryPhoto && (
                                <img
                                    src={primaryPhoto}
                                    alt={salon.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }}
                                />
                            )}
                            <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, color: "#fff" }}>
                                <Space align="baseline">
                                    <Title level={1} style={{ color: "#fff", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                                        {salon.name}
                                    </Title>
                                    <Tag color="success" style={{ marginLeft: 8 }}>Đang hoạt động</Tag>
                                </Space>
                                <Paragraph style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, margin: "8px 0 0 0", maxWidth: 650 }}>
                                    {salon.description || "Chưa có mô tả nào cho salon này."}
                                </Paragraph>
                            </div>
                        </div>

                        <div style={{ padding: 24 }}>
                            <Row gutter={[24, 16]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Space>
                                        <EnvironmentOutlined style={{ color: "#1890ff" }} />
                                        <div>
                                            <div style={{ color: "#8c8c8c", fontSize: 12 }}>Địa chỉ</div>
                                            <Text strong>{salon.address}</Text>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Space>
                                        <PhoneOutlined style={{ color: "#1890ff" }} />
                                        <div>
                                            <div style={{ color: "#8c8c8c", fontSize: 12 }}>Điện thoại</div>
                                            <Text strong>{salon.phone || "Chưa cập nhật"}</Text>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Space>
                                        <MailOutlined style={{ color: "#1890ff" }} />
                                        <div>
                                            <div style={{ color: "#8c8c8c", fontSize: 12 }}>Email</div>
                                            <Text strong>{salon.email || "Chưa cập nhật"}</Text>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Space>
                                        <GlobalOutlined style={{ color: "#1890ff" }} />
                                        <div>
                                            <div style={{ color: "#8c8c8c", fontSize: 12 }}>Website</div>
                                            {salon.website ? (
                                                <a href={salon.website} target="_blank" rel="noreferrer" style={{ fontWeight: "bold" }}>
                                                    {salon.website.replace(/^(https?:\/\/)/, "")}
                                                </a>
                                            ) : (
                                                <Text strong>Chưa cập nhật</Text>
                                            )}
                                        </div>
                                    </Space>
                                </Col>
                            </Row>

                            <Divider style={{ margin: "20px 0" }} />

                            <Row justify="space-between" align="middle">
                                <Text type="secondary" style={{ fontSize: 12 }}>ID Salon: #{salon.id}</Text>
                                <Space>
                                    <Button type="primary" icon={<EditOutlined />} onClick={handleOpenEdit} size="large">
                                        Chỉnh sửa Profile
                                    </Button>
                                    <Popconfirm
                                        title="Xóa salon"
                                        description="Bạn có chắc chắn muốn xóa salon này? Hành động này không thể hoàn tác."
                                        okText="Có, xóa đi"
                                        cancelText="Không"
                                        onConfirm={handleDeleteSalon}
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button danger icon={<DeleteOutlined />} size="large">
                                            Xóa Salon
                                        </Button>
                                    </Popconfirm>
                                </Space>
                            </Row>
                        </div>
                    </Card>
                </Col>

                {/* OPERATING HOURS */}
                <Col xs={24} md={12}>
                    <Card
                        title={<span><ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Lịch Làm Việc</span>}
                        style={{ borderRadius: 16, height: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
                    >
                        <List
                            dataSource={DAYS_OF_WEEK}
                            renderItem={day => {
                                const workHour = salon.hours?.find(h => h.dayOfWeek === day.key);
                                return (
                                    <List.Item style={{ padding: "12px 16px" }}>
                                        <Row style={{ width: "100%" }} justify="space-between" align="middle">
                                            <Col><Text strong>{day.name}</Text></Col>
                                            <Col>
                                                {workHour && !workHour.isClosed ? (
                                                    <Space>
                                                        <Tag color="blue">{workHour.openTime?.substring(0, 5)}</Tag>
                                                        <Text>-</Text>
                                                        <Tag color="blue">{workHour.closeTime?.substring(0, 5)}</Tag>
                                                    </Space>
                                                ) : (
                                                    <Tag color="red">Đóng cửa</Tag>
                                                )}
                                            </Col>
                                        </Row>
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>
                </Col>

                {/* PHOTO GALLERY */}
                <Col xs={24} md={12}>
                    <Card
                        title={<span><PictureOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Album Hình Ảnh</span>}
                        style={{ borderRadius: 16, height: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
                    >
                        <Row gutter={[12, 12]}>
                            {salon.photos?.map((photo, index) => (
                                <Col span={8} key={photo.id ?? index}>
                                    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 110 }}>
                                        <Image
                                            src={photo.url}
                                            alt={`Salon Photo ${index}`}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            wrapperStyle={{ width: "100%", height: "100%" }}
                                        />
                                        {photo.isPrimary && (
                                            <Tag color="gold" style={{ position: "absolute", top: 4, left: 4, margin: 0, fontSize: 10, padding: "0 4px" }}>
                                                Chính
                                            </Tag>
                                        )}
                                    </div>
                                </Col>
                            ))}
                            {(!salon.photos || salon.photos.length === 0) && (
                                <Col span={24}>
                                    <div style={{ textAlign: "center", padding: "30px 0", color: "#bfbfbf" }}>
                                        Chưa có hình ảnh nào cho salon này.
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* ══════════════════════════════════════════════════════
                EDIT SALON DRAWER
            ══════════════════════════════════════════════════════ */}
            <Drawer
                title="Chỉnh sửa thông tin Salon"
                width={680}
                onClose={() => setEditDrawerVisible(false)}
                open={editDrawerVisible}
                styles={{ body: { paddingBottom: 80 } }}
                extra={
                    <Space>
                        <Button onClick={() => setEditDrawerVisible(false)}>Hủy</Button>
                        <Button type="primary" loading={loading} onClick={handleUpdateSalon}>
                            Lưu thay đổi
                        </Button>
                    </Space>
                }
            >
                <Form form={editForm} layout="vertical">
                    {/* ── Thông tin cơ bản ── */}
                    <Title level={5} style={{ marginBottom: 15 }}>Thông tin cơ bản</Title>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="name" label="Tên Salon" rules={[{ required: true, message: "Vui lòng nhập tên!" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="description" label="Mô tả">
                                <Input.TextArea rows={3} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="phone" label="Điện thoại">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Email không đúng định dạng!" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="website" label="Website">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider />

                    {/* ── Lịch làm việc ── */}
                    <Title level={5} style={{ marginBottom: 15 }}>Lịch làm việc</Title>
                    <List
                        size="small"
                        bordered
                        dataSource={editHours}
                        renderItem={item => (
                            <List.Item style={{ padding: "10px 15px" }}>
                                <Row style={{ width: "100%", alignItems: "center" }} gutter={16}>
                                    <Col xs={24} sm={8}>
                                        <Text strong>{item.dayName}</Text>
                                    </Col>
                                    <Col xs={12} sm={4}>
                                        <Switch
                                            checked={item.isClosed}
                                            onChange={(checked) => handleEditHoursChange(item.dayOfWeek, "isClosed", checked)}
                                            checkedChildren="Nghỉ"
                                            unCheckedChildren="Mở"
                                        />
                                    </Col>
                                    <Col xs={12} sm={12}>
                                        {!item.isClosed ? (
                                            <Space size="small">
                                                <TimePicker
                                                    value={item.openTime}
                                                    format="HH:mm"
                                                    onChange={(time) => handleEditHoursChange(item.dayOfWeek, "openTime", time)}
                                                    allowClear={false}
                                                    size="small"
                                                />
                                                <Text>-</Text>
                                                <TimePicker
                                                    value={item.closeTime}
                                                    format="HH:mm"
                                                    onChange={(time) => handleEditHoursChange(item.dayOfWeek, "closeTime", time)}
                                                    allowClear={false}
                                                    size="small"
                                                />
                                            </Space>
                                        ) : (
                                            <Text type="secondary" style={{ fontSize: 12 }}>Đóng cửa</Text>
                                        )}
                                    </Col>
                                </Row>
                            </List.Item>
                        )}
                    />

                    <Divider />

                    {/* ── Bộ sưu tập hình ảnh ── */}
                    <Title level={5} style={{ marginBottom: 8 }}>Bộ sưu tập hình ảnh</Title>
                    <Paragraph style={{ color: "#8c8c8c", fontSize: 12, marginBottom: 12 }}>
                        Ảnh hiện có giữ nguyên ID trên MinIO. Ảnh mới sẽ được upload lên MinIO khi lưu.
                    </Paragraph>

                    <Upload
                        multiple
                        accept="image/*"
                        beforeUpload={handleAddEditPhoto}
                        showUploadList={false}
                    >
                        <Button icon={<PlusOutlined />} type="dashed" style={{ marginBottom: 16 }}>
                            Thêm ảnh mới
                        </Button>
                    </Upload>

                    {/* Ảnh hiện có (từ server) */}
                    {editExistingPhotos.length > 0 && (
                        <>
                            <Text type="secondary" style={{ fontSize: 12 }}>Ảnh hiện có:</Text>
                            <Row gutter={[8, 8]} style={{ marginTop: 8, marginBottom: 16 }}>
                                {editExistingPhotos.map((photo, index) => (
                                    <Col key={photo.id} span={6}>
                                        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 80 }}>
                                            <img
                                                src={photo.url}
                                                alt={`existing-${index}`}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                            {photo.isPrimary && (
                                                <Tag
                                                    color="gold"
                                                    style={{ position: "absolute", top: 4, left: 4, margin: 0, fontSize: 10, padding: "0 4px" }}
                                                >
                                                    Chính
                                                </Tag>
                                            )}
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                onClick={() => handleRemoveExistingPhoto(photo.id)}
                                                style={{
                                                    position: "absolute", top: 4, right: 4,
                                                    background: "rgba(255,255,255,0.85)",
                                                    borderRadius: 4, padding: "0 4px"
                                                }}
                                            />
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}

                    {/* Ảnh mới chờ upload */}
                    {editNewPhotos.length > 0 && (
                        <>
                            <Text type="secondary" style={{ fontSize: 12 }}>Ảnh mới (chờ upload):</Text>
                            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                {editNewPhotos.map((photo, index) => (
                                    <Col key={index} span={6}>
                                        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 80, border: "2px dashed #1890ff" }}>
                                            <img
                                                src={photo.previewUrl}
                                                alt={`new-${index}`}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                onClick={() => handleRemoveNewPhoto(index)}
                                                style={{
                                                    position: "absolute", top: 4, right: 4,
                                                    background: "rgba(255,255,255,0.85)",
                                                    borderRadius: 4, padding: "0 4px"
                                                }}
                                            />
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </Form>
            </Drawer>
        </div>
    );
}
