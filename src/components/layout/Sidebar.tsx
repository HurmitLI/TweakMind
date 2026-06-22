import { BookOpen, History, Home, Info, ScanLine, Settings, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { AppInfo } from "../../core/app/AppInfo";
import { useTranslation } from "../../core/localization/LanguageProvider";

const navItems = [
  { to: "/dashboard", labelKey: "sidebar.nav.home" as const, icon: Home },
  { to: "/scan", labelKey: "sidebar.nav.analyze" as const, icon: ScanLine },
  { to: "/knowledge", labelKey: "sidebar.nav.knowledge" as const, icon: BookOpen },
  { to: "/history", labelKey: "sidebar.nav.history" as const, icon: History },
  { to: "/settings", labelKey: "sidebar.nav.settings" as const, icon: Settings }
];

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{AppInfo.name}</h1>
          <p className="text-sm text-slate-400">{t("app.tagline")}</p>
        </div>
      </div>

      <nav className="grid gap-1" aria-label={t("sidebar.aria.primaryNavigation")}>
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                ].join(" ")
              }
              key={item.to}
              to={item.to}
            >
              <Icon size={18} aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-5">
        <NavLink
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-slate-100 text-slate-950"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            ].join(" ")
          }
          to="/about"
        >
          <Info size={18} aria-hidden="true" />
          {t("sidebar.nav.about")}
        </NavLink>
        <p className="mt-3 px-3 text-xs text-slate-500">
          {AppInfo.name} {t("app.versionLabel", { version: AppInfo.version })}
        </p>
      </div>
    </aside>
  );
}
