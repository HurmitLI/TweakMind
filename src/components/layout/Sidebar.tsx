import { BookOpen, History, Home, Info, ScanLine, Settings, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { AppInfo } from "../../core/app/AppInfo";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/scan", label: "Analyze", icon: ScanLine },
  { to: "/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{AppInfo.name}</h1>
          <p className="text-sm text-slate-400">{AppInfo.tagline}</p>
        </div>
      </div>

      <nav className="grid gap-1" aria-label="Primary navigation">
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
              {item.label}
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
          About
        </NavLink>
        <p className="mt-3 px-3 text-xs text-slate-500">
          {AppInfo.name} {AppInfo.versionLabel}
        </p>
      </div>
    </aside>
  );
}
