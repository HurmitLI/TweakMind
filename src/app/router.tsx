import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ApplyConfirmationPage } from "../pages/ApplyConfirmationPage";
import { ApplyPage } from "../pages/ApplyPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DecisionPage } from "../pages/DecisionPage";
import { HistoryPage } from "../pages/HistoryPage";
import { KnowledgePage } from "../pages/KnowledgePage";
import { ReportPage } from "../pages/ReportPage";
import { RecoveryConfirmationPage } from "../pages/RecoveryConfirmationPage";
import { RecoveryPage } from "../pages/RecoveryPage";
import { ScanPage } from "../pages/ScanPage";
import { SettingsPage } from "../pages/SettingsPage";
import { VerificationPage } from "../pages/VerificationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: "dashboard",
        element: <DashboardPage />
      },
      {
        path: "scan",
        element: <ScanPage />
      },
      {
        path: "knowledge",
        element: <KnowledgePage />
      },
      {
        path: "report",
        element: <ReportPage />
      },
      {
        path: "decision",
        element: <DecisionPage />
      },
      {
        path: "confirm/:optimizationId",
        element: <ApplyConfirmationPage />
      },
      {
        path: "apply",
        element: <ApplyPage />
      },
      {
        path: "verify",
        element: <VerificationPage />
      },
      {
        path: "recover/:historyId",
        element: <RecoveryConfirmationPage />
      },
      {
        path: "recovery",
        element: <RecoveryPage />
      },
      {
        path: "history",
        element: <HistoryPage />
      },
      {
        path: "settings",
        element: <SettingsPage />
      }
    ]
  }
]);
