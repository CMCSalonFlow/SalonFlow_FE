import { Outlet }
from "react-router-dom";

import AdminSidebar
from "./AdminSidebar";

import AdminHeader
from "./AdminHeader";

export default function AdminLayout() {

    return (

        <div
            style={{
                display: "flex"
            }}
        >

            <AdminSidebar />

            <div
                style={{
                    flex: 1
                }}
            >

                <AdminHeader />

                <div
                    style={{
                        padding: "20px"
                    }}
                >
                    <Outlet />
                </div>

            </div>

        </div>
    );
}