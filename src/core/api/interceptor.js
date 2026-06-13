export function attachInterceptors(api) {
    api.interceptors.response.use(
        (response) => response,
        (error) => Promise.reject(error),
    );
}
