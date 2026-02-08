import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import MessageBox from "../components/MessageBox";

type JobGroup = {
  jobGroupId?: number;
  id?: number;
  title?: string;
  description?: string;
  jobRequirements?: string;
  benefits?: string;
  minWorkExperience?: number | null;
  minEducationLevelId?: number | null;
  employmentTypeId?: number | null;
  cityID?: number | null;
  isRemoteAllowed?: boolean | null;
  isActive?: boolean | null;
  cityName?: string | null;
};

type LookupItem = {
  id?: number;
  title?: string;
  name?: string;
};

type CityItem = {
  cityId?: number;
  id?: number;
  title?: string;
  name?: string;
  provinceId?: number;
  provinceID?: number;
  province?: { provinceId?: number; id?: number };
};

type ProvinceItem = {
  provinceId?: number;
  id?: number;
  title?: string;
  name?: string;
};

function toInt(v: string): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (Math.floor(n) !== n) return null;
  return n;
}

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobGroups)) return data.jobGroups;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.cities)) return data.cities;
  if (Array.isArray(data?.provinces)) return data.provinces;
  if (Array.isArray(data?.employmentTypes)) return data.employmentTypes;
  if (Array.isArray(data?.educationLevels)) return data.educationLevels;
  return [];
}

function normalizeLookup(data: any): LookupItem[] {
  const list = normalizeList(data);
  return list.map((x) => ({
    id:
      x?.id ??
      x?.cityId ??
      x?.cityID ??
      x?.employmentTypeId ??
      x?.educationLevelId,
    title: x?.title ?? x?.name,
    name: x?.name ?? x?.title,
  }));
}

function normalizeCities(data: any): CityItem[] {
  const list = normalizeList(data);
  return list.map((x) => ({
    cityId: x?.cityId ?? x?.id,
    title: x?.title ?? x?.name,
    provinceId:
      x?.provinceId ??
      x?.provinceID ??
      x?.province?.provinceId ??
      x?.province?.id,
  }));
}

function normalizeProvinces(data: any): ProvinceItem[] {
  const list = normalizeList(data);
  return list.map((x) => ({
    provinceId: x?.provinceId ?? x?.id,
    title: x?.title ?? x?.name,
  }));
}

function cleanPayload<T extends Record<string, any>>(payload: T): T {
  const next: Record<string, any> = {};
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    next[k] = v;
  });
  return next as T;
}

export default function AdminJobGroups() {
  const { state } = useAuth();
  const userId = state?.user?.userId ?? 0;

  const [items, setItems] = useState<JobGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [minWorkExperience, setMinWorkExperience] = useState<string>("");
  const [minEducationLevelId, setMinEducationLevelId] = useState<string>("");
  const [employmentTypeId, setEmploymentTypeId] = useState<string>("");
  const [provinceId, setProvinceId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [isRemoteAllowed, setIsRemoteAllowed] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [educationLevels, setEducationLevels] = useState<LookupItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<LookupItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  async function fetchJobGroups(filter: "all" | "active" | "inactive") {
    const isActiveFilter =
      filter === "all" ? null : filter === "active" ? true : false;
    const { data, res } = await apiFetch<any>(`/api/JobGroups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        cleanPayload({
          searchKey: "",
          isActive: isActiveFilter,
        })
      ),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = normalizeList(data).map((x) => normalizeJobGroup(x));
    setItems(list);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        await fetchJobGroups(statusFilter);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "خطا در دریافت لیست گروه‌های شغلی");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [edu, emp, city, prov] = await Promise.all([
          apiFetch<any>(`/api/EducationLevels`, { method: "GET" }),
          apiFetch<any>(`/api/EmploymentTypes`, { method: "GET" }),
          apiFetch<any>(`/api/Cities`, { method: "GET" }),
          apiFetch<any>(`/api/Provinces`, { method: "GET" }),
        ]);
        if (!mounted) return;

        const eduList = edu.res.ok ? normalizeLookup(edu.data) : [];
        const empList = emp.res.ok ? normalizeLookup(emp.data) : [];
        const cityList = city.res.ok ? normalizeCities(city.data) : [];
        const provList = prov.res.ok ? normalizeProvinces(prov.data) : [];

        if (!eduList.length) {
          const fallback = await apiFetch<any>(`/api/EducationLevels`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchKey: "" }),
          });
          if (fallback.res.ok)
            setEducationLevels(normalizeLookup(fallback.data));
        } else {
          setEducationLevels(eduList);
        }

        if (!empList.length) {
          const fallback = await apiFetch<any>(`/api/EmploymentTypes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchKey: "" }),
          });
          if (fallback.res.ok)
            setEmploymentTypes(normalizeLookup(fallback.data));
        } else {
          setEmploymentTypes(empList);
        }

        if (!provList.length) {
          const fallback = await apiFetch<any>(`/api/Provinces`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchKey: "" }),
          });
          if (fallback.res.ok) setProvinces(normalizeProvinces(fallback.data));
        } else {
          setProvinces(provList);
        }

        if (!cityList.length) {
          const fallback = await apiFetch<any>(`/api/Cities`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchKey: "" }),
          });
          if (fallback.res.ok) setCities(normalizeCities(fallback.data));
        } else {
          setCities(cityList);
        }
      } catch {
        // ignore lookup errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const provinceOptions = useMemo<ProvinceItem[]>(() => {
    if (provinces.length) return provinces;
    const map = new Map<number, ProvinceItem>();
    cities.forEach((c) => {
      const pid = Number(c.provinceId);
      if (!Number.isFinite(pid) || pid <= 0) return;
      if (!map.has(pid)) {
        map.set(pid, {
          provinceId: pid,
          title: `استان ${pid}`,
        });
      }
    });
    return Array.from(map.values());
  }, [provinces, cities]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return items.find(
      (x) => Number(x.jobGroupId ?? x.id) === Number(selectedId)
    );
  }, [items, selectedId]);

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
    const d = raw?.jobGroup ?? raw?.item ?? raw?.result ?? raw ?? {};
    return {
      jobGroupId: d.jobGroupId ?? d.JobGroupId ?? d.id,
      title: d.title ?? d.Title ?? d.name ?? "",
      description: d.description ?? d.Description ?? "",
      jobRequirements: d.jobRequirements ?? d.JobRequirements ?? "",
      benefits: d.benefits ?? d.Benefits ?? "",
      minWorkExperience:
        d.minWorkExperience ??
        d.MinWorkExperience ??
        d.minWorkExperienceYears ??
        null,
      minEducationLevelId:
        d.minEducationLevelId ??
        d.MinEducationLevelId ??
        d.minEducationLevelID ??
        d.educationLevelId ??
        d.educationLevelID ??
        null,
      employmentTypeId:
        d.employmentTypeId ??
        d.EmploymentTypeId ??
        d.employmentTypeID ??
        null,
      cityID: d.cityID ?? d.CityID ?? d.cityId ?? d.CityId ?? null,
      isRemoteAllowed:
        resolveBool(d.isRemoteAllowed ?? d.IsRemoteAllowed) ?? null,
      isActive: resolveBool(d.isActive ?? d.IsActive),
      cityName: d.cityName ?? d.CityName ?? d.cityTitle ?? null,
    };
  }

  async function loadDetails(id: number) {
    const { data, res } = await apiFetch<any>(`/api/JobGroups/${id}`, {
      method: "GET",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const detail = normalizeJobGroup(data);
    setTitle(detail.title ?? "");
    setDescription(detail.description ?? "");
    setJobRequirements(detail.jobRequirements ?? "");
    setBenefits(detail.benefits ?? "");
    setMinWorkExperience(
      detail.minWorkExperience != null ? String(detail.minWorkExperience) : ""
    );
    setMinEducationLevelId(
      detail.minEducationLevelId != null
        ? String(detail.minEducationLevelId)
        : ""
    );
    setEmploymentTypeId(
      detail.employmentTypeId != null ? String(detail.employmentTypeId) : ""
    );
    setCityId(detail.cityID != null ? String(detail.cityID) : "");
    const city = cities.find(
      (c) => String(c.cityId ?? c.id) === String(detail.cityID ?? "")
    );
    setProvinceId(
      city?.provinceId != null ? String(city.provinceId) : ""
    );
    setIsRemoteAllowed(detail.isRemoteAllowed === true);
    setIsActive(detail.isActive !== false);
  }

  function resetForm() {
    setSelectedId(null);
    setTitle("");
    setDescription("");
    setJobRequirements("");
    setBenefits("");
    setMinWorkExperience("");
    setMinEducationLevelId("");
    setEmploymentTypeId("");
    setProvinceId("");
    setCityId("");
    setIsRemoteAllowed(false);
    setIsActive(true);
  }

  async function onSelect(id: number) {
    setSelectedId(id);
    try {
      await loadDetails(id);
    } catch (e: any) {
      setError(e?.message ?? "خطا در دریافت اطلاعات گروه شغلی");
    }
  }

  async function onSave() {
    setError("");
    if (!userId) {
      setError("شناسه کاربر نامعتبر است. لطفاً دوباره وارد شوید.");
      return;
    }
    if (!title.trim()) {
      setError("عنوان گروه شغلی الزامی است.");
      return;
    }
    if (!description.trim()) {
      setError("شرح شغل الزامی است.");
      return;
    }
    if (!minEducationLevelId) {
      setError("حداقل مدرک تحصیلی الزامی است.");
      return;
    }
    if (!employmentTypeId) {
      setError("نوع استخدام الزامی است.");
      return;
    }
    if (!cityId) {
      setError("شهر محل کار الزامی است.");
      return;
    }

    const payload = cleanPayload({
      title: title.trim(),
      description: description.trim() || null,
      jobRequirements: jobRequirements.trim() || null,
      benefits: benefits.trim() || null,
      minWorkExperience: toInt(minWorkExperience),
      minEducationLevelId: toInt(minEducationLevelId),
      employmentTypeId: toInt(employmentTypeId),
      cityID: toInt(cityId),
      isRemoteAllowed,
      isActive,
    });

    setSaving(true);
    try {
      if (selectedId) {
        const { res } = await apiFetch<any>(`/api/JobGroups/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            cleanPayload({
              jobGroupId: selectedId,
              updatorUserId: userId,
              ...payload,
            })
          ),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const { res } = await apiFetch<any>(`/api/JobGroups/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            cleanPayload({
              creatorUserId: userId,
              ...payload,
            })
          ),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      await fetchJobGroups(statusFilter);
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedId) return;
    setConfirmOpen(true);
  }

  async function onConfirmDelete() {
    if (!selectedId) return;
    setDeleteBusy(true);
    try {
      const { res } = await apiFetch<any>(`/api/JobGroups/${selectedId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchJobGroups(statusFilter);
      resetForm();
    } catch (e: any) {
      setError(
        e?.message ?? "امکان حذف گروه شغلی وجود ندارد (احتمالاً استفاده شده)."
      );
    } finally {
      setDeleteBusy(false);
      setConfirmOpen(false);
    }
  }

  const filteredCities = useMemo(() => {
    const pid = toInt(provinceId);
    if (pid == null) return cities;
    const subset = cities.filter((c) => Number(c.provinceId) === pid);
    return subset.length ? subset : cities;
  }, [cities, provinceId]);

  useEffect(() => {
    if (!cityId || provinceId) return;
    const city = cities.find((c) => String(c.cityId ?? c.id) === cityId);
    if (city?.provinceId != null) {
      setProvinceId(String(city.provinceId));
    }
  }, [cities, cityId, provinceId]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            مدیریت گروه‌های شغلی
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            افزودن، ویرایش و حذف گروه‌های شغلی
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          افزودن جدید
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="rounded-2xl border bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">
            لیست گروه‌ها
          </div>
          <div className="mb-3">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "active" | "inactive"
                )
              }
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="all">همه</option>
              <option value="active">فقط فعال</option>
              <option value="inactive">فقط غیرفعال</option>
            </select>
          </div>

          {loading && (
            <div className="text-sm text-gray-600">در حال بارگذاری...</div>
          )}
          {!loading && error && (
            <div className="text-xs text-red-600">{error}</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="text-sm text-gray-600">موردی یافت نشد.</div>
          )}

          <div className="space-y-2">
            {items.map((x) => {
              const id = Number(x.jobGroupId ?? x.id);
              const active = selectedId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(id)}
                  className={`w-full text-right rounded-lg border px-3 py-2 text-sm ${
                    active
                      ? "border-blue-600 bg-blue-50"
                      : "hover:bg-white"
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {x.title ?? "بدون عنوان"}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
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

        <div className="rounded-2xl border bg-white p-0 flex flex-col max-h-[calc(100vh-220px)]">
          <div className="p-6">
            <div className="text-sm font-semibold text-gray-800 mb-1">
              فرم اطلاعات گروه شغلی
            </div>
            <div className="mb-4 text-xs text-gray-500">
              فیلدهای ستاره‌دار الزامی هستند.
            </div>
          </div>

          <div className="px-6 pb-4 overflow-auto">
            <div className="grid grid-cols-1 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  عنوان <span className="text-red-600">*</span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  شرح شغل <span className="text-red-600">*</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  شرایط احراز
                </div>
                <textarea
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">مزایا</div>
                <textarea
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm">
                  <div className="mb-1 font-semibold text-gray-800">
                    حداقل سابقه کاری (سال)
                  </div>
                  <input
                    value={minWorkExperience}
                    onChange={(e) => setMinWorkExperience(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 font-semibold text-gray-800">
                    استان محل کار
                  </div>
                  <select
                    value={provinceId}
                    onChange={(e) => {
                      setProvinceId(e.target.value);
                      setCityId("");
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value="">انتخاب کنید</option>
                  {provinceOptions.map((p, idx) => (
                    <option
                      key={idx}
                      value={String(p.provinceId ?? p.id ?? "")}
                    >
                      {p.title ?? p.name ?? `استان ${p.provinceId ?? p.id}`}
                    </option>
                  ))}
                </select>
              </label>
              </div>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  شهر محل کار <span className="text-red-600">*</span>
                </div>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  disabled={!provinceId}
                >
                  <option value="">
                    {!provinceId ? "ابتدا استان را انتخاب کنید" : "انتخاب کنید"}
                  </option>
                  {filteredCities.map((c, idx) => (
                    <option key={idx} value={String(c.cityId ?? c.id ?? "")}>
                      {c.title ?? c.name ?? `شهر ${c.cityId ?? c.id}`}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm">
                  <div className="mb-1 font-semibold text-gray-800">
                    حداقل مدرک تحصیلی <span className="text-red-600">*</span>
                  </div>
                  <select
                    value={minEducationLevelId}
                    onChange={(e) => setMinEducationLevelId(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value="">انتخاب کنید</option>
                    {educationLevels.map((e, idx) => (
                      <option key={idx} value={String(e.id ?? "")}>
                        {e.title ?? e.name ?? `مدرک ${e.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <div className="mb-1 font-semibold text-gray-800">
                    نوع استخدام <span className="text-red-600">*</span>
                  </div>
                  <select
                    value={employmentTypeId}
                    onChange={(e) => setEmploymentTypeId(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value="">انتخاب کنید</option>
                    {employmentTypes.map((e, idx) => (
                      <option key={idx} value={String(e.id ?? "")}>
                        {e.title ?? e.name ?? `نوع ${e.id}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

            <label className="text-sm">
              <div className="mb-1 font-semibold text-gray-800">
                امکان دورکاری
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isRemoteAllowed}
                  onChange={(e) => setIsRemoteAllowed(e.target.checked)}
                />
                <span className="text-sm text-gray-700">بلی</span>
              </div>
            </label>

            <label className="text-sm">
              <div className="mb-1 font-semibold text-gray-800">
                وضعیت گروه شغلی
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  {isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
            </label>
            </div>
          </div>

          <div className="sticky bottom-0 border-t bg-white px-6 py-4">
            {!!error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "در حال ذخیره..." : "ذخیره"}
              </button>

              {selectedId && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleteBusy}
                  className="rounded-xl border border-red-200 px-5 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  {deleteBusy ? "در حال حذف..." : "حذف"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <MessageBox
        open={confirmOpen}
        type="confirm"
        title="حذف گروه شغلی"
        message="آیا از حذف این گروه شغلی مطمئن هستید؟ در صورت استفاده قبلی، حذف ممکن نیست."
        confirmText={deleteBusy ? "در حال حذف..." : "حذف"}
        cancelText="انصراف"
        onConfirm={deleteBusy ? undefined : onConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
