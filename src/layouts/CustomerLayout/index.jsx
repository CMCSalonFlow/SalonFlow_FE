import { Outlet } from "react-router-dom";

export function CustomerLayout() {
    return (
        <div className="customer-layout">
            <Outlet />
        </div>
    );
}
