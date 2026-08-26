import { Layout, Grid } from "antd";

import { Outlet } from "react-router-dom";

import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

const { Content } = Layout;

export default function PublicLayout() {
    const screens = Grid.useBreakpoint();
    const paddingVal = screens.lg
        ? "24px 80px"
        : screens.sm
        ? "24px 32px"
        : "12px 8px";

    return (
        <Layout
            style={{
                minHeight: "100vh"
            }}
        >
            <PublicHeader />

            <Content
                style={{
                    padding: paddingVal
                }}
            >
                <Outlet />
            </Content>

            <PublicFooter />
        </Layout>
    );
}