import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LoadingState } from "../common/LoadingState";
import { useTranslation } from "../../core/localization/LanguageProvider";
import { OnboardingService } from "../../core/onboarding/OnboardingService";

export function OnboardingGate() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!OnboardingService.isComplete()) {
      navigate("/onboarding", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  if (!OnboardingService.isComplete()) {
    return (
      <LoadingState
        description={t("onboardingGate.loading.description")}
        layout="centered"
        title={t("onboardingGate.loading.title")}
      />
    );
  }

  return <Outlet />;
}
