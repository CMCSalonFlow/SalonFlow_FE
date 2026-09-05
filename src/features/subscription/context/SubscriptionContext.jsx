import React, { createContext, useContext, useState, useEffect } from "react";
import { message } from "antd";
import { getActiveSubscriptionApi, createStripeCheckoutApi, createCustomerPortalApi, cancelMySubscriptionApi } from "../api/subscriptionApi";
import SubscriptionLimitModal from "../components/SubscriptionLimitModal";
import { hasRole } from "@/core/utils/auth";
import ROLES from "@/core/constants/roles";

const SubscriptionContext = createContext();

const DEFAULT_FEATURES = {
    maxBranches: 1,
    maxStaff: 3,
    analyticsAdvanced: false,
    aiFeatures: false
};

export const SubscriptionProvider = ({ children }) => {
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Resource limit modal state
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState("");

    const fetchActiveSubscription = async () => {
        // Only fetch subscription details for SALON_OWNER or BRANCH_MANAGER
        const isOwner = hasRole("SALON_OWNER");
        const isManager = hasRole("BRANCH_MANAGER");
        
        if (!isOwner && !isManager) {
            return;
        }

        setLoading(true);
        try {
            const data = await getActiveSubscriptionApi();
            setActiveSubscription(data);
        } catch (error) {
            console.error("Lỗi lấy thông tin gói đăng ký:", error);
            // Don't show toast errors on load as this is a background check
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveSubscription();
    }, []);

    const refetchSubscription = async () => {
        await fetchActiveSubscription();
    };

    const openLimitModal = (msg) => {
        setLimitMessage(msg || "Bạn đã vượt quá hạn mức tài nguyên cho gói đăng ký hiện tại.");
        setLimitModalOpen(true);
    };

    const checkout = async (plan, billingCycle) => {
        try {
            message.loading({ content: "Đang tạo phiên thanh toán...", key: "checkout" });
            const successUrl = `${window.location.origin}/owner/subscription/success`;
            const cancelUrl = `${window.location.origin}/owner/subscription/cancel`;
            
            const res = await createStripeCheckoutApi({
                plan,
                billingCycle,
                successUrl,
                cancelUrl
            });

            message.success({ content: "Đang chuyển hướng...", key: "checkout" });
            
            if (res?.url) {
                window.location.href = res.url;
            } else {
                throw new Error("Không lấy được URL thanh toán từ hệ thống!");
            }
        } catch (error) {
            console.error("Stripe Checkout Error:", error);
            message.error({ 
                content: error.response?.data?.message || "Tạo phiên thanh toán thất bại!", 
                key: "checkout" 
            });
        }
    };

    const openPortal = async () => {
        try {
            message.loading({ content: "Đang mở cổng quản lý...", key: "portal" });
            const returnUrl = `${window.location.origin}/owner/subscription`;
            const res = await createCustomerPortalApi(returnUrl);
            
            message.success({ content: "Đang chuyển hướng...", key: "portal" });
            if (res?.url) {
                window.location.href = res.url;
            } else {
                throw new Error("Không lấy được URL cổng thanh toán!");
            }
        } catch (error) {
            console.error("Customer Portal Error:", error);
            message.error({ 
                content: error.response?.data?.message || "Mở cổng quản lý thanh toán thất bại!", 
                key: "portal" 
            });
        }
    };
    const cancelSubscription = async () => {
        try {
            message.loading({ content: "Đang hủy gói dịch vụ...", key: "cancel_sub" });
            const data = await cancelMySubscriptionApi();
            setActiveSubscription(data);
            message.success({ content: "Đã hủy gói dịch vụ thành công! Tài khoản đã về gói FREE.", key: "cancel_sub" });
            return true;
        } catch (error) {
            console.error("Hủy gói dịch vụ lỗi:", error);
            message.error({ 
                content: error.response?.data?.message || "Hủy gói dịch vụ thất bại!", 
                key: "cancel_sub" 
            });
            return false;
        }
    };

    const features = activeSubscription?.features || DEFAULT_FEATURES;
    const isPro = activeSubscription?.plan === "PRO";
    const isEnterprise = activeSubscription?.plan === "ENTERPRISE";

    return (
        <SubscriptionContext.Provider
            value={{
                subscription: activeSubscription,
                features,
                loading,
                isPro,
                isEnterprise,
                refetchSubscription,
                openLimitModal,
                checkout,
                openPortal,
                cancelSubscription
            }}
        >
            {children}
            
            {/* Global Limit warning modal */}
            <SubscriptionLimitModal
                open={limitModalOpen}
                message={limitMessage}
                onClose={() => setLimitModalOpen(false)}
            />
        </SubscriptionContext.Provider>
    );
};

export const useSubscriptionContext = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        return {
            subscription: null,
            features: {
                maxBranches: Infinity,
                maxStaff: Infinity,
                analyticsAdvanced: false,
                aiFeatures: false
            },
            loading: false,
            isPro: false,
            isEnterprise: false,
            refetchSubscription: () => {},
            openLimitModal: () => {},
            checkout: () => {},
            openPortal: () => {}
        };
    }
    return context;
};
