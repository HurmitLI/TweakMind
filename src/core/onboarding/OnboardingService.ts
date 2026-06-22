const onboardingCompleteStorageKey = "tweakmind:onboarding-complete";

export class OnboardingService {
  static isComplete(): boolean {
    try {
      return window.localStorage.getItem(onboardingCompleteStorageKey) === "true";
    } catch {
      return false;
    }
  }

  static markComplete(): void {
    window.localStorage.setItem(onboardingCompleteStorageKey, "true");
  }

  static reset(): void {
    window.localStorage.removeItem(onboardingCompleteStorageKey);
  }
}
