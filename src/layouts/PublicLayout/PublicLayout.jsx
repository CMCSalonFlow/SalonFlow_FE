import { Layout } from "antd";

import { Outlet } from "react-router-dom";

import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

const { Content } = Layout;

export default function PublicLayout() {

    return (

        <Layout
            style={{
                minHeight: "100vh"
            }}
        >

            <PublicHeader />

            <Content
                style={{
                    padding: "24px 80px"
                }}
            >
                <Outlet />
            </Content>

            <PublicFooter />

        </Layout>

    );

}