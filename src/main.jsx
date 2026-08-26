import React from "react";
import ReactDOM from "react-dom/client";

import {
    RouterProvider,
} from "react-router-dom";
import "antd/dist/reset.css";
import "./styles/index.css";
import router from "./app/router";
import { setupGlobalAuthListener } from "./core/utils/auth";
import OfflineIndicator from "@/shared/components/OfflineIndicator";
import CustomErrorBoundary from "./shared/components/CustomErrorBoundary";

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
