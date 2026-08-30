import { API_BASE_URL } from "@/core/api/endpoints";

/**
 * Resolves an absolute WebSocket URL.
 * Handles both absolute and relative API_BASE_URL.
 * 
 * @param {string} path The API WebSocket path (e.g. "/ws/bookings").
 * @returns {string} The fully qualified WebSocket URL starting with ws:// or wss://.
 */
export const getWebSocketUrl = (path) => {
    let wsBase = "";
    if (API_BASE_URL && API_BASE_URL.startsWith("http")) {
        wsBase = API_BASE_URL.replace(/^http/, "ws");
    } else {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        // If API_BASE_URL is relative (e.g. "/api"), resolve it
        const base = API_BASE_URL ? (API_BASE_URL.startsWith("/") ? API_BASE_URL : `/${API_BASE_URL}`) : "";
        const cleanBase = base === "/" ? "" : base;
        wsBase = `${protocol}//${host}${cleanBase}`;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${wsBase}${cleanPath}`;
};
