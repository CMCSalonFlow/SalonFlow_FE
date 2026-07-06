import {
    Layout
} from "antd";

import {
    Outlet
} from "react-router-dom";

import CustomerHeader
from "./CustomerHeader";

import CustomerFooter
from "./CustomerFooter";

const {
    Content
} = Layout;

export default function CustomerLayout() {

    return (

        <Layout
            style={{
                minHeight:
                    "100vh"
            }}
        >

            <CustomerHeader />

            <Content
                style={{
                    padding: "24px",
                    background: "#f5f5f5"
                }}
            >
                <div
                    style={{
                        maxWidth: 1300,
                        margin: "0 auto"
                    }}
                >
                    <Outlet />
                </div>
            </Content>

            <CustomerFooter />

        </Layout>
    );
}