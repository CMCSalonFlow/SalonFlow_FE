import {
    Layout
} from "antd";

import {
    Outlet
} from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useBranch } from "@/features/branch/hooks/useBranch";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

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
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem("owner-sidebar-collapsed");
        return saved === "true";
    });
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem("owner-sidebar-width");
        return saved ? parseInt(saved, 10) : 240;
    });
    const [isResizing, setIsResizing] = useState(false);

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

    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth >= 180 && newWidth <= 480) {
                setWidth(newWidth);
                localStorage.setItem("owner-sidebar-width", String(newWidth));
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    const handleCollapse = (val) => {
        setCollapsed(val);
        localStorage.setItem("owner-sidebar-collapsed", String(val));
    };

    return (
        <Layout
            style={{
                minHeight:
                    "100vh"
            }}
        >
            <Sider
                width={width}
                collapsible
                collapsed={collapsed}
                trigger={null}
                collapsedWidth={80}
                style={{
                    position: "relative",
                    transition: isResizing ? "none" : "width 0.2s, min-width 0.2s, max-width 0.2s",
                }}
            >
                <OwnerSidebar />

                {/* Drag handle */}
                {!collapsed && (
                    <div
                        onMouseDown={startResizing}
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "6px",
                            height: "100%",
                            cursor: "col-resize",
                            zIndex: 100,
                            backgroundColor: isResizing ? "#1890ff" : "transparent",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1890ff" }}
                        onMouseLeave={(e) => { if (!isResizing) e.currentTarget.style.backgroundColor = "transparent" }}
                    />
                )}

                {/* Floating Collapse Trigger */}
                <div
                    onClick={() => handleCollapse(!collapsed)}
                    style={{
                        position: "absolute",
                        top: 20,
                        right: -12,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "#fff",
                        border: "1px solid #d9d9d9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 101,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        transition: "all 0.3s",
                    }}
                >
                    {collapsed ? (
                        <MenuUnfoldOutlined style={{ fontSize: 12, color: "#1890ff" }} />
                    ) : (
                        <MenuFoldOutlined style={{ fontSize: 12, color: "#1890ff" }} />
                    )}
                </div>
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