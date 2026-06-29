import { useState, useEffect } from "react";

export default function CategoryListUserPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await fetch(
                    "http://localhost:9090/api/v1/categories/public"
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                setCategories(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const handleCategoryClick = (category) => {
        console.log("Danh mục được chọn:", category);
        alert(`Bạn đã chọn danh mục: ${category.name}`);
        // Sau này thay alert bằng navigate:
        // navigate(`/services?categoryId=${category.id}`);
    };

    if (loading) {
        return (
            <div style={{
                padding: "48px 0",
                textAlign: "center",
                fontSize: "20px",
                color: "#666"
            }}>
                Đang tải danh mục dịch vụ...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: "48px 0",
                textAlign: "center",
                fontSize: "18px",
                color: "#ef4444"
            }}>
                Lỗi: {error}
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "40px 24px"
        }}>
            <h1 style={{
                fontSize: "36px",
                fontWeight: "700",
                textAlign: "center",
                marginBottom: "48px",
                color: "#1f2937"
            }}>
                Dịch vụ của chúng tôi
            </h1>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "32px",
                justifyItems: "center"
            }}>
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        style={{
                            backgroundColor: "white",
                            borderRadius: "24px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            border: "1px solid #e5e7eb",
                            padding: "32px 24px",
                            textAlign: "center",
                            cursor: "pointer",
                            width: "100%",
                            maxWidth: "320px",
                            transition: "all 0.3s ease",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-8px)";
                            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1)";
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = "scale(0.95)";
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = "translateY(-8px)";
                        }}
                    >
                        {/* Icon */}
                        <div
                            style={{
                                width: "110px",
                                height: "110px",
                                margin: "0 auto 24px",
                                borderRadius: "20px",
                                backgroundColor: (cat.color || "#3b82f6") + "20",
                                color: cat.color || "#3b82f6",
                                fontSize: "55px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {cat.icon || "✂️"}
                        </div>

                        {/* Tên danh mục */}
                        <h3 style={{
                            fontSize: "22px",
                            fontWeight: "600",
                            marginBottom: "12px",
                            color: "#1f2937",
                            textTransform: "capitalize"
                        }}>
                            {cat.name}
                        </h3>

                        {/* Mô tả */}
                        <p style={{
                            color: "#6b7280",
                            fontSize: "15px",
                            lineHeight: "1.5",
                            marginBottom: "24px"
                        }}>
                            {cat.description || "Khám phá các dịch vụ chất lượng cao"}
                        </p>

                        {/* Button */}
                        <button
                            style={{
                                marginTop: "8px",
                                padding: "12px 28px",
                                borderRadius: "12px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                fontSize: "16px",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}
                        >
                            Xem dịch vụ
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}