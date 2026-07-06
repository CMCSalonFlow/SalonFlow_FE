import {
    Layout
} from "antd";

import { Outlet }
from "react-router-dom";

import AdminSidebar
from "./AdminSidebar";

import AdminHeader
from "./AdminHeader";

const {
    Sider,
    Header,
    Content
} = Layout;

export default function AdminLayout() {

    return (

        <Layout
            style={{
                minHeight: "100vh"
            }}
        >

            <Sider
                width={250}
            >

                <div
                    style={{
                        height: 64,
                        color: "#fff",
                        display: "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        fontSize: 20,
                        fontWeight: 600
                    }}
                >
                    SalonFlow
                </div>

                <AdminSidebar />

            </Sider>

            <Layout>

                <Header
                    style={{
                        padding: 0,
                        background:
                            "#fff"
                    }}
                >
                    <AdminHeader />
                </Header>

                <Content
                    style={{
                        margin: 24,
                        padding: 24,
                        background:
                            "#fff",
                        borderRadius: 12
                    }}
                >

                    <Outlet />

                </Content>

            </Layout>

        </Layout>
    );
}