import { Modal, ConfigProvider } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import ManagerCheckoutPage from "../pages/ManagerCheckoutPage";

export default function ManagerCheckoutModal({ open, onCancel, booking, onSuccess }) {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorBgElevated: "#111827",
                    colorBgContainer: "#111827",
                    colorBgLayout: "#111827"
                },
                components: {
                    Modal: {
                        colorBgElevated: "#111827",
                        contentBg: "#111827",
                        headerBg: "#111827",
                        footerBg: "#111827",
                        titleColor: "#ffffff",
                        paddingContentHorizontal: 0,
                        paddingMD: 0,
                        borderRadiusLG: 16
                    },
                    Button: {
                        shadow: "none",
                        primaryShadow: "none"
                    }
                }
            }}
        >
            <style>{`
                .ant-modal-wrap {
                    width: 100% !important;
                    left: 0 !important;
                    right: 0 !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                }
                .ant-modal.dark-checkout-modal {
                    width: 92vw !important;
                    max-width: 1650px !important;
                    margin: 0 auto !important;
                }
                .dark-checkout-modal,
                .dark-checkout-modal * {
                    --ant-color-bg-elevated: #111827 !important;
                    --ant-color-bg-container: #111827 !important;
                }
                .dark-checkout-modal .ant-modal-content,
                .ant-modal-wrap .dark-checkout-modal .ant-modal-content,
                .ant-modal.dark-checkout-modal .ant-modal-content {
                    background-color: #111827 !important;
                    background: #111827 !important;
                    padding: 0 !important;
                    border-radius: 16px !important;
                    border: 1px solid #374151 !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85) !important;
                    overflow: hidden !important;
                }
                .dark-checkout-modal .ant-modal-body {
                    background-color: #111827 !important;
                    background: #111827 !important;
                    padding: 0 !important;
                    border-radius: 16px !important;
                }
                .dark-checkout-modal .ant-modal-header {
                    background-color: #111827 !important;
                    border-bottom: none !important;
                }
                .dark-checkout-modal .ant-modal-close {
                    color: #9ca3af !important;
                    top: 18px !important;
                    right: 20px !important;
                }
                .dark-checkout-modal .ant-modal-close:hover {
                    color: #ffffff !important;
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                .dark-checkout-modal .ant-btn,
                .dark-checkout-modal .ant-btn-primary,
                .dark-checkout-modal .ant-btn-default {
                    box-shadow: none !important;
                }
                .dark-checkout-modal .ant-btn::after,
                .dark-checkout-modal .ant-btn-primary::after {
                    display: none !important;
                }
                .dark-checkout-modal .ant-input-group-wrapper,
                .dark-checkout-modal .ant-space-compact {
                    box-shadow: none !important;
                }
            `}</style>

            <Modal
                open={open}
                onCancel={onCancel}
                footer={null}
                width="92vw"
                centered
                destroyOnClose
                className="dark-checkout-modal"
                rootClassName="dark-checkout-modal"
                style={{ maxWidth: 1650, margin: "0 auto" }}
                closeIcon={<CloseOutlined style={{ fontSize: 20 }} />}
            >
                <ManagerCheckoutPage
                    initialBooking={booking}
                    isModalMode={true}
                    onCloseModal={(success) => {
                        if (success && onSuccess) onSuccess();
                        onCancel();
                    }}
                />
            </Modal>
        </ConfigProvider>
    );
}
