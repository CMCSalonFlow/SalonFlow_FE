/**
 * Asynchronously loads the Google Maps JavaScript SDK.
 * Uses a singleton promise to ensure the script tag is inserted only once.
 */

let googleMapsPromise = null;

export const loadGoogleMaps = (apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "") => {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Window is undefined"));
    }

    // Already loaded
    if (window.google && window.google.maps) {
        return Promise.resolve(window.google.maps);
    }

    if (googleMapsPromise) {
        return googleMapsPromise;
    }

    googleMapsPromise = new Promise((resolve, reject) => {
        const callbackName = `__initGoogleMaps_${Date.now()}`;
        window[callbackName] = () => {
            delete window[callbackName];
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
            } else {
                reject(new Error("Google Maps SDK failed to initialize"));
            }
        };

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.defer = true;

        const keyParam = apiKey ? `key=${apiKey}&` : "";
        script.src = `https://maps.googleapis.com/maps/api/js?${keyParam}libraries=places,geometry&callback=${callbackName}&loading=async`;

        script.onerror = (err) => {
            delete window[callbackName];
            googleMapsPromise = null;
            reject(new Error(`Lỗi tải Google Maps SDK: ${err?.message || "Không thể kết nối tới máy chủ Google Maps"}`));
        };

        document.head.appendChild(script);
    });

    return googleMapsPromise;
};
