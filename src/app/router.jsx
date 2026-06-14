import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { HomePage } from "@/features/dashboard/pages/HomePage";
import { authRoutes } from "@/features/auth/routes/router";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },

            ...authRoutes,
        ],
    },
]); 