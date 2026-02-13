import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

type ActivityFilter = "all" | "active" | "inactive";

type StatusCount = {
  statusId: number;
  statusName: string;
  count: number;
};

type JobGroupCountItem = {
  jobGroupId: number;
  title: string;
  isActive: boolean | null;
  applicationsCount: number;
  statusCounts: StatusCount[];
};

function normalizeBool(value: any): boolean | null {
  if (typeof value === "boolean") return value;
  if (value == null) return null;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return Boolean(value);
}

function normalizeBaseItems(data: any): JobGroupCountItem[] {
  const rawList: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.jobGroups)
    ? data.jobGroups
    : Array.isArray(data?.jobGroupCounts)
    ? data.jobGroupCounts
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.result)
    ? data.result
    : [];

  return rawList.map((x) => {
    const applicationsCount = Number(
      x?.applicationsCount ??
        x?.ApplicationsCount ??
        x?.applicantCount ??
        x?.ApplicantCount ??
        x?.applicationCount ??
        x?.ApplicationCount ??
        x?.count ??
        0,
    );

    return {
      jobGroupId: Number(x?.jobGroupId ?? x?.JobGroupId ?? x?.id ?? 0),
      title: String(x?.title ?? x?.Title ?? x?.jobGroupTitle ?? "—"),
      isActive: normalizeBool(x?.isActive ?? x?.IsActive),
      applicationsCount: Number.isFinite(applicationsCount) ? applicationsCount : 0,
      statusCounts: [],
    };
  });
}

function normalizeStatusList(value: any): StatusCount[] {
  const rawList: any[] = Array.isArray(value)
    ? value
    : Array.isArray(value?.statusCounts)
    ? value.statusCounts
    : Array.isArray(value?.StatusCounts)
    ? value.StatusCounts
    : Array.isArray(value?.applicationStatusCounts)
    ? value.applicationStatusCounts
    : Array.isArray(value?.ApplicationStatusCounts)
    ? value.ApplicationStatusCounts
    : [];

  return rawList
    .map((x) => {
      const count = Number(
        x?.count ??
          x?.Count ??
          x?.applicationsCount ??
          x?.ApplicationsCount ??
          x?.applicantCount ??
          x?.ApplicantCount ??
          0,
      );
      return {
        statusId: Number(
          x?.applicationStatusId ??
            x?.ApplicationStatusId ??
            x?.applicantStatusId ??
            x?.ApplicantStatusId ??
            x?.statusId ??
            x?.id ??
            0,
        ),
        statusName: String(
          x?.applicationStatusName ??
            x?.ApplicationStatusName ??
            x?.applicantStatusName ??
            x?.ApplicantStatusName ??
            x?.statusName ??
            x?.name ??
            x?.title ??
            "نامشخص",
        ),
        count: Number.isFinite(count) ? count : 0,
      };
    })
    .filter((x) => x.statusName.trim().length > 0);
}

function normalizeStatusMap(data: any): Map<number, StatusCount[]> {
  const map = new Map<number, StatusCount[]>();
  const rawList: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.jobGroups)
    ? data.jobGroups
    : Array.isArray(data?.jobGroupStatusCounts)
    ? data.jobGroupStatusCounts
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.result)
    ? data.result
    : [];

  rawList.forEach((x) => {
    const jobGroupId = Number(x?.jobGroupId ?? x?.JobGroupId ?? x?.id ?? 0);
    if (!Number.isFinite(jobGroupId) || jobGroupId <= 0) return;

    const statusCounts = normalizeStatusList(x);
    if (statusCounts.length > 0) {
      map.set(jobGroupId, statusCounts);
      return;
    }

    // Fallback: dictionary/object map in a single field
    const obj = x?.statusCounts ?? x?.StatusCounts;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const list = Object.entries(obj).map(([name, c]) => ({
        statusId: 0,
        statusName: String(name),
        count: Number(c ?? 0),
      }));
      map.set(jobGroupId, list);
    }
  });

  return map;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [items, setItems] = useState<JobGroupCountItem[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<JobGroupCountItem | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const isActive =
          activity === "all" ? null : activity === "active" ? true : false;
        const payload = { searchKey: searchKey.trim(), isActive };

        const [{ data: countsData, res: countsRes }, { data: statusData, res: statusRes }] =
          await Promise.all([
            apiFetch<any>("/api/JobGroups/counts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }),
            apiFetch<any>("/api/JobGroups/statuscounts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }),
          ]);

        if (!countsRes.ok) throw new Error(`HTTP ${countsRes.status}`);
        if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}`);

        const base = normalizeBaseItems(countsData);
        const statusMap = normalizeStatusMap(statusData);

        const merged = base.map((x) => {
          const statusCounts = statusMap.get(x.jobGroupId) ?? [];
          return {
            ...x,
            statusCounts,
          };
        });

        if (!mounted) return;
        setItems(merged);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "خطا در دریافت آمار موقعیت‌های شغلی");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [searchKey, activity]);

  const totalGroups = items.length;
  const totalApplications = useMemo(
    () => items.reduce((sum, x) => sum + (x.applicationsCount || 0), 0),
    [items],
  );
  const maxItem = useMemo(() => {
    if (!items.length) return null;
    return [...items].sort(
      (a, b) => (b.applicationsCount || 0) - (a.applicationsCount || 0),
    )[0];
  }, [items]);

  function openApplicationsByStatus(status: StatusCount) {
    if (!selected?.jobGroupId) return;
    const query =
      status.statusId > 0
        ? `?statusId=${encodeURIComponent(String(status.statusId))}`
        : `?statusName=${encodeURIComponent(status.statusName)}`;
    setDetailOpen(false);
    navigate(`/admin/applications/${selected.jobGroupId}${query}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-extrabold text-gray-900">
          داشبورد آمار موقعیت‌های شغلی
        </h1>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          <label className="text-xs text-gray-600">
            جستجو
            <input
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs text-gray-600">
            وضعیت فعالیت
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityFilter)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال</option>
              <option value="inactive">فقط غیرفعال</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-blue-50 p-4">
          <div className="text-xs text-blue-700">تعداد موقعیت‌های نمایش داده‌شده</div>
          <div className="mt-1 text-2xl font-extrabold text-blue-900">
            {loading ? "..." : totalGroups}
          </div>
        </div>
        <div className="rounded-xl border bg-emerald-50 p-4">
          <div className="text-xs text-emerald-700">جمع کل درخواست‌ها</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-900">
            {loading ? "..." : totalApplications}
          </div>
        </div>
        <div className="rounded-xl border bg-amber-50 p-4">
          <div className="text-xs text-amber-700">بیشترین درخواست</div>
          <div className="mt-1 text-sm font-semibold text-amber-900">
            {loading
              ? "..."
              : maxItem
              ? `${maxItem.title} (${maxItem.applicationsCount})`
              : "—"}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white overflow-hidden">
        <div className="overflow-auto max-h-[55vh]">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-right">عنوان موقعیت شغلی</th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">تعداد درخواست‌ها</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                !error &&
                items.map((item) => (
                  <tr key={item.jobGroupId || item.title} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      {item.isActive == null ? (
                        <span className="text-gray-500">نامشخص</span>
                      ) : item.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                          فعال
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          setDetailOpen(true);
                        }}
                        className="rounded-md border px-2 py-1 hover:bg-gray-50"
                      >
                        {item.applicationsCount}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="px-4 py-4 text-sm text-gray-600">در حال بارگذاری...</div>
        )}
        {!loading && !!error && (
          <div className="px-4 py-4 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="px-4 py-4 text-sm text-gray-600">
            موردی برای نمایش وجود ندارد.
          </div>
        )}
      </div>

      {detailOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border bg-white shadow-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-sm text-gray-500">ریز آمار وضعیت درخواست‌ها</div>
                <div className="font-semibold text-gray-900">{selected.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                بستن
              </button>
            </div>

            <div className="p-4 overflow-auto max-h-[60vh]">
              {selected.statusCounts.length === 0 ? (
                <div className="text-sm text-gray-600">
                  برای این موقعیت، ریز وضعیتی دریافت نشد.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-right">وضعیت درخواست</th>
                      <th className="px-3 py-2 text-right">تعداد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.statusCounts.map((s, idx) => (
                      <tr
                        key={`${s.statusId}-${idx}`}
                        className="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() => openApplicationsByStatus(s)}
                      >
                        <td className="px-3 py-2">{s.statusName}</td>
                        <td className="px-3 py-2 font-semibold">{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
