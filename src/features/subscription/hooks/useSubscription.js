import { useSubscriptionContext } from "../context/SubscriptionContext";

/**
 * Custom hook to get subscription details and checking features.
 * Features:
 * - subscription: current subscription object
 * - features: features flags object (maxBranches, maxStaff, analyticsAdvanced, aiFeatures)
 * - loading: loading active subscription details
 * - isPro: is currently on PRO plan
 * - isEnterprise: is currently on ENTERPRISE plan
 * - refetchSubscription: triggers reload of active plan
 * - openLimitModal: function(message) to open resource limit exceeded modal
 * - checkout: function(plan, billingCycle) to upgrade via Stripe
 * - openPortal: function() to open Stripe billing customer portal
 */
export const useSubscription = () => {
    return useSubscriptionContext();
};
