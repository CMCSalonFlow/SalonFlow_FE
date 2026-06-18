import {
    logout
}
from "@/core/utils/auth";

export default function AdminHeader() {

    const username =
        localStorage.getItem(
            "username"
        );

    return (
        <header
            style={{
                display: "flex",
                justifyContent:
                    "space-between",
                alignItems:
                    "center",
                padding: "20px",
                borderBottom:
                    "1px solid #ddd"
            }}
        >
            <div>
                Welcome {username}
            </div>

            <button
                onClick={logout}
            >
                Logout
            </button>

        </header>
    );
}