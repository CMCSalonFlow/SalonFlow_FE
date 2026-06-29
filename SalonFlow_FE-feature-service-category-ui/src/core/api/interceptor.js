export function attachInterceptors(api) {

    api.interceptors.request.use(
        (config) => {

            const token =
                localStorage.getItem("accessToken");

            if (token) {
                config.headers.Authorization =
                    `Bearer ${token}`;
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
        (response) => response,
        (error) => Promise.reject(error)
    );
}