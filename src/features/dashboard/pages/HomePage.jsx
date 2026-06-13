import { useEffect, useState } from "react";
import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";
import ROLES from "@/core/constants/roles";

export function HomePage() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        api.get(ENDPOINTS.test)
            .then((response) => {
                setMessage(response.data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    return (
        <main className="home-page">
            <h1>Welcome to my Salon</h1>
            <p>{message}</p>
            <p>{ROLES.ADMIN}</p>
        </main>
    );
}
