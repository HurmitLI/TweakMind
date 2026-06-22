import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AppInfo } from "./core/app/AppInfo";
import { LanguageProvider } from "./core/localization/LanguageProvider";
import { SettingsProvider } from "./core/settings/SettingsProvider";
import "./styles/globals.css";

document.title = AppInfo.windowTitle;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </SettingsProvider>
  </React.StrictMode>
);
