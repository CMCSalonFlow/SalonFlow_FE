import {
    Layout,
    Grid,
    Drawer,
    Button
} from "antd";

import { Outlet }
from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined, MenuOutlined } from "@ant-design/icons";

import AdminSidebar
from "./AdminSidebar";

import AdminHeader
from "./AdminHeader";

import BrandLogo from "@/core/components/BrandLogo";

const {
    Sider,
    Header,
    Content
} = Layout;

export default function AdminLayout() {
    const screens = Grid.useBreakpoint();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem("admin-sidebar-collapsed");
        return saved === "true";
    });
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem("admin-sidebar-width");
        return saved ? parseInt(saved, 10) : 250;
    });
    const [isResizing, setIsResizing] = useState(false);

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
                localStorage.setItem("admin-sidebar-width", String(newWidth));
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
        localStorage.setItem("admin-sidebar-collapsed", String(val));
    };

    return (
        <Layout
            style={{
                minHeight: "100vh"
            }}
        >
            {screens.lg ? (
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
                    <div
                        style={{
                            height: 68,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: collapsed ? "0 8px" : "0 16px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                            transition: "all 0.3s",
                            overflow: "hidden"
                        }}
                    >
                        <BrandLogo collapsed={collapsed} subtitle="ADMIN PORTAL" theme="dark" size="small" />
                    </div>

                    <AdminSidebar />

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
            ) : (
                <Drawer
                    placement="left"
                    closable={false}
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    styles={{ body: { padding: 0, backgroundColor: "#001529" } }}
                    width={250}
                >
                    <div
                        style={{
                            height: 68,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 16px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
                        }}
                    >
                        <BrandLogo collapsed={false} subtitle="ADMIN PORTAL" theme="dark" size="small" />
                    </div>
                    <AdminSidebar onMenuClick={() => setDrawerVisible(false)} />
                </Drawer>
            )}

            <Layout>
                <Header
                    style={{
                        padding: 0,
                        background: "#fff",
                        zIndex: 1,
                        boxShadow: "0 1px 4px rgba(0, 21, 41, 0.08)"
                    }}
                >
                    <AdminHeader showMobileToggle={!screens.lg} onToggleMobileMenu={() => setDrawerVisible(true)} />
                </Header>

                <Content
                    style={{
                        margin: screens.lg ? 24 : 12,
                        padding: screens.lg ? 24 : 12,
                        background: "#fff",
                        borderRadius: 12
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}