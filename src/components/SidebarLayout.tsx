import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

export default function SidebarLayout() {
  const { state, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          <aside className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-4">
              <div className="text-sm text-gray-500">خوش آمدید</div>
              <div className="font-semibold text-gray-900">
                {state?.user?.firstName || state?.user?.username || "کاربر"}
              </div>
            </div>

            <nav className="space-y-2">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                  }`
                }
              >
                داشبورد
              </NavLink>
              <NavLink
                to="/admin/applications"
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                  }`
                }
              >
                درخواست‌های ثبت‌شده
              </NavLink>
              <NavLink
                to="/admin/job-groups"
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                  }`
                }
              >
                گروه‌های شغلی
              </NavLink>
            </nav>

            <button
              type="button"
              onClick={logout}
              className="mt-6 w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              خروج
            </button>
          </aside>

          <main className="rounded-2xl border bg-white p-6 shadow-sm">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
