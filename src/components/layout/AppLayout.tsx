import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="tm-layout-shell flex min-h-screen text-slate-100">
      <Sidebar />
      <main className="tm-layout-main">
        <div className="tm-layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
