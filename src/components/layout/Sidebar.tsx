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
    <aside className="tm-sidebar flex w-72 shrink-0 flex-col border-r border-slate-700/60 px-6 py-7 shadow-2xl shadow-slate-950/30">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/25">
          <Sparkles size={26} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="tm-sidebar-brand tm-typo-body-emphasis">{AppInfo.name}</h1>
          <p className="tm-mt-md tm-typo-caption">{t("app.tagline")}</p>
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
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
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

      <div className="mt-auto border-t border-slate-700/60 pt-5">
        <NavLink
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
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
