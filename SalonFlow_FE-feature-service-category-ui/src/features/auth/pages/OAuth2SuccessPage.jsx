import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2SuccessPage() {

    const navigate = useNavigate();

    useEffect(() => {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const userId =
        params.get("userId");

    if (!userId) {
        return;
    }

    const authData = {
        userId,
        username:
            params.get("username"),
        email:
            params.get("email"),
        accessToken:
            params.get("accessToken"),
        refreshToken:
            params.get("refreshToken"),
        roles:
            params.get("roles")
                ?.split(",") || []
    };

    console.log(
        "Saving auth:",
        authData
    );

    localStorage.setItem(
        "auth",
        JSON.stringify(authData)
    );

    navigate(
        "/home",
        { replace: true }
    );

}, [navigate]);

    return <div>Loading...</div>;
}