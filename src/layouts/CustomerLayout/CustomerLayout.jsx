import { Layout, Grid } from "antd";
import { Outlet } from "react-router-dom";
import CustomerHeader from "./CustomerHeader";
import CustomerFooter from "./CustomerFooter";
import AutoReviewPrompt from "@/features/review/components/AutoReviewPrompt";

const { Content } = Layout;

export default function CustomerLayout() {
    const screens = Grid.useBreakpoint();
    const paddingVal = screens.sm ? "24px" : "12px 8px";

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <CustomerHeader />

            <Content style={{ padding: paddingVal, background: "#f5f5f5" }}>
                <div style={{ maxWidth: 1300, margin: "0 auto" }}>
                    <Outlet />
                </div>
            </Content>

            <CustomerFooter />
            <AutoReviewPrompt />
        </Layout>
    );
}