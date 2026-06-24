import api from "@/core/api/axios";

export const getCategories = async () => {
    const response = await api.get("/api/v1/categories");
    return response.data;
};

export const getCategoryById = async (id) => {
    const response = await api.get(`/api/v1/categories/${id}`);
    return response.data;
};

export const createCategory = async (data) => {
    const response = await api.post("/api/v1/categories", data);
    return response.data;
};

export const updateCategory = async (id, data) => {
    const response = await api.put(`/api/v1/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await api.delete(`/api/v1/categories/${id}`);
    return response.data;
};

// === THÊM MỚI ===
export const updateCategoryOrder = async (orderedIds) => {
    const response = await api.patch("/api/v1/categories/order", { 
        order: orderedIds 
    });
    return response.data;
};
export const uploadMedia = async (file) => {

    const formData = new FormData();

    formData.append("file", file); // ❗ KHÔNG dùng originFileObj nếu đã unwrap

    const res = await api.post("/api/v1/media/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return res.data;
};