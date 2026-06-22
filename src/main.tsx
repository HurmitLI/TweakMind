import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AppInfo } from "./core/app/AppInfo";
import { SettingsProvider } from "./core/settings/SettingsProvider";
import "./styles/globals.css";

document.title = AppInfo.windowTitle;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </React.StrictMode>
);
