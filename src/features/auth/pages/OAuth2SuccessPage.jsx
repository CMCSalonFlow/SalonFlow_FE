import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2SuccessPage() {

    const navigate = useNavigate();

    useEffect(() => {

        const params =
            new URLSearchParams(
                window.location.search
            );

        localStorage.setItem(
            "userId",
            params.get("userId")
        );

        localStorage.setItem(
            "username",
            params.get("username")
        );

        localStorage.setItem(
            "email",
            params.get("email")
        );

        localStorage.setItem(
            "accessToken",
            params.get("accessToken")
        );

        localStorage.setItem(
            "refreshToken",
            params.get("refreshToken")
        );

        localStorage.setItem(
            "roles",
            JSON.stringify(
                params.get("roles")
                    ?.split(",")
            )
        );

        navigate("/");
    }, [navigate]);

    return (
        <h2>
            Đang đăng nhập...
        </h2>
    );
}