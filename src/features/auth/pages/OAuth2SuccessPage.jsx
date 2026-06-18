import { useEffect } from "react";

export default function OAuth2SuccessPage() {

    useEffect(() => {

        const params = new URLSearchParams(
            window.location.search
        );

        const roles =
            params.get("roles")
                ?.split(",") || [];

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
            JSON.stringify(roles)
        );

        console.log("===== OAUTH SUCCESS =====");

        console.log(
            "userId:",
            localStorage.getItem("userId")
        );

        console.log(
            "username:",
            localStorage.getItem("username")
        );

        console.log(
            "email:",
            localStorage.getItem("email")
        );

        console.log(
            "accessToken:",
            localStorage.getItem("accessToken")
        );

        console.log(
            "refreshToken:",
            localStorage.getItem("refreshToken")
        );

        console.log(
            "roles:",
            localStorage.getItem("roles")
        );

    }, []);

    return (
        <div>
            <h2>OAuth Login Success</h2>

            <p>
                Kiểm tra Console (F12)
            </p>

            <p>
                Kiểm tra Application →
                Local Storage
            </p>
        </div>
    );
}