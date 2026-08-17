import React from "react";
import ReactDOM from "react-dom/client";

import {
    RouterProvider,
} from "react-router-dom";
import "antd/dist/reset.css";
import router from "./app/router";
import { setupGlobalAuthListener } from "./core/utils/auth";
import OfflineIndicator from "@/shared/components/OfflineIndicator";
import { initSentry } from "./core/monitoring/sentry";
import CustomErrorBoundary from "./shared/components/CustomErrorBoundary";

// Khởi tạo Sentry Error Tracking cho Frontend
initSentry();

setupGlobalAuthListener();

ReactDOM
    .createRoot(
        document.getElementById("root")
    )
    .render(

        <React.StrictMode>
            <CustomErrorBoundary>
                <OfflineIndicator />
                <RouterProvider
                    router={router}
                />
            </CustomErrorBoundary>
        </React.StrictMode>
    );
