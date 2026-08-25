import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Input,
    Space,
    Card,
    Typography,
    message
} from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { getAllSalonsApi } from "../api/salonApi";
import SalonDetailDrawer from "../components/SalonDetailDrawer";

const { Title } = Typography;

export default function SalonListPage() {
    const [salons, setSalons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    
    // Detail drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedSalonId, setSelectedSalonId] = useState(null);

    const loadSalons = async () => {
        setLoading(true);
        try {
            const data = await getAllSalonsApi();
            setSalons(data || []);
        } catch {
            message.error("Không thể tải danh sách salon.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSalons();
    }, []);

    const handleViewDetail = (id) => {
        setSelectedSalonId(id);
        setDrawerOpen(true);
    };

    // Filter salons locally
    const filteredSalons = salons.filter(salon => {
        const text = searchText.toLowerCase();
        return (
            salon.name?.toLowerCase().includes(text) ||
            salon.phone?.toLowerCase().includes(text) ||
            salon.email?.toLowerCase().includes(text)
        );
    });

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            width: 80,
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Tên Salon",
            dataIndex: "name",
            render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            width: 140,
            render: (text) => text || <span style={{ color: "#bfbfbf", fontStyle: "italic" }}>Chưa cập nhật</span>
        },
        {
            title: "Email",
            dataIndex: "email",
            render: (text) => text || <span style={{ color: "#bfbfbf", fontStyle: "italic" }}>Chưa cập nhật</span>
        },

        {
            title: "Website",
            dataIndex: "website",
            render: (text) => {
                if (!text) return <span style={{ color: "#bfbfbf", fontStyle: "italic" }}>Chưa cập nhật</span>;
                return (
                    <a href={text} target="_blank" rel="noreferrer">
                        {text.replace(/(^\w+:|^)\/\//, "")}
                    </a>
                );
            }
        },
        {
            title: "Thao tác",
            key: "action",
            width: 150,
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record.id)}
                >
                    Xem chi tiết
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: "10px 0" }}>
            <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                        <Title level={3} style={{ margin: 0 }}>Quản lý Salon</Title>
                        <Input
                            placeholder="Tìm kiếm theo tên, địa chỉ, số điện thoại..."
                            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 350 }}
                            allowClear
                        />
                    </div>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={filteredSalons}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng số ${total} salon`
                        }}
                    />
                </Space>
            </Card>

            <SalonDetailDrawer
                open={drawerOpen}
                salonId={selectedSalonId}
                onClose={() => setDrawerOpen(false)}
                afterOpenChange={(isOpen) => {
                    if (!isOpen) setSelectedSalonId(null);
                }}
            />
        </div>
    );
}
