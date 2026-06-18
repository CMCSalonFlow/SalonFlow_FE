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
                    padding:
                        "24px 50px"
                }}
            >
                <Outlet />
            </Content>

            <CustomerFooter />

        </Layout>
    );
}