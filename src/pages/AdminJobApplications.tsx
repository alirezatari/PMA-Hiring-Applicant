import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { useAuth } from "../auth";

type JobApplication = {
  jobApplicationId?: number;
  applicantId?: number;
  jobGroupId?: number;
  applicationStatusId?: number | null;
  applicationStatusName?: string | null;
  appliedDate?: string | null;
  createdDate?: string | null;
  applicantName?: string | null;
  applicantMobile?: string | null;
  applicantNationalCode?: string | null;
  jobGroupTitle?: string | null;
};

type ApplicantDetail = {
  applicantId?: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  nationalCode?: string | null;
  mobile?: string | null;
  description?: string | null;
  imagePath?: string | null;
  imageUrl?: string | null;
  imageBase64?: string | null;
  imageContentType?: string | null;
  resumePath?: string | null;
  provinceName?: string | null;
  cityName?: string | null;
  gender?: number | null;
  birthDate?: string | null;
  maritalStatus?: number | null;
  militaryStatus?: number | null;
  educationField?: string | null;
  lastJobTitle?: string | null;
  workExperienceYears?: number | null;
  linkedInLink?: string | null;
  socialLink?: string | null;
  applicantStatusName?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
};

type ApplicantStatusHistoryItem = {
  id: number;
  applicantStatusId: number | null;
  applicantStatusName: string;
  comment: string;
  changedByUserName: string;
  changedDate: string | null;
};

function formatFaDateTime(value?: string | null): string {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  const time = dt.toLocaleTimeString("fa-IR-u-ca-persian", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = dt.toLocaleDateString("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${time} - ${date}`;
}

function formatFaDate(value?: string | null): string {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function buildFileUrl(path?: string | null): string | null {
  if (!path) return null;
  const raw = String(path).replace(/\\/g, "/");
  if (/^data:image\//i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  const devBase =
    typeof window !== "undefined"
      ? `${window.location.origin}/pmahiringservice`
      : "";
  const base =
    import.meta.env.VITE_FILE_BASE_URL ||
    (import.meta.env.DEV ? devBase : import.meta.env.VITE_API_BASE_URL) ||
    "";
  if (!base) return `/${raw.replace(/^\/+/, "")}`;
  return `${base.replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;
}

function buildImageSrc(detail?: ApplicantDetail | null): string | null {
  if (!detail) return null;
  if (detail.imageBase64) {
    const ct = detail.imageContentType || "image/jpeg";
    return `data:${ct};base64,${detail.imageBase64}`;
  }
  return buildFileUrl(detail.imageUrl ?? detail.imagePath);
}

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobApplications)) return data.jobApplications;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

function normalizeApplication(raw: any): JobApplication {
  const d = raw ?? {};
  return {
    jobApplicationId: d.jobApplicationId ?? d.JobApplicationId ?? d.id,
    applicantId: d.applicantId ?? d.ApplicantId,
    jobGroupId: d.jobGroupId ?? d.JobGroupId,
    applicationStatusId: d.applicationStatusId ?? d.ApplicationStatusId ?? null,
    applicationStatusName:
      d.applicationStatusName ?? d.ApplicationStatusName ?? null,
    appliedDate: d.appliedDate ?? d.AppliedDate ?? null,
    createdDate: d.createdDate ?? d.CreatedDate ?? null,
    applicantName: d.applicantName ?? d.ApplicantName ?? null,
    applicantMobile: d.applicantMobile ?? d.ApplicantMobile ?? null,
    applicantNationalCode:
      d.applicantNationalCode ?? d.ApplicantNationalCode ?? null,
    jobGroupTitle: d.jobGroupTitle ?? d.JobGroupTitle ?? null,
  };
}

export default function AdminJobApplications() {
  const { state } = useAuth();
  const { jobGroupId } = useParams<{ jobGroupId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryStatusId = searchParams.get("statusId");
  const queryStatusName = searchParams.get("statusName");
  const initialStatusFilter =
    queryStatusId && Number(queryStatusId) > 0 ? queryStatusId : "";
  const initialStatusNameFilter = queryStatusName?.trim() || "";

  const jobGroupNum = Number(jobGroupId || 0);
  const [items, setItems] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [statusNameFilter, setStatusNameFilter] = useState<string>(
    initialStatusNameFilter,
  );
  const [search, setSearch] = useState("");
  const [statusOptions, setStatusOptions] = useState<
    { id: number; title: string }[]
  >([]);
  const [jobGroupTitle, setJobGroupTitle] = useState<string>("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detail, setDetail] = useState<ApplicantDetail | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [statusEditOpen, setStatusEditOpen] = useState(false);
  const [nextStatusId, setNextStatusId] = useState<string>("");
  const [statusComment, setStatusComment] = useState("");
  const [statusEditBusy, setStatusEditBusy] = useState(false);
  const [statusEditError, setStatusEditError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState<ApplicantStatusHistoryItem[]>(
    [],
  );
  const [sortKey, setSortKey] = useState<
    "applicantName" | "createdDate" | "applicationStatusId" | "applicantMobile"
  >("createdDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        if (!jobGroupNum) {
          setItems([]);
          return;
        }
        const { data, res } = await apiFetch<any>(`/api/JobApplications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicantId: 0,
            jobGroupId: jobGroupNum,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let list = normalizeList(data).map((x) => normalizeApplication(x));
        // Defensive filter in case backend ignores jobGroupId
        list = list.filter(
          (x) => Number(x.jobGroupId ?? 0) === Number(jobGroupNum),
        );
        if (!mounted) return;
        const title =
          list.find((x) => x.jobGroupTitle)?.jobGroupTitle ?? "";
        setJobGroupTitle(title);
        setItems(list);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "خطا در دریافت لیست درخواست‌ها");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [jobGroupNum]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, res } = await apiFetch<any>(`/api/ApplicantStatuses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchKey: "" }),
        });
        if (!res.ok) return;
        const list: any[] = Array.isArray(data?.applicantStatuses)
          ? data.applicantStatuses
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.result)
          ? data.result
          : Array.isArray(data)
          ? data
          : [];
        const mapped = list
          .map((x) => ({
            id: Number(x?.applicantStatusId ?? x?.id),
            title: String(x?.title ?? x?.name ?? x?.statusName ?? ""),
          }))
          .filter((x) => Number.isFinite(x.id) && x.id > 0);
        if (!mounted) return;
        setStatusOptions(mapped);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const nextStatusFilter =
      queryStatusId && Number(queryStatusId) > 0 ? queryStatusId : "";
    const nextStatusNameFilter = queryStatusName?.trim() || "";
    setStatusFilter(nextStatusFilter);
    setStatusNameFilter(nextStatusNameFilter);
  }, [queryStatusId, queryStatusName]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter) {
      list = list.filter(
        (x) => String(x.applicationStatusId ?? "") === statusFilter,
      );
    } else if (statusNameFilter) {
      list = list.filter(
        (x) =>
          String(x.applicationStatusName ?? "").trim() ===
          statusNameFilter.trim(),
      );
    }
    if (search.trim()) {
      const s = search.trim();
      list = list.filter(
        (x) =>
          String(x.applicantName ?? "").includes(s) ||
          String(x.applicantMobile ?? "").includes(s) ||
          String(x.applicantNationalCode ?? "").includes(s),
      );
    }
    return list;
  }, [items, statusFilter, statusNameFilter, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "createdDate") {
        av = Date.parse(String(a.createdDate ?? a.appliedDate ?? "")) || 0;
        bv = Date.parse(String(b.createdDate ?? b.appliedDate ?? "")) || 0;
      } else if (sortKey === "applicantName") {
        av = String(a.applicantName ?? "");
        bv = String(b.applicantName ?? "");
      } else if (sortKey === "applicationStatusId") {
        av = Number(a.applicationStatusId ?? 0);
        bv = Number(b.applicationStatusId ?? 0);
      } else if (sortKey === "applicantMobile") {
        av = String(a.applicantMobile ?? "");
        bv = String(b.applicantMobile ?? "");
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, pageSize, sortKey, sortDir]);

  function toggleSort(nextKey: typeof sortKey) {
    if (sortKey === nextKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  function SortIcon({ active }: { active: boolean }) {
    return (
      <span className="inline-block text-xs text-gray-400">
        {active ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    );
  }

  async function openDetails(row: JobApplication) {
    setSelected(row);
    setDetail(null);
    setDetailError("");
    setResumeError("");
    setDetailOpen(true);
    if (!row.applicantId) return;
    setDetailLoading(true);
    try {
      const { data, res } = await apiFetch<any>(
        `/api/Applicants/${row.applicantId}`,
        { method: "GET" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = data ?? {};
      const mapped: ApplicantDetail = {
        applicantId: d.applicantId ?? d.ApplicantId,
        firstName: d.firstName ?? d.FirstName ?? null,
        lastName: d.lastName ?? d.LastName ?? null,
        email: d.email ?? d.Email ?? null,
        nationalCode: d.nationalCode ?? d.NationalCode ?? null,
        mobile: d.mobile ?? d.Mobile ?? null,
        description: d.description ?? d.Description ?? null,
        imagePath: d.imagePath ?? d.ImagePath ?? null,
        imageUrl:
          d.imageUrl ?? d.ImageUrl ?? d.imageLink ?? d.ImageLink ?? null,
        imageBase64: d.imageBase64 ?? d.ImageBase64 ?? null,
        imageContentType: d.imageContentType ?? d.ImageContentType ?? null,
        resumePath: d.resumePath ?? d.ResumePath ?? null,
        provinceName: d.provinceName ?? d.ProvinceName ?? null,
        cityName: d.cityName ?? d.CityName ?? null,
        gender: d.gender ?? d.Gender ?? null,
        birthDate: d.birthDate ?? d.BirthDate ?? null,
        maritalStatus: d.maritalStatus ?? d.MaritalStatus ?? null,
        militaryStatus: d.militaryStatus ?? d.MilitaryStatus ?? null,
        educationField: d.educationField ?? d.EducationField ?? null,
        lastJobTitle: d.lastJobTitle ?? d.LastJobTitle ?? null,
        workExperienceYears:
          d.workExperienceYears ?? d.WorkExperienceYears ?? null,
        linkedInLink: d.linkedInLink ?? d.LinkedInLink ?? null,
        socialLink: d.socialLink ?? d.SocialLink ?? null,
        applicantStatusName:
          d.applicantStatusName ?? d.ApplicantStatusName ?? null,
        createdDate: d.createdDate ?? d.CreatedDate ?? null,
        updatedDate: d.updatedDate ?? d.UpdatedDate ?? null,
      };
      setDetail(mapped);
    } catch (e: any) {
      setDetailError(e?.message ?? "خطا در دریافت جزئیات متقاضی");
    } finally {
      setDetailLoading(false);
    }
  }

  function getFilenameFromDisposition(value: string | null): string | null {
    if (!value) return null;
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(value);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1]);
      } catch {
        return utf8Match[1];
      }
    }
    const match = /filename="?([^\";]+)"?/i.exec(value);
    return match?.[1] ?? null;
  }

  function normalizeDownloadLink(data: any): string | null {
    if (!data) return null;
    if (typeof data === "string") {
      const v = data.trim();
      if (
        /^https?:\/\//i.test(v) ||
        v.startsWith("/") ||
        /\/api\/files\//i.test(v) ||
        /download\?token=/i.test(v)
      ) {
        return v;
      }
      return null;
    }
    return (
      data?.url ??
      data?.link ??
      data?.downloadUrl ??
      data?.downloadLink ??
      null
    );
  }

  function normalizeDownloadToken(data: any): string | null {
    if (!data) return null;
    if (typeof data === "string") {
      const v = data.trim();
      if (!v) return null;
      return v;
    }
    return data?.token ?? data?.fileToken ?? data?.downloadToken ?? null;
  }

  async function downloadResume(applicantId: number) {
    setResumeBusy(true);
    setResumeError("");
    try {
      const { data, res } = await apiFetch<any>(
        `/api/Files/applicant/${applicantId}/link?minutes=10`,
        { method: "GET" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const direct = normalizeDownloadLink(data);
      const token = normalizeDownloadToken(data);

      const base = (API_BASE || "").replace(/\/+$/, "");
      if (!direct && !token) {
        throw new Error("توکن یا لینک دانلود دریافت نشد");
      }
      const fallbackUrl = `/api/Files/download?token=${encodeURIComponent(
        String(token ?? ""),
      )}`;
      const url =
        direct && /^https?:\/\//i.test(direct)
          ? direct
          : direct
          ? `${base}${direct.startsWith("/") ? direct : `/${direct}`}`
          : token
          ? `${base}${fallbackUrl}`
          : `${base}${fallbackUrl}`;

      const tryDownloadBlob = async (useAuth: boolean) => {
        const headers = new Headers();
        if (useAuth) {
          const authToken =
            typeof localStorage !== "undefined"
              ? localStorage.getItem("pma_auth_token")
              : null;
          if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
        }

        const downloadRes = await fetch(url, {
          method: "GET",
          headers: headers.size ? headers : undefined,
        });
        if (!downloadRes.ok) throw new Error(`HTTP ${downloadRes.status}`);

        const blob = await downloadRes.blob();
        const filename =
          getFilenameFromDisposition(
            downloadRes.headers.get("content-disposition"),
          ) || `resume_${applicantId}`;

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      };

      try {
        // اول بدون هدر Authorization (برای جلوگیری از CORS preflight)
        await tryDownloadBlob(false);
        return;
      } catch {
        // اگر نشد، با Authorization امتحان کن
        try {
          await tryDownloadBlob(true);
          return;
        } catch {
          // fallback: اجازه بده مرورگر مستقیم دانلود کند (بدون fetch)
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noreferrer";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      }
    } catch (e: any) {
      setResumeError(e?.message ?? "خطا در دریافت رزومه");
    } finally {
      setResumeBusy(false);
    }
  }

  function openStatusEditor() {
    if (!selected?.applicationStatusId) {
      setStatusEditError("وضعیت فعلی درخواست نامشخص است.");
    } else {
      setStatusEditError("");
    }
    setNextStatusId("");
    setStatusComment("");
    setStatusEditOpen(true);
  }

  function normalizeHistoryList(data: any): ApplicantStatusHistoryItem[] {
    const rawList: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.histories)
      ? data.histories
      : Array.isArray(data?.applicantStatusHistories)
      ? data.applicantStatusHistories
      : Array.isArray(data?.statusHistories)
      ? data.statusHistories
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.result)
      ? data.result
      : [];

    return rawList.map((x) => ({
      id: Number(x?.statusHistoryId ?? x?.id ?? 0),
      applicantStatusId:
        x?.applicantStatusId != null ? Number(x.applicantStatusId) : null,
      applicantStatusName: String(
        x?.applicantStatusName ?? x?.statusName ?? x?.title ?? "نامشخص",
      ),
      comment: String(x?.comment ?? ""),
      changedByUserName: String(
        x?.changedByUserName ?? x?.userName ?? x?.changedBy ?? "—",
      ),
      changedDate:
        x?.changedDate ?? x?.createdDate ?? x?.changeDate ?? x?.date ?? null,
    }));
  }

  async function openHistoryModal() {
    if (!selected?.jobApplicationId) {
      setHistoryError("شناسه درخواست موجود نیست.");
      setHistoryItems([]);
      setHistoryOpen(true);
      return;
    }

    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryItems([]);
    try {
      const { data, res } = await apiFetch<any>(`/api/ApplicantStatusHistories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobApplicationId: Number(selected.jobApplicationId),
          applicantStatusId: null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHistoryItems(normalizeHistoryList(data));
    } catch (e: any) {
      setHistoryError(e?.message ?? "خطا در دریافت سوابق وضعیت");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function submitStatusChange() {
    if (!selected?.jobApplicationId) {
      setStatusEditError("اطلاعات درخواست کامل نیست.");
      return;
    }

    const currentStatus = Number(selected.applicationStatusId ?? 0);
    const next = Number(nextStatusId || 0);
    if (!next || !Number.isFinite(next)) {
      setStatusEditError("وضعیت جدید را انتخاب کنید.");
      return;
    }
    if (currentStatus === next) {
      setStatusEditError("وضعیت جدید نمی‌تواند با وضعیت فعلی یکسان باشد.");
      return;
    }
    setStatusEditBusy(true);
    setStatusEditError("");
    try {
      const { res: changeRes } = await apiFetch<any>(
        `/api/JobApplications/${selected.jobApplicationId}/change-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobApplicationId: Number(selected.jobApplicationId),
            applicantStatusId: next,
            changedByUserId: Number(state?.user?.userId ?? 0),
            comment: statusComment.trim() || null,
          }),
        },
      );
      if (!changeRes.ok) throw new Error(`خطا در تغییر وضعیت درخواست (HTTP ${changeRes.status})`);

      const nextTitle =
        statusMap.get(next) ??
        statusOptions.find((x) => Number(x.id) === next)?.title ??
        selected.applicationStatusName ??
        "";

      setItems((prev) =>
        prev.map((x) =>
          Number(x.jobApplicationId) === Number(selected.jobApplicationId)
            ? { ...x, applicationStatusId: next, applicationStatusName: nextTitle }
            : x,
        ),
      );
      setSelected((prev) =>
        prev
          ? { ...prev, applicationStatusId: next, applicationStatusName: nextTitle }
          : prev,
      );
      setDetail((prev) =>
        prev ? { ...prev, applicantStatusName: nextTitle || prev.applicantStatusName } : prev,
      );

      setStatusEditOpen(false);
      if (historyOpen) {
        await openHistoryModal();
      }
    } catch (e: any) {
      setStatusEditError(e?.message ?? "خطا در تغییر وضعیت درخواست");
    } finally {
      setStatusEditBusy(false);
    }
  }

  const statusMap = useMemo(() => {
    const map = new Map<number, string>();
    statusOptions.forEach((s) => {
      if (Number.isFinite(s.id)) map.set(s.id, s.title);
    });
    return map;
  }, [statusOptions]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            درخواست‌های ثبت‌شده
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            گروه شغلی: {jobGroupTitle || "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/applications")}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          تغییر گروه شغلی
        </button>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-gray-600">
            جستجو
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs text-gray-600">
            فیلتر وضعیت
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setStatusNameFilter("");
              }}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
            >
              <option value="">همه وضعیت‌ها</option>
              {statusOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.title || `وضعیت ${s.id}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="text-sm text-gray-600">در حال بارگذاری...</div>
        )}
        {!loading && error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">موردی یافت نشد.</div>
        )}

        {!loading && !error && pageItems.length > 0 && (
          <div className="rounded-2xl border bg-white overflow-hidden flex flex-col max-h-[calc(100vh-260px)]">
            <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("applicantName")}
                      className="inline-flex items-center gap-2"
                    >
                      نام متقاضی <SortIcon active={sortKey === "applicantName"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("applicantMobile")}
                      className="inline-flex items-center gap-2"
                    >
                      موبایل <SortIcon active={sortKey === "applicantMobile"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">کد ملی</th>
                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("applicationStatusId")}
                      className="inline-flex items-center gap-2"
                    >
                      وضعیت <SortIcon active={sortKey === "applicationStatusId"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("createdDate")}
                      className="inline-flex items-center gap-2"
                    >
                      تاریخ ثبت <SortIcon active={sortKey === "createdDate"} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((x, idx) => (
                  <tr
                    key={idx}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => openDetails(x)}
                  >
                    <td className="px-4 py-3">
                      {x.applicantName ??
                        (x.applicantId ? `متقاضی #${x.applicantId}` : "—")}
                    </td>
                    <td className="px-4 py-3">{x.applicantMobile ?? "—"}</td>
                    <td className="px-4 py-3">
                      {x.applicantNationalCode ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {x.applicationStatusId != null
                        ? statusMap.get(Number(x.applicationStatusId)) ??
                          x.applicationStatusName ??
                          x.applicationStatusId
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {formatFaDateTime(x.createdDate ?? x.appliedDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="border-t bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                نمایش {start + 1}-{Math.min(start + pageSize, sorted.length)} از{" "}
                {sorted.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border px-2 py-1 text-xs disabled:opacity-60"
                >
                  اول
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border px-2 py-1 text-xs disabled:opacity-60"
                >
                  قبلی
                </button>
                <span className="text-xs text-gray-600">
                  صفحه {currentPage} از {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border px-2 py-1 text-xs disabled:opacity-60"
                >
                  بعدی
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border px-2 py-1 text-xs disabled:opacity-60"
                >
                  آخر
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {detailOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailOpen(false)}
          />
          <div className="relative w-full max-w-5xl rounded-2xl border bg-white shadow-lg max-h-[94vh] flex flex-col">
            <div className="p-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">
                  جزئیات درخواست{" "}
                  <span className="text-gray-700">
                    ({selected.jobGroupTitle ?? jobGroupTitle ?? "—"})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (detail?.applicantId) {
                      downloadResume(Number(detail.applicantId));
                    }
                  }}
                  disabled={!detail?.applicantId || resumeBusy}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  {resumeBusy ? "در حال دریافت..." : "دریافت رزومه"}
                </button>
                <button
                  type="button"
                  onClick={openStatusEditor}
                  disabled={!selected?.jobApplicationId}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  تغییر وضعیت
                </button>
                <button
                  type="button"
                  onClick={openHistoryModal}
                  disabled={!selected?.jobApplicationId}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
                >
                  سوابق وضعیت
                </button>
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span>بستن</span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fill="currentColor"
                        d="M7.05 6.34a1 1 0 011.41 0L12 9.88l3.54-3.54a1 1 0 111.41 1.41L13.41 11.3l3.54 3.54a1 1 0 01-1.41 1.41L12 12.71l-3.54 3.54a1 1 0 01-1.41-1.41l3.54-3.54-3.54-3.54a1 1 0 010-1.41z"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            <div className="px-4 mt-1 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 text-sm items-start">
              <div className="flex flex-col items-end">
                {buildImageSrc(detail) ? (
                  <button
                    type="button"
                    onClick={() => setImageOpen(true)}
                    className="rounded-xl border bg-gray-50 p-2 h-36 w-28 flex items-center justify-center hover:ring-2 hover:ring-rose-200"
                    aria-label="نمایش بزرگ تصویر"
                  >
                    <img
                      src={buildImageSrc(detail) ?? ""}
                      alt="عکس متقاضی"
                      className="h-32 w-24 object-cover rounded-md border bg-white"
                    />
                  </button>
                ) : (
                  <div className="h-36 w-28 rounded-xl border bg-gray-50" />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-2 md:h-36 items-stretch">
                <div className="rounded-xl border bg-gray-50 p-2 h-full">
                  <div className="text-xs text-gray-500">نام و نام‌خانوادگی</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {`${detail?.firstName ?? ""} ${detail?.lastName ?? ""}`.trim() ||
                      "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-gray-50 p-2 h-full">
                  <div className="text-xs text-gray-500">کد ملی</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail?.nationalCode ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-gray-50 p-2 h-full">
                  <div className="text-xs text-gray-500">موبایل</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail?.mobile ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-gray-50 p-2 h-full">
                  <div className="text-xs text-gray-500">ایمیل</div>
                  <div className="mt-1 font-semibold text-gray-900 break-all">
                    {detail?.email ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 mt-2">
              {detailLoading && (
                <div className="text-sm text-gray-600">در حال بارگذاری...</div>
              )}
              {!!detailError && (
                <div className="text-sm text-red-600">{detailError}</div>
              )}
            </div>

            {detail && !detailLoading && !detailError && (
              <div className="px-4 pb-4 mt-2 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">استان / شهر</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.provinceName ?? "—"} / {detail.cityName ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">جنسیت</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.gender === 1
                      ? "مرد"
                      : detail.gender === 2
                      ? "زن"
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">تاریخ تولد</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {formatFaDate(detail.birthDate)}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">وضعیت تأهل</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.maritalStatus === 0
                      ? "مجرد"
                      : detail.maritalStatus === 1
                      ? "متأهل"
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">وضعیت سربازی</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.militaryStatus === 0
                      ? "معاف"
                      : detail.militaryStatus === 1
                      ? "در حال خدمت"
                      : detail.militaryStatus === 2
                      ? "انجام شده"
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">رشته تحصیلی</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.educationField ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">آخرین سمت شغلی</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.lastJobTitle ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">سابقه کار (سال)</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.workExperienceYears ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">لینکدین</div>
                  <div className="mt-1 font-semibold text-gray-900 break-all">
                    {detail.linkedInLink ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">سوشال</div>
                  <div className="mt-1 font-semibold text-gray-900 break-all">
                    {detail.socialLink ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2 md:col-span-2">
                  <div className="text-xs text-gray-500">معرفی</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.description ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">وضعیت درخواست</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.applicantStatusName ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-2">
                  <div className="text-xs text-gray-500">تاریخ ثبت</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {formatFaDateTime(detail.createdDate)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {imageOpen && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setImageOpen(false)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl border bg-white shadow-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-sm text-gray-600">نمایش بزرگ تصویر</div>
              <button
                type="button"
                onClick={() => setImageOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span>بستن</span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                    <path
                      fill="currentColor"
                      d="M7.05 6.34a1 1 0 011.41 0L12 9.88l3.54-3.54a1 1 0 111.41 1.41L13.41 11.3l3.54 3.54a1 1 0 01-1.41 1.41L12 12.71l-3.54 3.54a1 1 0 01-1.41-1.41l3.54-3.54-3.54-3.54a1 1 0 010-1.41z"
                    />
                  </svg>
                </span>
              </button>
            </div>
            {buildImageSrc(detail) ? (
              <div className="flex items-center justify-center">
                <img
                  src={buildImageSrc(detail) ?? ""}
                  alt="عکس متقاضی"
                  className="max-h-[75vh] w-auto rounded-xl border bg-white object-contain"
                />
              </div>
            ) : (
              <div className="text-sm text-gray-500">تصویر موجود نیست.</div>
            )}
          </div>
        </div>
      )}

      {statusEditOpen && selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !statusEditBusy && setStatusEditOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border bg-white shadow-lg p-4">
            <div className="text-sm text-gray-500">تغییر وضعیت درخواست</div>
            <div className="mt-1 font-semibold text-gray-900">
              {selected.applicantName ?? `درخواست #${selected.jobApplicationId ?? "—"}`}
            </div>

            <div className="mt-4 text-sm">
              <div className="text-gray-500">وضعیت فعلی</div>
              <div className="font-semibold text-gray-900 mt-1">
                {statusMap.get(Number(selected.applicationStatusId ?? 0)) ??
                  selected.applicationStatusName ??
                  "نامشخص"}
              </div>
            </div>

            <label className="mt-4 block text-sm">
              <div className="text-gray-500 mb-1">وضعیت جدید</div>
              <select
                value={nextStatusId}
                onChange={(e) => {
                  setNextStatusId(e.target.value);
                  setStatusEditError("");
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">انتخاب کنید</option>
                {statusOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm">
              <div className="text-gray-500 mb-1">کامنت تغییر وضعیت (اختیاری)</div>
              <textarea
                value={statusComment}
                onChange={(e) => {
                  setStatusComment(e.target.value);
                  setStatusEditError("");
                }}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            {!!statusEditError && (
              <div className="mt-3 text-sm text-red-600">{statusEditError}</div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusEditOpen(false)}
                disabled={statusEditBusy}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={submitStatusChange}
                disabled={statusEditBusy}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {statusEditBusy ? "در حال ذخیره..." : "ثبت تغییر وضعیت"}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyOpen && selected && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl border bg-white shadow-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-sm text-gray-500">سوابق تغییر وضعیت</div>
                <div className="font-semibold text-gray-900">
                  {selected.applicantName ?? `متقاضی #${selected.applicantId ?? "—"}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                بستن
              </button>
            </div>

            <div className="p-4 overflow-auto max-h-[60vh]">
              {historyLoading && (
                <div className="text-sm text-gray-600">در حال بارگذاری...</div>
              )}
              {!historyLoading && !!historyError && (
                <div className="text-sm text-red-600">{historyError}</div>
              )}
              {!historyLoading && !historyError && historyItems.length === 0 && (
                <div className="text-sm text-gray-600">
                  سابقه‌ای برای نمایش وجود ندارد.
                </div>
              )}
              {!historyLoading && !historyError && historyItems.length > 0 && (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-right">تاریخ</th>
                      <th className="px-3 py-2 text-right">وضعیت</th>
                      <th className="px-3 py-2 text-right">کاربر</th>
                      <th className="px-3 py-2 text-right">کامنت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((h, idx) => (
                      <tr key={`${h.id || idx}-${idx}`} className="border-t">
                        <td className="px-3 py-2">{formatFaDateTime(h.changedDate)}</td>
                        <td className="px-3 py-2">{h.applicantStatusName}</td>
                        <td className="px-3 py-2">{h.changedByUserName || "—"}</td>
                        <td className="px-3 py-2">{h.comment || "—"}</td>
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
