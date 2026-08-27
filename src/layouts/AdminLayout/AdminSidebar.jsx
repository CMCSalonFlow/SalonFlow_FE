import {
    ShopOutlined,
    CreditCardOutlined,
    CustomerServiceOutlined,
    UserOutlined,
    TeamOutlined,
    MessageOutlined,
    SettingOutlined
} from "@ant-design/icons";
import { Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminSidebar({ onMenuClick }) {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        {
            key: "/admin/salons",
            icon: <ShopOutlined />,
            label: "Duyệt & Quản Lý Salon"
        },
        {
            key: "/admin/subscriptions",
            icon: <CreditCardOutlined />,
            label: "Thống Kê & Đăng Ký Gói"
        },
        {
            key: "/admin/subscription-plans",
            icon: <SettingOutlined />,
            label: "Cấu Hình Bảng Giá Gói"
        },
        {
            key: "/admin/tickets",
            icon: <CustomerServiceOutlined />,
            label: "Hỗ Trợ Kỹ Thuật (SLA)"
        },
        {
            key: "/admin/users",
            icon: <UserOutlined />,
            label: "Quản Lý Người Dùng"
        },
        {
            key: "/admin/roles",
            icon: <TeamOutlined />,
            label: "Phân Quyền Vai Trò"
        },
        {
            key: "/admin/review-reports",
            icon: <MessageOutlined />,
            label: "Báo Cáo Vi Phạm"
        }
    ];

    const selectedKey = items.find(item => location.pathname.startsWith(item.key))?.key || "/admin/salons";

    return (
        <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={items}
            onClick={(e) => {
                navigate(e.key);
                if (onMenuClick) onMenuClick();
            }}
            style={{ height: "100%" }}
        />
    );
}
