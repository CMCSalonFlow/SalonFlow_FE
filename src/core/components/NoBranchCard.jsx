import { Card, Typography, Button } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

export default function NoBranchCard({
    title = "Bạn chưa tạo Chi nhánh nào!",
    description = "Vui lòng thêm ít nhất một chi nhánh cho Salon của bạn trước khi tiếp tục.",
    buttonText = "Tới trang Quản lý Chi nhánh",
    targetUrl = "/owner/branches"
}) {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
            <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <ShopOutlined style={{ fontSize: 48, color: "#bfbfbf", marginBottom: 20 }} />
                <Title level={3}>{title}</Title>
                <Paragraph style={{ color: "#8c8c8c", fontSize: 15, lineHeight: 1.6 }}>
                    {description}
                </Paragraph>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate(targetUrl)}
                    style={{ borderRadius: 8, height: 44, padding: "0 28px", fontWeight: 500 }}
                >
                    {buttonText}
                </Button>
            </Card>
        </div>
    );
}
