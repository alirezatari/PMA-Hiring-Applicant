import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, pickApplicantId, throwIfNotOk } from "../api";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { DateObject } from "react-multi-date-picker";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

type City = {
  cityId?: number;
  id?: number;
  title?: string;
  name?: string;
  provinceId?: number;
  provinceID?: number;
  province?: { provinceId?: number; id?: number };
};

type Province = {
  provinceId?: number;
  id?: number;
  title?: string;
  name?: string;
};

function toInt(v: string): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (Math.floor(n) !== n) return undefined;
  return n;
}

const GENDER_OPTIONS = [
  { value: 1, label: "مرد" },
  { value: 2, label: "زن" },
];

const MARITAL_OPTIONS = [
  { value: 0, label: "مجرد" },
  { value: 1, label: "متأهل" },
];

const MILITARY_OPTIONS = [
  { value: 0, label: "معاف" },
  { value: 1, label: "در حال خدمت" },
  { value: 2, label: "انجام شده" },
];

function normalizeProvinces(data: any): Province[] {
  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.provinces)
    ? data.provinces
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.result)
    ? data.result
    : [];
  return list
    .map((x) => ({
      provinceId: x?.provinceId ?? x?.id,
      title: x?.title ?? x?.name,
    }))
    .filter((x) => Number(x.provinceId) >= 0);
}

function normalizeCities(data: any): City[] {
  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.cities)
    ? data.cities
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.result)
    ? data.result
    : [];
  return list
    .map((x) => ({
      cityId: x?.cityId ?? x?.id,
      title: x?.title ?? x?.name,
      provinceId:
        x?.provinceId ??
        x?.provinceID ??
        x?.province?.provinceId ??
        x?.province?.id,
    }))
    .filter((x) => Number(x.cityId) > 0);
}

// /**
//  * Reads a file as Base64 *string only* (no "data:*/*;base64," prefix)
//  */

export default function Apply() {
  const { jobGroupId } = useParams<{ jobGroupId: string }>();
  const navigate = useNavigate();
  const jobIdNum = useMemo(() => toInt(jobGroupId ?? ""), [jobGroupId]);

  const [jobTitle, setJobTitle] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  // ✅ ترتیب فرم طبق خواسته شما
  // 1) نام و نام خانوادگی
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // 2) موبایل و کد ملی
  const [mobile, setMobile] = useState("");
  const [nationalCode, setNationalCode] = useState("");

  // 3) ایمیل و لینکدین
  const [email, setEmail] = useState("");
  const [linkedInLink, setLinkedInLink] = useState("");

  // 4) جنسیت و تاریخ تولد (فقط با picker پر می‌شود)
  const [gender, setGender] = useState<string>("");
  const [birthDateJalali, setBirthDateJalali] = useState<string>(""); // UI
  const [birthDateIso, setBirthDateIso] = useState<string>(""); // API

  // 5) وضعیت تاهل و وضعیت سربازی (زن disabled)
  const [maritalStatus, setMaritalStatus] = useState<string>("");
  const [militaryStatus, setMilitaryStatus] = useState<string>("");

  // 6) استان و شهر
  const [provinceId, setProvinceId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");

  // 7) رشته تحصیلی
  const [educationField, setEducationField] = useState("");

  // 8) آخرین سمت شغلی و مدت سابقه
  const [lastJobTitle, setLastJobTitle] = useState("");
  const [workExperienceYears, setWorkExperienceYears] = useState<string>("");

  // 9) معرفی
  const [description, setDescription] = useState("");

  // 10) عکس پرسنلی و رزومه
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const birthDatePickerRef = useRef<any>(null);
  const birthOpenJustNowRef = useRef(false);

  // dropdown data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provincesLoadError, setProvincesLoadError] = useState<string>("");

  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoadError, setCitiesLoadError] = useState<string>("");

  const isFemale = gender === "2";

  useEffect(() => {
    if (isFemale) setMilitaryStatus("");
  }, [isFemale]);

  // Load job title for header (best-effort)
  useEffect(() => {
    console.log("API Base URL Apply:", import.meta.env.VITE_API_BASE_URL);

    const id = jobIdNum;
    if (!id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/JobGroups`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list: any[] = Array.isArray(data?.jobGroups)
          ? data.jobGroups
          : Array.isArray(data)
          ? data
          : [];
        const found = list.find((x) => Number(x?.jobGroupId ?? x?.id) === id);
        const title = found?.title ?? found?.name ?? found?.jobGroupTitle ?? "";
        if (typeof title === "string") setJobTitle(title);
      } catch {
        // ignore
      }
    })();
    return () => controller.abort();
  }, [jobIdNum]); // Load provinces (GET then fallback POST {searchKey:""})
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setProvincesLoadError("");

        const g = await apiFetch<any>(`${API_BASE}/api/Provinces`, {
          signal: controller.signal,
        });
        if (g?.res?.ok) {
          const norm = normalizeProvinces(g.data);
          if (norm.length) {
            setProvinces(norm);
            return;
          }
        }

        const p = await apiFetch<any>(`${API_BASE}/api/Provinces`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchKey: "" }),
          signal: controller.signal,
        });
        if (p?.res?.ok) {
          setProvinces(normalizeProvinces(p.data));
          return;
        }

        setProvincesLoadError("امکان دریافت لیست استان‌ها وجود ندارد");
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setProvincesLoadError("امکان دریافت لیست استان‌ها وجود ندارد");
      }
    })();
    return () => controller.abort();
  }, []);

  // Load cities (GET then fallback POST {searchKey:""})
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setCitiesLoadError("");

        const g = await apiFetch<any>(`${API_BASE}/api/Cities`, {
          signal: controller.signal,
        });
        if (g?.res?.ok) {
          const norm = normalizeCities(g.data);
          if (norm.length) {
            setCities(norm);
            return;
          }
        }

        const p = await apiFetch<any>(`${API_BASE}/api/Cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchKey: "" }),
          signal: controller.signal,
        });
        if (p?.res?.ok) {
          setCities(normalizeCities(p.data));
          return;
        }

        setCitiesLoadError("امکان دریافت لیست شهرها وجود ندارد");
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setCitiesLoadError("امکان دریافت لیست شهرها وجود ندارد");
      }
    })();
    return () => controller.abort();
  }, []);

  const filteredCities = useMemo(() => {
    const pid = toInt(provinceId);
    if (pid == null) return cities;
    const subset = cities.filter((c) => Number(c.provinceId) === pid);
    return subset.length ? subset : cities;
  }, [provinceId, cities]);

  async function resolveApplicantIdFromSearchKey(
    searchKey: string
  ): Promise<number | null> {
    if (!searchKey) return null;
    const { data, res } = await apiFetch<any>(`${API_BASE}/api/Applicants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchKey }),
    });
    if (!res.ok) return null;

    const list: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.applicants)
      ? data.applicants
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.result)
      ? data.result
      : [];

    return pickApplicantId(list[0]);
  }

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateForm(): boolean {
    const e: Record<string, boolean> = {};

    // required fields
    e.firstName = !firstName.trim();
    e.lastName = !lastName.trim();
    e.mobile = !mobile.trim();
    e.email = !email.trim();
    e.gender = !gender;
    e.birthDateIso = !birthDateIso;
    e.provinceId = !provinceId;
    e.cityId = !cityId;
    e.imageFile = !imageFile;
    e.resumeFile = !resumeFile;

    // birthdate must not be in the future (if present)
    if (birthDateIso) {
      const bd = new Date(birthDateIso);
      if (Number.isNaN(bd.getTime()) || bd > new Date()) {
        e.birthDateIso = true;
      }
    }

    const compact = Object.fromEntries(Object.entries(e).filter(([, v]) => v));
    setFieldErrors(compact);

    return Object.keys(compact).length === 0;
  }

  async function onSubmit_bad() {
    if (!jobIdNum) {
      setError("شناسه شغل نامعتبر است.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("نام و نام خانوادگی الزامی است.");
      return;
    }

    const prov = toInt(provinceId);
    const city = toInt(cityId);
    if (!prov || !city) {
      setError("استان و شهر را انتخاب کنید.");
      return;
    }

    if (!imageFile) {
      setError("آپلود عکس پرسنلی الزامی است.");
      return;
    }
    if (!resumeFile) {
      setError("آپلود فایل رزومه الزامی است.");
      return;
    }

    if (imageFile.size > 1 * 1024 * 1024) {
      setError("حداکثر حجم عکس 1MB است.");
      return;
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
      setError("حداکثر حجم رزومه 5MB است.");
      return;
    }
    setSubmitting(true);

    try {
      // طبق Swagger جدید، /api/Applicants/create فقط multipart/form-data می‌پذیرد
      // و فیلدها PascalCase هستند (FirstName, LastName, ResumeFile, ImageFile, ...).
      // اگر JSON بفرستیم معمولاً 415 (Unsupported Media Type) یا 400 می‌گیریم.

      const form = new FormData();

      // required
      form.append("FirstName", firstName.trim());
      form.append("LastName", lastName.trim());
      form.append("JobGroupId", String(jobIdNum));
      form.append("ResumeFile", resumeFile);
      form.append("ImageFile", imageFile);

      // optional strings
      if (email.trim()) form.append("Email", email.trim());
      if (mobile.trim()) form.append("Mobile", mobile.trim());
      if (nationalCode.trim()) form.append("NationalCode", nationalCode.trim());
      if (linkedInLink.trim()) form.append("LinkedInLink", linkedInLink.trim());
      if (educationField.trim())
        form.append("EducationField", educationField.trim());
      if (lastJobTitle.trim()) form.append("LastJobTitle", lastJobTitle.trim());
      if (description.trim()) form.append("Description", description.trim());

      // optional numbers/dates (همه به صورت string در FormData ارسال می‌شوند)
      if (prov) form.append("ProvinceId", String(prov));
      if (city) form.append("CityId", String(city));
      const g = toInt(gender);
      if (g != null) form.append("Gender", String(g));
      if (birthDateIso) form.append("BirthDate", birthDateIso);

      const wey = toInt(workExperienceYears);
      if (wey != null) form.append("WorkExperienceYears", String(wey));

      const ms = toInt(maritalStatus);
      if (ms != null) form.append("MaritalStatus", String(ms));

      // زن disabled (ارسال نمی‌شود)
      if (!isFemale) {
        const mil = toInt(militaryStatus);
        if (mil != null) form.append("MilitaryStatus", String(mil));
      }

      const { data: applicantResp, res: applicantRes } = await apiFetch<any>(
        `${API_BASE}/api/Applicants/create`,
        {
          method: "POST",
          body: form,
        }
      );
      await throwIfNotOk(applicantRes);

      let applicantId = pickApplicantId(applicantResp);

      if (!applicantId) {
        const key = mobile.trim() || nationalCode.trim() || email.trim();
        applicantId = await resolveApplicantIdFromSearchKey(key);
      }

      if (!applicantId) {
        throw new Error("ثبت انجام شد، اما شناسه متقاضی از سرور دریافت نشد.");
      }

      setSuccess(true);
      localStorage.setItem(`pma_applied_${jobIdNum}`, "true");
    } catch (e: any) {
      setError(
        e?.message ??
          e?.body ??
          "خطا در ثبت درخواست همکاری. لطفاً دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit() {
    if (!jobIdNum) {
      setError("شناسه شغل نامعتبر است.");
      return;
    }

    setError("");
    if (!validateForm()) {
      setError("فیلدهای الزامی باید تکمیل شوند.");
      return;
    }

    const prov = toInt(provinceId)!;
    const city = toInt(cityId)!;

    setSubmitting(true);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("mobile", mobile.trim() || "");
      formData.append("nationalCode", nationalCode.trim() || "");
      formData.append("email", email.trim() || "");
      formData.append("linkedInLink", linkedInLink.trim() || "");
      formData.append("provinceId", prov.toString());
      formData.append("cityId", city.toString());
      formData.append("jobGroupId", jobIdNum.toString());
      formData.append("imageFile", imageFile);
      formData.append("resumeFile", resumeFile);

      // اضافه کردن فیلدهای دیگر در صورت نیاز
      if (gender) formData.append("gender", gender);
      if (birthDateIso) formData.append("birthDate", birthDateIso);
      if (maritalStatus) formData.append("maritalStatus", maritalStatus);
      if (militaryStatus) formData.append("militaryStatus", militaryStatus);
      if (educationField) formData.append("educationField", educationField);
      if (lastJobTitle) formData.append("lastJobTitle", lastJobTitle);
      if (workExperienceYears)
        formData.append("workExperienceYears", workExperienceYears);
      if (description) formData.append("description", description);

      const response = await apiFetch<any>(
        `${API_BASE}/api/Applicants/create`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response?.res?.ok) {
        setSuccess(true);
        setFieldErrors({});
        localStorage.setItem(`pma_applied_${jobIdNum}`, "true");
      } else {
        setError("خطا در ثبت درخواست همکاری.");
      }
    } catch (e) {
      setError(
        e?.message ?? "خطا در ثبت درخواست همکاری. لطفاً دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-extrabold text-gray-900">ثبت شد ✅</h1>
            <p className="mt-3 text-sm text-gray-700 leading-7">
              درخواست همکاری شما با موفقیت ثبت شد. در صورت نیاز با شما تماس
              گرفته خواهد شد.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => navigate("/")}
                className="rounded-2xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
              >
                بازگشت به لیست مشاغل
              </button>
              <button
                onClick={() => navigate(-1)}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                مشاهده مجدد جزئیات شغل
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const alreadyApplied = jobIdNum
    ? localStorage.getItem(`pma_applied_${jobIdNum}`) === "true"
    : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            بازگشت
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-extrabold text-gray-900">
            ثبت درخواست همکاری
          </h1>
          <div className="mt-2 text-sm text-gray-600">
            رشته شغلی:{" "}
            <span className="font-semibold text-gray-800">
              ({jobTitle || jobGroupId})
            </span>
          </div>

          {alreadyApplied && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              به نظر می‌رسد برای این شغل قبلاً درخواست ثبت کرده‌اید.
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4">
            {/* 1) نام و نام خانوادگی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">نام *</div>
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError("firstName");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.firstName ? "border-red-500" : ""
                  }`}
                  placeholder="مثلاً زهرا"
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  نام خانوادگی *
                </div>
                <input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError("lastName");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.lastName ? "border-red-500" : ""
                  }`}
                  placeholder="مثلاً محمدی"
                />
              </label>
            </div>

            {/* 2) موبایل و کد ملی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">موبایل *</div>
                <input
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    clearFieldError("mobile");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.mobile ? "border-red-500" : ""
                  }`}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">کد ملی</div>
                <input
                  value={nationalCode}
                  onChange={(e) => setNationalCode(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.email ? "border-red-500" : ""
                  }`}
                  placeholder="xxxxxxxxxx"
                  dir="ltr"
                />
              </label>
            </div>

            {/* 3) ایمیل و لینکدین */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">ایمیل *</div>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.gender ? "border-red-500" : ""
                  }`}
                  placeholder="name@example.com"
                  type="email"
                  dir="ltr"
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  لینک لینکدین
                </div>
                <input
                  value={linkedInLink}
                  onChange={(e) => setLinkedInLink(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="https://linkedin.com/in/..."
                  dir="ltr"
                />
              </label>
            </div>

            {/* 4) جنسیت و تاریخ تولد */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">جنسیت *</div>
                <select
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value);
                    clearFieldError("gender");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.gender ? "border-red-500" : ""
                  }`}
                >
                  <option value="">انتخاب کنید</option>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  تاریخ تولد *
                </div>
                <DatePicker
                  ref={birthDatePickerRef}
                  calendar={persian}
                  locale={persian_fa}
                  value={birthDateJalali ? birthDateJalali : undefined} // فقط وقتی مقدار داریم نشون بده
                  onChange={(date: DateObject | null) => {
                    // جلوگیری از انتخاب خودکار تاریخ امروز در اولین کلیک وقتی مقدار خالی است
                    if (birthOpenJustNowRef.current && !birthDateJalali) {
                      birthOpenJustNowRef.current = false;
                      return;
                    }
                    birthOpenJustNowRef.current = false;

                    if (!date) {
                      setBirthDateJalali("");
                      setBirthDateIso("");
                      return;
                    }

                    const jalaliStr = date.format("YYYY/MM/DD");
                    setBirthDateJalali(jalaliStr);
                    setBirthDateIso(date.toDate().toISOString());

                    clearFieldError("birthDateIso");

                    setTimeout(() => {
                      birthDatePickerRef.current?.closeCalendar?.();
                    }, 100);
                  }}
                  format="YYYY/MM/DD"
                  calendarPosition="bottom-right"
                  containerStyle={{ width: "100%" }}
                  // مهم‌ترین بخش: جلوگیری از انتخاب خودکار امروز
                  disableDayPicker={false} // معمولاً لازم نیست اما برای اطمینان
                  // اگر نسخه‌ات اجازه می‌دهد:
                  // highlightToday={false}          // اگر prop وجود داشت (بعضی نسخه‌ها دارند)
                  render={(value, openCalendar) => (
                    <input
                      value={birthDateJalali || ""}
                      readOnly
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!birthDateJalali)
                          birthOpenJustNowRef.current = true;
                        openCalendar();
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        fieldErrors.birthDateIso ? "border-red-500" : ""
                      }`}
                      placeholder="انتخاب تاریخ"
                      dir="ltr"
                    />
                  )}
                />
              </label>
            </div>
            {/* 5) وضعیت تاهل و وضعیت سربازی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  وضعیت تأهل
                </div>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="">انتخاب کنید</option>
                  {MARITAL_OPTIONS.map((o) => (
                    <option key={o.value} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  وضعیت سربازی
                </div>
                <select
                  value={militaryStatus}
                  onChange={(e) => setMilitaryStatus(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isFemale}
                >
                  <option value="">
                    {isFemale ? "برای بانوان غیرفعال است" : "انتخاب کنید"}
                  </option>
                  {MILITARY_OPTIONS.map((o) => (
                    <option key={o.value} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* 6) استان و شهر */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  استان محل سکونت *
                </div>
                <select
                  value={provinceId}
                  onChange={(e) => {
                    setProvinceId(e.target.value);
                    setCityId("");
                    clearFieldError("provinceId");
                    clearFieldError("cityId");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.provinceId ? "border-red-500" : ""
                  }`}
                  disabled={provinces.length === 0}
                >
                  <option value="">
                    {provinces.length ? "انتخاب کنید" : "در حال دریافت..."}
                  </option>
                  {provinces.map((p, idx) => (
                    <option key={idx} value={String(p.provinceId)}>
                      {p.title ?? `استان ${p.provinceId}`}
                    </option>
                  ))}
                </select>
                {provincesLoadError && (
                  <div className="mt-1 text-xs text-gray-500">
                    {provincesLoadError}
                  </div>
                )}
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  شهر محل سکونت *
                </div>
                <select
                  value={cityId}
                  onChange={(e) => {
                    setCityId(e.target.value);
                    clearFieldError("cityId");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.cityId ? "border-red-500" : ""
                  }`}
                  disabled={cities.length === 0 || !provinceId}
                >
                  <option value="">
                    {cities.length === 0
                      ? "در حال دریافت..."
                      : !provinceId
                      ? "ابتدا استان را انتخاب کنید"
                      : "انتخاب کنید"}
                  </option>
                  {filteredCities.map((c, idx) => (
                    <option key={idx} value={String(c.cityId)}>
                      {c.title ?? `شهر ${c.cityId}`}
                    </option>
                  ))}
                </select>
                {citiesLoadError && (
                  <div className="mt-1 text-xs text-gray-500">
                    {citiesLoadError}
                  </div>
                )}
              </label>
            </div>

            {/* 7) رشته تحصیلی */}
            <label className="text-sm">
              <div className="mb-1 font-semibold text-gray-800">
                رشته تحصیلی
              </div>
              <input
                value={educationField}
                onChange={(e) => setEducationField(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="مثلاً مهندسی نرم‌افزار"
              />
            </label>

            {/* 8) آخرین سمت شغلی و مدت سابقه */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="text-sm sm:col-span-2">
                <div className="mb-1 font-semibold text-gray-800">
                  آخرین سمت شغلی
                </div>
                <input
                  value={lastJobTitle}
                  onChange={(e) => setLastJobTitle(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="مثلاً کارشناس فروش"
                />
              </label>

              <label className="text-sm sm:col-span-1">
                <div className="mb-1 font-semibold text-gray-800">
                  مدت سابقه (سال)
                </div>
                <input
                  value={workExperienceYears}
                  onChange={(e) => setWorkExperienceYears(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="مثلاً 3"
                  dir="ltr"
                />
              </label>
            </div>

            {/* 9) معرفی */}
            <label className="text-sm">
              <div className="mb-1 font-semibold text-gray-800">معرفی</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="چند خط درباره خودتان"
                rows={4}
              />
            </label>

            {/* 10) عکس پرسنلی و رزومه (دکمه خوشگل) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* image */}
              <div
                className={`rounded-2xl border p-4 ${
                  fieldErrors.imageFile ? "border-red-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">
                      عکس پرسنلی *
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      حداکثر حجم 1MB
                    </div>
                    {imageFile && (
                      <div className="mt-2 text-xs text-gray-700" dir="ltr">
                        {imageFile.name}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    انتخاب عکس
                  </button>
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 1 * 1024 * 1024) {
                      setError("حداکثر حجم عکس 1MB است.");
                      e.target.value = "";
                      setImageFile(null);
                      return;
                    }
                    setImageFile(f);
                    if (f) clearFieldError("imageFile");
                  }}
                />

                {imageFile && (
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="mt-3 text-xs text-red-600 hover:underline"
                  >
                    حذف عکس
                  </button>
                )}
              </div>

              {/* resume */}
              <div
                className={`rounded-2xl border p-4 ${
                  fieldErrors.resumeFile ? "border-red-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">
                      رزومه *
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      حداکثر حجم 5MB
                    </div>
                    {resumeFile && (
                      <div className="mt-2 text-xs text-gray-700" dir="ltr">
                        {resumeFile.name}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    انتخاب رزومه
                  </button>
                </div>

                <input
                  ref={resumeInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 5 * 1024 * 1024) {
                      setError("حداکثر حجم رزومه 5MB است.");
                      e.target.value = "";
                      setResumeFile(null);
                      return;
                    }
                    setResumeFile(f);
                    if (f) clearFieldError("resumeFile");
                  }}
                />

                {resumeFile && (
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="mt-3 text-xs text-red-600 hover:underline"
                  >
                    حذف رزومه
                  </button>
                )}
              </div>
            </div>
          </div>

          {!!error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "ثبت درخواست"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
