import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-slate-50 text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
