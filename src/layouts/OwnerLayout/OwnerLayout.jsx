import {
    Layout,
    Grid,
    Drawer,
    Button
} from "antd";

import {
    Outlet,
    useNavigate
} from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useBranch } from "@/features/branch/hooks/useBranch";
import { MenuOutlined } from "@ant-design/icons";

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
    const navigate = useNavigate();
    const { getMyBranches } = useBranch();
    const screens = Grid.useBreakpoint();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem("owner-sidebar-collapsed");
        return saved === "true";
    });
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem("owner-sidebar-width");
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
                localStorage.setItem("owner-sidebar-width", String(newWidth));
            }
        }
    }, [isResizing]);

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
                    className="owner-sidebar-container"
                    style={{
                        position: "relative",
                        transition: isResizing ? "none" : "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                >
                    <div
                        style={{
                            height: 68,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: collapsed ? "0 8px" : "0 16px 0 20px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                            transition: "all 0.3s",
                            overflow: "hidden"
                        }}
                    >
                        {!collapsed ? (
                            <div
                                onClick={() => navigate("/owner")}
                                style={{
                                    cursor: "pointer",
                                    userSelect: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10
                                }}
                                title="Về Dashboard"
                            >
                                <div style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
                                    fontSize: 18
                                }}>
                                    ✂️
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: 17,
                                        fontWeight: 800,
                                        background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        letterSpacing: "-0.3px",
                                        lineHeight: 1.2
                                    }}>
                                        SalonFlow
                                    </div>
                                    <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
                                        Owner Portal
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => navigate("/owner")}
                                style={{
                                    cursor: "pointer",
                                    margin: "0 auto",
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18
                                }}
                                title="SalonFlow"
                            >
                                ✂️
                            </div>
                        )}

                        <Button
                            type="text"
                            icon={<MenuOutlined style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }} />}
                            onClick={() => handleCollapse(!collapsed)}
                            style={{
                                color: "#fff",
                                padding: 0,
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.06)"
                            }}
                            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                        />
                    </div>

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
                                backgroundColor: isResizing ? "#6366f1" : "transparent",
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#6366f1" }}
                            onMouseLeave={(e) => { if (!isResizing) e.currentTarget.style.backgroundColor = "transparent" }}
                        />
                    )}
                </Sider>
            ) : (
                <Drawer
                    placement="left"
                    closable={false}
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    styles={{ body: { padding: 0, backgroundColor: "#0f172a" } }}
                    width={260}
                    className="owner-sidebar-container"
                >
                    <div
                        style={{
                            height: 68,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 20px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
                        }}
                    >
                        <div
                            onClick={() => {
                                navigate("/owner");
                                setDrawerVisible(false);
                            }}
                            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                        >
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18
                            }}>
                                ✂️
                            </div>
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>SalonFlow</div>
                                <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 600 }}>Owner Portal</div>
                            </div>
                        </div>
                        <Button
                            type="text"
                            icon={<MenuOutlined style={{ fontSize: 16, color: "#fff" }} />}
                            onClick={() => setDrawerVisible(false)}
                            style={{ color: "#fff" }}
                        />
                    </div>
                    <OwnerSidebar onMenuClick={() => setDrawerVisible(false)} />
                </Drawer>
            )}

            <Layout>
                <Header
                    className="owner-header-glass"
                    style={{
                        padding: 0,
                        zIndex: 10,
                        position: "sticky",
                        top: 0
                    }}
                >
                    <OwnerHeader showMobileToggle={!screens.lg} onToggleMobileMenu={() => setDrawerVisible(true)} />
                </Header>

                <Content
                    style={{
                        padding: screens.lg ? "24px 28px" : "16px 12px",
                        background: "#f8fafc",
                        minHeight: "calc(100vh - 68px)"
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}