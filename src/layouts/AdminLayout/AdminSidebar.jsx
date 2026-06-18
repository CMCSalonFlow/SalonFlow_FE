import {
    NavLink
}
from "react-router-dom";

export default function AdminSidebar() {

    return (
        <aside
            style={{
                width: "250px",
                borderRight:
                    "1px solid #ddd",
                minHeight: "100vh",
                padding: "20px"
            }}
        >
            <h2>
                SalonFlow
            </h2>

            <nav>

                <ul>

                    <li>
                        <NavLink
                            to="/admin"
                        >
                            Dashboard
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/admin/users"
                        >
                            Users
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/admin/roles"
                        >
                            Roles
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/admin/branches"
                        >
                            Branches
                        </NavLink>
                    </li>

                </ul>

            </nav>

        </aside>
    );
}