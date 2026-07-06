import {
    Layout
} from "antd";

import {
    Outlet
} from "react-router-dom";
import { useEffect } from "react";
import { useBranch } from "@/features/branch/hooks/useBranch";

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
    const { getMyBranches } = useBranch();

    useEffect(() => {
        const initBranch = async () => {
            const currentBranchId = localStorage.getItem("currentBranchId");
            try {
                const data = await getMyBranches();
                if (data && data.length > 0) {
                    const hasSelected = data.some(b => b.id === Number(currentBranchId));
                    if (!currentBranchId || !hasSelected) {
                        localStorage.setItem("currentBranchId", data[0].id);
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error("Failed to load branches for context", error);
            }
        };
        initBranch();
    }, []);

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