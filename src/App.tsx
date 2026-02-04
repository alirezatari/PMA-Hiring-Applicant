import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Card from "./components/Card";
import JobDetails from "./pages/JobDetails";
import Apply from "./pages/Apply";
import type { JobGroup } from "./types";

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
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
        }

        const data = await res.json();
        setItems(Array.isArray(data.jobGroups) ? data.jobGroups : []);
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
      <div className="min-h-screen bg-gray-50">
        {/* صفحه اصلی */}
        <Routes>
          <Route
            path="/"
            element={
              // اینجا از element استفاده می‌کنیم
              <div className="mx-auto max-w-6xl p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  گروه‌های شغلی
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <Card key={item.jobGroupId} item={item} />
                  ))}
                </div>
              </div>
            }
          />
          {/* صفحه جزئیات شغل */}
          <Route path="/job-details/:id" element={<JobDetails />} />

          {/* ثبت درخواست همکاری (Applicant -> JobApplication) */}
          <Route path="/apply/:jobGroupId" element={<Apply />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
