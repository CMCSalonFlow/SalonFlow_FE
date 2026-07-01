export function attachInterceptors(api) {

    api.interceptors.request.use(
        (config) => {

            const token =
                localStorage.getItem(
                    "accessToken"
                );

            const branchId =
                localStorage.getItem(
                    "currentBranchId"
                );

            if (token) {

                config.headers.Authorization =
                    `Bearer ${token}`;
            }

            if (branchId) {

                config.headers[
                    "X-Branch-Id"
                ] = branchId;
            }

            return config;
        },
        (error) =>
            Promise.reject(error)
    );

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                const errorInfo = {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    data: error.response?.data,
                    timestamp: new Date().toISOString()
                };
                sessionStorage.setItem("lastAuthError", JSON.stringify(errorInfo));
                
                localStorage.clear();
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
            return Promise.reject(error);
        }
    );
}