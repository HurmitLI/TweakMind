import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { OnboardingGate } from "../components/onboarding/OnboardingGate";
import { AboutPage } from "../pages/AboutPage";
import { ApplyConfirmationPage } from "../pages/ApplyConfirmationPage";
import { ApplyPage } from "../pages/ApplyPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DecisionPage } from "../pages/DecisionPage";
import { KnowledgeDetailPage } from "../pages/KnowledgeDetailPage";
import { HistoryPage } from "../pages/HistoryPage";
import { KnowledgePage } from "../pages/KnowledgePage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { ReportPage } from "../pages/ReportPage";
import { RecoveryConfirmationPage } from "../pages/RecoveryConfirmationPage";
import { RecoveryPage } from "../pages/RecoveryPage";
import { ScanPage } from "../pages/ScanPage";
import { SettingsPage } from "../pages/SettingsPage";
import { VerificationPage } from "../pages/VerificationPage";

export const router = createBrowserRouter([
  {
    path: "/onboarding",
    element: <OnboardingPage />
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        element: <OnboardingGate />,
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
            path: "knowledge/detail",
            element: <KnowledgeDetailPage />
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
          },
          {
            path: "about",
            element: <AboutPage />
          }
        ]
      }
    ]
  }
]);
