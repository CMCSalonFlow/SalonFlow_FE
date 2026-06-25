import { useEffect, useState } from "react";
import {
    Card,
    Button,
    Form,
    Input,
    TimePicker,
    Switch,
    Steps,
    Row,
    Col,
    Typography,
    Divider,
    Space,
    Popconfirm,
    Drawer,
    List,
    Image,
    Tag,
    message,
    Spin
} from "antd";
import {
    MailOutlined,
    PhoneOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    PictureOutlined,
    CheckOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getMySalonApi,
    createSalonApi,
    updateSalonApi,
    deleteSalonApi
} from "../api/salonApi";

const { Title, Paragraph, Text } = Typography;

const DAYS_OF_WEEK = [
    { key: 1, name: "Thứ Hai (Monday)" },
    { key: 2, name: "Thứ Ba (Tuesday)" },
    { key: 3, name: "Thứ Tư (Wednesday)" },
    { key: 4, name: "Thứ Năm (Thursday)" },
    { key: 5, name: "Thứ Sáu (Friday)" },
    { key: 6, name: "Thứ Bảy (Saturday)" },
    { key: 0, name: "Chủ Nhật (Sunday)" }
];

export default function MySalonPage() {
    const [loading, setLoading] = useState(true);
    const [salon, setSalon] = useState(null);
    
    // Onboarding steps
    const [currentStep, setCurrentStep] = useState(0);
    const [onboardingForm] = Form.useForm();
    const [onboardingHours, setOnboardingHours] = useState(
        DAYS_OF_WEEK.map(day => ({
            dayOfWeek: day.key,
            dayName: day.name,
            isClosed: false,
            openTime: dayjs("09:00:00", "HH:mm:ss"),
            closeTime: dayjs("21:00:00", "HH:mm:ss")
        }))
    );
    const [onboardingPhotos, setOnboardingPhotos] = useState([]);
    const [newPhotoUrl, setNewPhotoUrl] = useState("");

    // Edit mode
    const [editDrawerVisible, setEditDrawerVisible] = useState(false);
    const [editForm] = Form.useForm();
    const [editHours, setEditHours] = useState([]);
    const [editPhotos, setEditPhotos] = useState([]);
    const [editNewPhotoUrl, setEditNewPhotoUrl] = useState("");

    const loadSalon = async () => {
        try {
            const data = await getMySalonApi();
            setSalon(data);
        } catch (error) {
            // If backend returns 404, salon remains null (shows onboarding)
            if (error.response && error.response.status === 404) {
                setSalon(null);
            } else {
                message.error("Không thể tải thông tin salon.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSalon();
    }, []);

    // ----------------------------------------------------
    // ONBOARDING FLOW HANDLERS
    // ----------------------------------------------------
    const handleAddPhotoOnboarding = () => {
        if (!newPhotoUrl.trim()) return;
        if (!newPhotoUrl.startsWith("http://") && !newPhotoUrl.startsWith("https://")) {
            message.warning("Vui lòng nhập URL ảnh hợp lệ bắt đầu bằng http:// hoặc https://");
            return;
        }
        setOnboardingPhotos([...onboardingPhotos, newPhotoUrl.trim()]);
        setNewPhotoUrl("");
    };

    const handleRemovePhotoOnboarding = (index) => {
        setOnboardingPhotos(onboardingPhotos.filter((_, i) => i !== index));
    };

    const handleOnboardingHoursChange = (dayKey, field, value) => {
        setOnboardingHours(prev => prev.map(item => {
            if (item.dayOfWeek === dayKey) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleNextStep = async () => {
        if (currentStep === 0) {
            try {
                await onboardingForm.validateFields();
                setCurrentStep(1);
            } catch {
                message.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            }
        } else if (currentStep === 1) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(3);
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleCreateSalon = async () => {
        try {
            const basicInfo = onboardingForm.getFieldsValue(true);
            
            // Clean up optional fields so empty strings become null (to avoid backend validation errors, e.g. @Email)
            const cleanedInfo = {};
            Object.keys(basicInfo).forEach(key => {
                const val = basicInfo[key];
                cleanedInfo[key] = (typeof val === "string" && val.trim() === "") ? null : val;
            });

            // Format hours for backend
            const hoursPayload = onboardingHours.map(h => ({
                dayOfWeek: h.dayOfWeek,
                openTime: h.isClosed ? null : h.openTime.format("HH:mm:ss"),
                closeTime: h.isClosed ? null : h.closeTime.format("HH:mm:ss"),
                isClosed: h.isClosed
            }));

            const payload = {
                ...cleanedInfo,
                hours: hoursPayload,
                photos: onboardingPhotos
            };

            setLoading(true);
            await createSalonApi(payload);
            message.success("Tạo salon thành công!");
            loadSalon();
            // Reset onboarding state
            setCurrentStep(0);
            onboardingForm.resetFields();
            setOnboardingPhotos([]);
        } catch (error) {
            const errData = error.response?.data;
            if (errData?.details && typeof errData.details === "object") {
                const detailsStr = Object.entries(errData.details)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(", ");
                message.error(`Lỗi validation: ${detailsStr}`);
            } else {
                message.error(errData?.message || "Lỗi khi tạo salon.");
            }
            setLoading(false);
        }
    };

    // ----------------------------------------------------
    // EDIT FLOW HANDLERS
    // ----------------------------------------------------
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

        // Initialize hours
        const initializedHours = DAYS_OF_WEEK.map(day => {
            const match = salon.hours?.find(h => h.dayOfWeek === day.key);
            return {
                dayOfWeek: day.key,
                dayName: day.name,
                isClosed: match ? match.isClosed : false,
                openTime: match && match.openTime ? dayjs(match.openTime, "HH:mm:ss") : dayjs("09:00:00", "HH:mm:ss"),
                closeTime: match && match.closeTime ? dayjs(match.closeTime, "HH:mm:ss") : dayjs("21:00:00", "HH:mm:ss")
            };
        });
        setEditHours(initializedHours);

        // Initialize photos
        setEditPhotos(salon.photos?.map(p => p.url) || []);
        setEditDrawerVisible(true);
    };

    const handleAddPhotoEdit = () => {
        if (!editNewPhotoUrl.trim()) return;
        if (!editNewPhotoUrl.startsWith("http://") && !editNewPhotoUrl.startsWith("https://")) {
            message.warning("Vui lòng nhập URL ảnh hợp lệ!");
            return;
        }
        setEditPhotos([...editPhotos, editNewPhotoUrl.trim()]);
        setEditNewPhotoUrl("");
    };

    const handleRemovePhotoEdit = (index) => {
        setEditPhotos(editPhotos.filter((_, i) => i !== index));
    };

    const handleEditHoursChange = (dayKey, field, value) => {
        setEditHours(prev => prev.map(item => {
            if (item.dayOfWeek === dayKey) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleUpdateSalon = async () => {
        try {
            const basicInfo = editForm.getFieldsValue();
            
            // Clean up optional fields so empty strings become null (to avoid backend validation errors, e.g. @Email)
            const cleanedInfo = {};
            Object.keys(basicInfo).forEach(key => {
                const val = basicInfo[key];
                cleanedInfo[key] = (typeof val === "string" && val.trim() === "") ? null : val;
            });

            const hoursPayload = editHours.map(h => ({
                dayOfWeek: h.dayOfWeek,
                openTime: h.isClosed ? null : h.openTime.format("HH:mm:ss"),
                closeTime: h.isClosed ? null : h.closeTime.format("HH:mm:ss"),
                isClosed: h.isClosed
            }));

            const payload = {
                ...cleanedInfo,
                hours: hoursPayload,
                photos: editPhotos
            };

            setLoading(true);
            await updateSalonApi(payload);
            message.success("Cập nhật thông tin salon thành công!");
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
                message.error(errData?.message || "Lỗi khi cập nhật salon.");
            }
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

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    // ----------------------------------------------------
    // RENDER: ONBOARDING (CREATE SALON)
    // ----------------------------------------------------
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
                                <ClockCircleOutlined style={{ marginRight: 8 }} /> Thiết lập lịch làm việc trong tuần
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
                                                <Space>
                                                    <Switch
                                                        checked={item.isClosed}
                                                        onChange={(checked) => handleOnboardingHoursChange(item.dayOfWeek, "isClosed", checked)}
                                                        checkedChildren="Nghỉ"
                                                        unCheckedChildren="Mở"
                                                    />
                                                </Space>
                                            </Col>
                                            <Col xs={12} sm={12}>
                                                {!item.isClosed ? (
                                                    <Space>
                                                        <TimePicker
                                                            value={item.openTime}
                                                            format="HH:mm"
                                                            onChange={(time) => handleOnboardingHoursChange(item.dayOfWeek, "openTime", time)}
                                                            allowClear={false}
                                                            placeholder="Giờ mở"
                                                        />
                                                        <Text>-</Text>
                                                        <TimePicker
                                                            value={item.closeTime}
                                                            format="HH:mm"
                                                            onChange={(time) => handleOnboardingHoursChange(item.dayOfWeek, "closeTime", time)}
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

                    {/* STEP 2: PHOTOS */}
                    {currentStep === 2 && (
                        <div>
                            <Title level={4} style={{ marginBottom: 20 }}>
                                <PictureOutlined style={{ marginRight: 8 }} /> Album ảnh Salon
                            </Title>
                            <Paragraph style={{ color: "#8c8c8c" }}>
                                Ảnh đầu tiên trong danh sách sẽ được tự động chọn làm hình ảnh đại diện (Primary).
                            </Paragraph>

                            <Space.Compact style={{ width: "100%", marginBottom: 30 }}>
                                <Input
                                    placeholder="Nhập URL hình ảnh (ví dụ: https://images.unsplash.com/...)"
                                    value={newPhotoUrl}
                                    onChange={e => setNewPhotoUrl(e.target.value)}
                                    onPressEnter={handleAddPhotoOnboarding}
                                    size="large"
                                />
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPhotoOnboarding} size="large">
                                    Thêm ảnh
                                </Button>
                            </Space.Compact>

                            <Row gutter={[16, 16]}>
                                {onboardingPhotos.map((url, index) => (
                                    <Col xs={12} sm={8} md={6} key={index}>
                                        <Card
                                            hoverable
                                            cover={
                                                <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                                                    <img src={url} alt={`Preview ${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    {index === 0 && (
                                                        <Tag color="gold" style={{ position: "absolute", top: 8, left: 8 }}>Ảnh chính</Tag>
                                                    )}
                                                </div>
                                            }
                                            actions={[
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemovePhotoOnboarding(index)}>
                                                    Xóa
                                                </Button>
                                            ]}
                                            styles={{ body: { padding: 0 } }}
                                        />
                                    </Col>
                                ))}
                                {onboardingPhotos.length === 0 && (
                                    <Col span={24}>
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "#bfbfbf", border: "1px dashed #d9d9d9", borderRadius: 8 }}>
                                            Chưa có hình ảnh nào được thêm vào.
                                        </div>
                                    </Col>
                                )}
                            </Row>

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
                                Salon của bạn đã sẵn sàng để được khởi tạo. Hãy nhấn nút hoàn thành bên dưới để lưu thông tin.
                            </Paragraph>

                            <Card style={{ maxWidth: 500, margin: "20px auto", textAlign: "left", borderRadius: 12 }} size="small">
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <div><Text type="secondary">Tên cửa hàng:</Text> <Text strong>{onboardingForm.getFieldValue("name")}</Text></div>
                                    <div><Text type="secondary">Địa chỉ:</Text> <Text strong>{onboardingForm.getFieldValue("address")}</Text></div>
                                    <div><Text type="secondary">Số ngày mở cửa:</Text> <Text strong>{onboardingHours.filter(h => !h.isClosed).length} ngày</Text></div>
                                    <div><Text type="secondary">Số lượng ảnh:</Text> <Text strong>{onboardingPhotos.length} ảnh</Text></div>
                                </Space>
                            </Card>

                            <Space style={{ marginTop: 30 }}>
                                <Button size="large" onClick={handlePrevStep}>Quay lại</Button>
                                <Button type="primary" size="large" onClick={handleCreateSalon}>Hoàn tất & Khởi tạo</Button>
                            </Space>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    // ----------------------------------------------------
    // RENDER: DASHBOARD VIEW (SALON CREATED)
    // ----------------------------------------------------
    const primaryPhoto = salon.photos?.find(p => p.isPrimary)?.url || (salon.photos && salon.photos[0]?.url);

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Row gutter={[24, 24]}>
                
                {/* SALON HERO CARD */}
                <Col span={24}>
                    <Card
                        className="glass-card"
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
                                            <div>
                                                {salon.website ? (
                                                    <a href={salon.website} target="_blank" rel="noreferrer" style={{ fontWeight: "bold" }}>
                                                        {salon.website.replace(/(^\w+:|^)\/\//, "")}
                                                    </a>
                                                ) : (
                                                    <Text strong>Chưa cập nhật</Text>
                                                )}
                                            </div>
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
                                        description="Bạn có chắc chắn muốn xóa salon này? Hành động này sẽ xóa toàn bộ dữ liệu lịch làm việc, chi nhánh và không thể hoàn tác."
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

                {/* OPERATING HOURS COLUMN */}
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

                {/* PHOTO GALLERY COLUMN */}
                <Col xs={24} md={12}>
                    <Card
                        title={<span><PictureOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Album Hình Ảnh</span>}
                        style={{ borderRadius: 16, height: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
                    >
                        <Row gutter={[12, 12]}>
                            {salon.photos?.map((photo, index) => (
                                <Col span={8} key={index}>
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

            {/* ----------------------------------------------------
                EDIT SALON DRAWER
            ---------------------------------------------------- */}
            <Drawer
                title="Chỉnh sửa thông tin Salon"
                width={650}
                onClose={() => setEditDrawerVisible(false)}
                open={editDrawerVisible}
                styles={{ body: { paddingBottom: 80 } }}
                extra={
                    <Space>
                        <Button onClick={() => setEditDrawerVisible(false)}>Hủy</Button>
                        <Button type="primary" onClick={handleUpdateSalon}>Lưu thay đổi</Button>
                    </Space>
                }
            >
                <Form form={editForm} layout="vertical">
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

                    <Title level={5} style={{ marginBottom: 15 }}>Bộ sưu tập hình ảnh</Title>
                    <Space.Compact style={{ width: "100%", marginBottom: 15 }}>
                        <Input
                            placeholder="Nhập URL hình ảnh mới..."
                            value={editNewPhotoUrl}
                            onChange={e => setEditNewPhotoUrl(e.target.value)}
                            onPressEnter={handleAddPhotoEdit}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPhotoEdit}>
                            Thêm
                        </Button>
                    </Space.Compact>

                    <List
                        bordered
                        dataSource={editPhotos}
                        renderItem={(url, index) => (
                            <List.Item
                                actions={[
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemovePhotoEdit(index)}>
                                        Xóa
                                    </Button>
                                ]}
                            >
                                <Space>
                                    <Image src={url} width={60} height={40} style={{ objectFit: "cover", borderRadius: 4 }} />
                                    <Text ellipsis style={{ maxWidth: 350 }}>{url}</Text>
                                    {index === 0 && <Tag color="gold">Ảnh chính</Tag>}
                                </Space>
                            </List.Item>
                        )}
                    />
                </Form>
            </Drawer>
        </div>
    );
}
