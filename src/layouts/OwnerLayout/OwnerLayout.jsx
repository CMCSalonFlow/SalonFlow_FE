import {
    Layout
} from "antd";

import {
    Outlet
} from "react-router-dom";

import OwnerHeader
from "./OwnerHeader";

import OwnerSidebar
from "./OwnerSidebar";

const {
    Header,
    Sider,
    Content
} = Layout;

export default function OwnerLayout() {

    return (
        <Layout
            style={{
                minHeight:
                    "100vh"
            }}
        >
            <Sider
                width={240}
            >
                <OwnerSidebar />
            </Sider>

            <Layout>

                <Header
                    style={{
                        padding: 0,
                        background:
                            "#fff"
                    }}
                >
                    <OwnerHeader />
                </Header>

                <Content
                    style={{
                        padding: 24,
                        background:
                            "#f5f5f5"
                    }}
                >
                    <Outlet />
                </Content>

            </Layout>
        </Layout>
    );
}