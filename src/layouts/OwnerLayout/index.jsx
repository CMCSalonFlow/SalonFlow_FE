import { Outlet } from "react-router-dom";

export function OwnerLayout() {
    return (
        <div className="owner-layout">
            <Outlet />
        </div>
    );
}
