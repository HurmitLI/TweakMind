import { useNavigate } from "react-router-dom";
import { OnboardingService } from "../core/onboarding/OnboardingService";

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Settings</p>
        <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Preferences</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Manage basic TweakMind preferences for this device.</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">Onboarding</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Show the first-run welcome flow again if you want a quick refresher on the TweakMind workflow.
        </p>
        <button
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          onClick={() => {
            OnboardingService.reset();
            navigate("/onboarding");
          }}
          type="button"
        >
          Show onboarding again
        </button>
      </section>
    </div>
  );
}
