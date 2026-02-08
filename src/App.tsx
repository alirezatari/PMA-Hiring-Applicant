import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Card from "./components/Card";
import JobDetails from "./pages/JobDetails";
import Apply from "./pages/Apply";
import type { JobGroup } from "./types";
import { AuthProvider, ProtectedRoute } from "./auth";
import Login from "./pages/Login";
import SidebarLayout from "./components/SidebarLayout";
import AdminHome from "./pages/AdminHome";
import AdminJobGroups from "./pages/AdminJobGroups";
import AdminSelectJobGroup from "./pages/AdminSelectJobGroup";
import AdminJobApplications from "./pages/AdminJobApplications";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [items, setItems] = useState<JobGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    console.log("API Base URL App:", import.meta.env.VITE_API_BASE_URL);

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/JobGroups`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ searchKey: "", isActive: true }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
        }

        const data = await res.json();
        const list: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.jobGroups)
          ? data.jobGroups
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.result)
          ? data.result
          : [];
        setItems(list as JobGroup[]);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setError(e?.message ?? "خطا در دریافت اطلاعات");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          {/* صفحه اصلی */}
          <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route
              path="/jobs"
              element={
                <div className="mx-auto max-w-6xl p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    گروه‌های شغلی
                  </h1>

                  {loading && (
                    <div className="text-sm text-gray-600">
                      در حال بارگذاری...
                    </div>
                  )}

                  {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      خطا: {error}
                    </div>
                  )}

                  {!loading && !error && items.length === 0 && (
                    <div className="text-sm text-gray-600">
                      موردی برای نمایش وجود ندارد.
                    </div>
                  )}

                  {!loading && !error && items.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {items.map((item) => (
                        <Card key={item.jobGroupId} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              }
            />
            {/* صفحه جزئیات شغل */}
            <Route path="/job-details/:id" element={<JobDetails />} />

            {/* ثبت درخواست همکاری (Applicant -> JobApplication) */}
            <Route path="/apply/:jobGroupId" element={<Apply />} />

            {/* ورود */}
            <Route path="/login" element={<Login />} />

            {/* صفحات محافظت‌شده */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <SidebarLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminHome />} />
              <Route path="applications" element={<AdminSelectJobGroup />} />
              <Route
                path="applications/:jobGroupId"
                element={<AdminJobApplications />}
              />
              <Route path="job-groups" element={<AdminJobGroups />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
