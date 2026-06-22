import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { OnboardingService } from "../../core/onboarding/OnboardingService";

export function OnboardingGate() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!OnboardingService.isComplete()) {
      navigate("/onboarding", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  if (!OnboardingService.isComplete()) {
    return null;
  }

  return <Outlet />;
}
