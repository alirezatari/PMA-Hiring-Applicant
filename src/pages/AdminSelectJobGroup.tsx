import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

type JobGroup = {
  jobGroupId?: number;
  id?: number;
  title?: string;
  isActive?: boolean | null;
  cityName?: string | null;
};

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobGroups)) return data.jobGroups;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

function resolveBool(v: any): boolean | null {
  if (v === true || v === false) return v;
  if (v == null) return null;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true") return true;
    if (t === "false") return false;
  }
  return null;
}

function normalizeJobGroup(raw: any): JobGroup {
  const d = raw ?? {};
  return {
    jobGroupId: d.jobGroupId ?? d.JobGroupId ?? d.id,
    title: d.title ?? d.Title ?? d.name ?? "",
    isActive: resolveBool(d.isActive ?? d.IsActive),
    cityName: d.cityName ?? d.CityName ?? null,
  };
}

export default function AdminSelectJobGroup() {
  const navigate = useNavigate();
  const [items, setItems] = useState<JobGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const isActiveFilter =
          statusFilter === "all"
            ? null
            : statusFilter === "active"
            ? true
            : false;
        const { data, res } = await apiFetch<any>(`/api/JobGroups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchKey: "",
            isActive: isActiveFilter,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list = normalizeList(data).map((x) => normalizeJobGroup(x));
        if (!mounted) return;
        setItems(list);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "خطا در دریافت لیست گروه‌ها");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            انتخاب گروه شغلی
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            ابتدا گروه شغلی را انتخاب کنید.
          </p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">همه</option>
            <option value="active">فقط فعال</option>
            <option value="inactive">فقط غیرفعال</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="text-sm text-gray-600">در حال بارگذاری...</div>
        )}
        {!loading && error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-gray-600">موردی یافت نشد.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((x) => {
            const id = Number(x.jobGroupId ?? x.id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(`/admin/applications/${id}`)}
                className="rounded-2xl border bg-white p-4 text-right shadow-sm hover:border-blue-400"
              >
                <div className="font-semibold text-gray-900">
                  {x.title ?? "بدون عنوان"}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      x.isActive === false
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {x.isActive === false ? "غیرفعال" : "فعال"}
                  </span>
                  {x.cityName && (
                    <span className="text-gray-500">{x.cityName}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
