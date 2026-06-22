import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#1a2332] text-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
