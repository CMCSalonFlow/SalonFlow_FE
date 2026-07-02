import React from "react";
import ReactDOM from "react-dom/client";

import {
    RouterProvider,
} from "react-router-dom";
import "antd/dist/reset.css";
import router from "./app/router";
import { setupGlobalAuthListener } from "./core/utils/auth";

setupGlobalAuthListener();

ReactDOM
    .createRoot(
        document.getElementById("root")
    )
    .render(

        <React.StrictMode>

            <RouterProvider
                router={router}
            />

        </React.StrictMode>
    );