import { useState, useEffect } from "react";
import {
    Card,
    Typography,
    Row,
    Col,
    Slider,
    InputNumber,
    Button,
    Tag,
    Table,
    Select,
    Space,
    Divider,
    message,
    Spin,
    Modal,
    Tooltip
} from "antd";
import {
    RobotOutlined,
    SaveOutlined,
    HistoryOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    SlidersOutlined
} from "@ant-design/icons";
import {
    getSmartSchedulingConfigApi,
    updateSmartSchedulingConfigApi,
    getSmartSchedulingLogsApi
} from "@/features/ai/api/smartSchedulingApi";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

export default function SmartSchedulingConfigPage() {
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);

    // AI Weights state
    const [workloadWeight, setWorkloadWeight] = useState(0.4);
    const [travelWeight, setTravelWeight] = useState(0.3);
    const [serviceFitWeight, setServiceFitWeight] = useState(0.3);

    // Logs state
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [selectedLog, setSelectedLog] = useState(null);

    // Tính tổng trọng số
    const totalWeight = Number((workloadWeight + travelWeight + serviceFitWeight).toFixed(3));
    const isValidSum = Math.abs(totalWeight - 1.0) < 0.001;

    // 1. Tải danh sách chi nhánh của Owner
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await getMyBranchesApi();
                setBranches(data || []);
                if (data && data.length > 0) {
                    setSelectedBranchId(data[0].id);
                }
            } catch (err) {
                console.error("Lỗi khi tải danh sách chi nhánh:", err);
            }
        };
        fetchBranches();
    }, []);

    // 2. Tải cấu hình AI & Logs khi chi nhánh thay đổi
    useEffect(() => {
        if (!selectedBranchId) return;

        loadConfig(selectedBranchId);
        loadLogs(selectedBranchId, 1, pagination.pageSize);
    }, [selectedBranchId]);

    const loadConfig = async (branchId) => {
        try {
            setLoadingConfig(true);
            const data = await getSmartSchedulingConfigApi(branchId);
            if (data) {
                setWorkloadWeight(Number(data.workloadWeight || 0.4));
                setTravelWeight(Number(data.travelWeight || 0.3));
                setServiceFitWeight(Number(data.serviceFitWeight || 0.3));
            }
        } catch (err) {
            console.error("Lỗi khi tải cấu hình AI:", err);
            message.error("Không thể tải cấu hình AI của chi nhánh.");
        } finally {
            setLoadingConfig(false);
        }
    };

    const loadLogs = async (branchId, page = 1, size = 10) => {
        try {
            setLoadingLogs(true);
            const res = await getSmartSchedulingLogsApi(branchId, { page: page - 1, size });
            setLogs(res.content || []);
            setPagination({
                current: page,
                pageSize: size,
                total: res.totalElements || 0
            });
        } catch (err) {
            console.error("Lỗi khi tải log AI:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    // 3. Xử lý lưu cấu hình AI
    const handleSaveConfig = async () => {
        if (!isValidSum) {
            message.error("Tổng 3 trọng số phải bằng 1.0 (100%). Hiện tại đang là " + totalWeight);
            return;
        }

        try {
            setSavingConfig(true);
            const dto = {
                workloadWeight,
                travelWeight,
                serviceFitWeight
            };
            await updateSmartSchedulingConfigApi(selectedBranchId, dto);
            message.success("Cập nhật cấu hình trọng số AI Smart Scheduling thành công!");
            loadConfig(selectedBranchId);
        } catch (err) {
            console.error("Lỗi cập nhật cấu hình AI:", err);
            message.error(err.response?.data?.message || "Lỗi khi cập nhật cấu hình AI.");
        } finally {
            setSavingConfig(false);
        }
    };

    const handleTableChange = (newPagination) => {
        loadLogs(selectedBranchId, newPagination.current, newPagination.pageSize);
    };

    // Columns cho bảng Log
    const columns = [
        {
            title: "Mã Log ID",
            dataIndex: "id",
            key: "id",
            width: 90,
            render: id => <strong>#{id}</strong>
        },
        {
            title: "Ngày Đặt Lịch",
            dataIndex: "requestDate",
            key: "requestDate",
            render: d => d ? dayjs(d).format("DD/MM/YYYY") : "—"
        },
        {
            title: "Chi Nhánh",
            dataIndex: "branchId",
            key: "branchId",
            render: id => {
                const b = branches.find(item => item.id === id);
                return b ? b.name : `Chi nhánh #${id}`;
            }
        },
        {
            title: "Thời Gian Đề Xuất",
            dataIndex: "createdAt",
            key: "createdAt",
            render: d => d ? dayjs(d).format("DD/MM/YYYY HH:mm:ss") : "—"
        },
        {
            title: "Chi Tiết Log Raw",
            key: "action",
            render: (_, record) => (
                <Button
                    size="small"
                    type="link"
                    icon={<InfoCircleOutlined />}
                    onClick={() => setSelectedLog(record)}
                >
                    Xem JSON Log
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                        <RobotOutlined style={{ color: "#722ed1" }} /> Quản Lý AI Smart Scheduling
                    </Title>
                    <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                        Cấu hình trọng số thuật toán gợi ý slot tối ưu và theo dõi nhật ký hoạt động của AI.
                    </Paragraph>
                </div>

                {/* Branch Selector */}
                {branches.length > 0 && (
                    <Space>
                        <Text strong>Chi nhánh:</Text>
                        <Select
                            value={selectedBranchId}
                            onChange={setSelectedBranchId}
                            style={{ width: 240 }}
                            size="large"
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                        />
                    </Space>
                )}
            </div>

            {/* SECTION 1: CẤU HÌNH TRỌNG SỐ THUẬT TOÁN */}
            <Card
                title={
                    <Space style={{ fontSize: 16 }}>
                        <SlidersOutlined style={{ color: "#1890ff" }} />
                        <strong>Cấu Hình Trọng Số Thuật Toán AI (Scoring Weights)</strong>
                    </Space>
                }
                style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
            >
                {loadingConfig ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Spin tip="Đang tải cấu hình AI..." />
                    </div>
                ) : (
                    <div>
                        <Paragraph style={{ color: "#595959", marginBottom: 20 }}>
                            Thuật toán AI sử dụng 3 tiêu chí chính để chấm điểm (Score) cho từng khung giờ. Tổng 3 trọng số phải <strong>bằng 1.0 (100%)</strong>.
                        </Paragraph>

                        <Row gutter={[32, 24]}>
                            {/* Trọng số 1: Workload */}
                            <Col xs={24} md={8}>
                                <Card type="inner" style={{ borderRadius: 12, backgroundColor: "#fafafa" }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                                        ⚖️ Trọng Số Tải Công Việc (Workload)
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                                        Ưu tiên cân bằng lịch làm việc của nhân viên, tránh dồn ca quá tải.
                                    </Text>

                                    <Row gutter={12} align="middle">
                                        <Col span={16}>
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={workloadWeight}
                                                onChange={val => setWorkloadWeight(val)}
                                            />
                                        </Col>
                                        <Col span={8}>
                                            <InputNumber
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={workloadWeight}
                                                onChange={val => setWorkloadWeight(val || 0)}
                                                style={{ width: "100%" }}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>

                            {/* Trọng số 2: Travel / Location */}
                            <Col xs={24} md={8}>
                                <Card type="inner" style={{ borderRadius: 12, backgroundColor: "#fafafa" }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                                        📍 Trọng Số Khoảng Cách (Travel/Location)
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                                        Ưu tiên các yếu tố khoảng cách và vị trí địa lý của khách hàng.
                                    </Text>

                                    <Row gutter={12} align="middle">
                                        <Col span={16}>
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={travelWeight}
                                                onChange={val => setTravelWeight(val)}
                                            />
                                        </Col>
                                        <Col span={8}>
                                            <InputNumber
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={travelWeight}
                                                onChange={val => setTravelWeight(val || 0)}
                                                style={{ width: "100%" }}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>

                            {/* Trọng số 3: Service Fit */}
                            <Col xs={24} md={8}>
                                <Card type="inner" style={{ borderRadius: 12, backgroundColor: "#fafafa" }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                                        ✂️ Trọng Số Độ Phù Hợp Tay Nghề (Service Fit)
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                                        Ưu tiên thợ có chuyên môn cao nhất phù hợp với dịch vụ khách chọn.
                                    </Text>

                                    <Row gutter={12} align="middle">
                                        <Col span={16}>
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={serviceFitWeight}
                                                onChange={val => setServiceFitWeight(val)}
                                            />
                                        </Col>
                                        <Col span={8}>
                                            <InputNumber
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={serviceFitWeight}
                                                onChange={val => setServiceFitWeight(val || 0)}
                                                style={{ width: "100%" }}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>

                        <Divider style={{ margin: "24px 0" }} />

                        {/* Tổng Trọng Số Validation Badge & Save Button */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                            <div>
                                <Text strong style={{ marginRight: 12, fontSize: 15 }}>Tổng trọng số hiện tại:</Text>
                                {isValidSum ? (
                                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14, padding: "4px 12px", borderRadius: 8 }}>
                                        {totalWeight.toFixed(2)} / 1.0 (Hợp lệ)
                                    </Tag>
                                ) : (
                                    <Tag icon={<WarningOutlined />} color="error" style={{ fontSize: 14, padding: "4px 12px", borderRadius: 8 }}>
                                        {totalWeight.toFixed(2)} / 1.0 (Cần bằng 1.0)
                                    </Tag>
                                )}
                            </div>

                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={savingConfig}
                                disabled={!isValidSum}
                                onClick={handleSaveConfig}
                                size="large"
                                style={{
                                    borderRadius: 10,
                                    backgroundColor: isValidSum ? "#52c41a" : undefined,
                                    borderColor: isValidSum ? "#52c41a" : undefined,
                                    fontWeight: 600
                                }}
                            >
                                Lưu Cấu Hình AI
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* SECTION 2: NHẬT KÝ GỢI Ý (LOGS) */}
            <Card
                title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <Space style={{ fontSize: 16 }}>
                            <HistoryOutlined style={{ color: "#722ed1" }} />
                            <strong>Lịch Sử Gợi Ý AI (AI Recommendation Logs)</strong>
                        </Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => loadLogs(selectedBranchId, pagination.current, pagination.pageSize)}
                            loading={loadingLogs}
                        >
                            Tải Lại Logs
                        </Button>
                    </div>
                }
                style={{ borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
            >
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    loading={loadingLogs}
                    pagination={pagination}
                    onChange={handleTableChange}
                    bordered
                />
            </Card>

            {/* Modal xem raw log detail */}
            <Modal
                title={`Chi tiết Log AI #${selectedLog?.id}`}
                open={Boolean(selectedLog)}
                onCancel={() => setSelectedLog(null)}
                footer={[
                    <Button key="close" onClick={() => setSelectedLog(null)}>
                        Đóng
                    </Button>
                ]}
                width={700}
            >
                {selectedLog && (
                    <div>
                        <p><strong>Ngày tạo log:</strong> {dayjs(selectedLog.createdAt).format("DD/MM/YYYY HH:mm:ss")}</p>
                        <p><strong>Request payload / Details:</strong></p>
                        <pre style={{
                            backgroundColor: "#272822",
                            color: "#f8f8f2",
                            padding: 16,
                            borderRadius: 8,
                            maxHeight: 400,
                            overflow: "auto",
                            fontSize: 12
                        }}>
                            {JSON.stringify(selectedLog, null, 2)}
                        </pre>
                    </div>
                )}
            </Modal>
        </div>
    );
}
