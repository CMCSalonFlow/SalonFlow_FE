import axios from "axios";
import { API_BASE_URL } from "@/core/api/endpoints";
import { attachInterceptors } from "@/core/api/interceptor";

const api = axios.create({
    baseURL: API_BASE_URL,
});

attachInterceptors(api);

export default api;
