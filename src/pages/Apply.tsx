import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  apiFetch,
  pickApplicantId,
  throwIfNotOk,
} from "../api";

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

type EducationLevel = {
  educationLevelId?: number;
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

function normalizeEducationLevels(data: any): EducationLevel[] {
  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.educationLevels)
    ? data.educationLevels
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.result)
    ? data.result
    : [];
  return list
    .map((x) => ({
      educationLevelId: x?.educationLevelId ?? x?.id,
      title: x?.title ?? x?.name,
    }))
    .filter((x) => Number(x.educationLevelId) > 0);
}

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.floor(a / b) * b;
}

function jalCal(jy: number) {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;

  if (jy < jp || jy >= breaks[bl - 1]) return { leap: 0, gy, march: 0 };

  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (jy < 1 || jy > 3177) return false;
  if (jm < 1 || jm > 12) return false;
  if (jd < 1 || jd > jalaaliMonthLength(jy, jm)) return false;
  return true;
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function toGregorian(jy: number, jm: number, jd: number) {
  return d2g(j2d(jy, jm, jd));
}

function toEnglishDigits(value: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return value
    .split("")
    .map((ch) => {
      const faIndex = fa.indexOf(ch);
      if (faIndex >= 0) return String(faIndex);
      const arIndex = ar.indexOf(ch);
      if (arIndex >= 0) return String(arIndex);
      return ch;
    })
    .join("");
}

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizeMobileInput(value: string): string {
  const english = toEnglishDigits(value).trim();
  const withPlus = english.replace(/[^\d+]/g, "");
  if (!withPlus) return "";
  if (withPlus.startsWith("+")) {
    return `+${withPlus.slice(1).replace(/\+/g, "")}`.slice(0, 13);
  }
  return withPlus.replace(/\+/g, "").slice(0, 12);
}

function normalizeNationalCodeInput(value: string): string {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, 10);
}

function isValidIranMobile(value: string): boolean {
  const v = toEnglishDigits(value).replace(/[\s-]/g, "");
  return /^09\d{9}$/.test(v) || /^\+989\d{9}$/.test(v) || /^00989\d{9}$/.test(v);
}

function isValidIranNationalCode(value: string): boolean {
  const code = toEnglishDigits(value).replace(/\D/g, "");
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;

  const check = Number(code[9]);
  const sum = code
    .slice(0, 9)
    .split("")
    .reduce((acc, digit, idx) => acc + Number(digit) * (10 - idx), 0);
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
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

  // 4) جنسیت و تاریخ تولد
  const [gender, setGender] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [birthDay, setBirthDay] = useState<string>("");
  const [birthDateIso, setBirthDateIso] = useState<string>(""); // API

  // 5) وضعیت تاهل و وضعیت سربازی (زن disabled)
  const [maritalStatus, setMaritalStatus] = useState<string>("");
  const [militaryStatus, setMilitaryStatus] = useState<string>("");

  // 6) استان و شهر
  const [provinceId, setProvinceId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");

  // 7) مقطع و رشته تحصیلی
  const [educationLevelId, setEducationLevelId] = useState<string>("");
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
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const formContentRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // dropdown data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provincesLoadError, setProvincesLoadError] = useState<string>("");

  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoadError, setCitiesLoadError] = useState<string>("");
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [educationLevelsLoadError, setEducationLevelsLoadError] = useState("");

  const isFemale = gender === "2";

  useEffect(() => {
    if (isFemale) setMilitaryStatus("");
  }, [isFemale]);

  useEffect(() => {
    const scroller = formScrollRef.current;
    if (!scroller) return;

    const updateScrollHint = () => {
      const hiddenBottom =
        scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
      setShowScrollHint(hiddenBottom > 8);
    };

    updateScrollHint();
    scroller.addEventListener("scroll", updateScrollHint, { passive: true });
    window.addEventListener("resize", updateScrollHint);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollHint)
        : null;
    if (ro) {
      ro.observe(scroller);
      if (formContentRef.current) ro.observe(formContentRef.current);
    }

    return () => {
      scroller.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
      ro?.disconnect();
    };
  }, []);

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

        const g = await apiFetch<any>(`/api/Provinces`, {
          signal: controller.signal,
        });
        if (g?.res?.ok) {
          const norm = normalizeProvinces(g.data);
          if (norm.length) {
            setProvinces(norm);
            return;
          }
        }

        const p = await apiFetch<any>(`/api/Provinces`, {
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

        const g = await apiFetch<any>(`/api/Cities`, {
          signal: controller.signal,
        });
        if (g?.res?.ok) {
          const norm = normalizeCities(g.data);
          if (norm.length) {
            setCities(norm);
            return;
          }
        }

        const p = await apiFetch<any>(`/api/Cities`, {
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

  const currentJalaliYear = useMemo(() => {
    const y = toEnglishDigits(
      new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(
        new Date(),
      ),
    ).replace(/[^\d]/g, "");
    const n = Number(y);
    return Number.isFinite(n) && n > 1300 ? n : 1405;
  }, []);

  // Load education levels (GET then fallback POST {searchKey:""})
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setEducationLevelsLoadError("");

        const g = await apiFetch<any>(`/api/EducationLevels`, {
          signal: controller.signal,
        });
        if (g?.res?.ok) {
          const norm = normalizeEducationLevels(g.data);
          if (norm.length) {
            setEducationLevels(norm);
            return;
          }
        }

        const p = await apiFetch<any>(`/api/EducationLevels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchKey: "" }),
          signal: controller.signal,
        });
        if (p?.res?.ok) {
          setEducationLevels(normalizeEducationLevels(p.data));
          return;
        }

        setEducationLevelsLoadError("امکان دریافت لیست مقاطع تحصیلی وجود ندارد");
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setEducationLevelsLoadError(
            "امکان دریافت لیست مقاطع تحصیلی وجود ندارد",
          );
        }
      }
    })();
    return () => controller.abort();
  }, []);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentJalaliYear; y >= 1300; y -= 1) years.push(y);
    return years;
  }, [currentJalaliYear]);

  const monthOptions = useMemo(
    () => [
      { value: 1, label: "فروردین" },
      { value: 2, label: "اردیبهشت" },
      { value: 3, label: "خرداد" },
      { value: 4, label: "تیر" },
      { value: 5, label: "مرداد" },
      { value: 6, label: "شهریور" },
      { value: 7, label: "مهر" },
      { value: 8, label: "آبان" },
      { value: 9, label: "آذر" },
      { value: 10, label: "دی" },
      { value: 11, label: "بهمن" },
      { value: 12, label: "اسفند" },
    ],
    [],
  );

  const maxDay = useMemo(() => {
    const jy = toInt(birthYear);
    const jm = toInt(birthMonth);
    if (!jy || !jm) return 31;
    return jalaaliMonthLength(jy, jm);
  }, [birthYear, birthMonth]);

  const dayOptions = useMemo(() => {
    const days: number[] = [];
    for (let d = 1; d <= maxDay; d += 1) days.push(d);
    return days;
  }, [maxDay]);

  useEffect(() => {
    const d = toInt(birthDay);
    if (d && d > maxDay) {
      setBirthDay("");
      clearFieldError("birthDateIso");
    }
  }, [birthDay, maxDay]);

  useEffect(() => {
    const jy = toInt(birthYear);
    const jm = toInt(birthMonth);
    const jd = toInt(birthDay);
    if (!jy || !jm || !jd) {
      setBirthDateIso("");
      return;
    }
    if (!isValidJalaliDate(jy, jm, jd)) {
      setBirthDateIso("");
      return;
    }

    const g = toGregorian(jy, jm, jd);
    const birth = new Date(g.gy, g.gm - 1, g.gd);
    const today = new Date();
    const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (Number.isNaN(birth.getTime()) || birth > todayNoTime) {
      setBirthDateIso("");
      return;
    }
    const mm = String(g.gm).padStart(2, "0");
    const dd = String(g.gd).padStart(2, "0");
    setBirthDateIso(`${g.gy}-${mm}-${dd}T00:00:00`);
  }, [birthYear, birthMonth, birthDay]);

  async function resolveApplicantIdFromSearchKey(
    searchKey: string
  ): Promise<number | null> {
    if (!searchKey) return null;
    const { data, res } = await apiFetch<any>(`/api/Applicants`, {
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

  function getReadableApiError(e: any): string | null {
    const raw = e?.body;
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
      const parsed = JSON.parse(raw);
      const errors = parsed?.errors;
      if (errors && typeof errors === "object") {
        const all = Object.values(errors)
          .flatMap((v: any) => (Array.isArray(v) ? v : []))
          .filter((x: any) => typeof x === "string" && x.trim());
        if (all.length) return all.join(" | ");
      }
      if (typeof parsed?.detail === "string" && parsed.detail.trim()) {
        return parsed.detail;
      }
      if (typeof parsed?.message === "string" && parsed.message.trim()) {
        return parsed.message;
      }
      if (typeof parsed?.title === "string" && parsed.title.trim()) {
        return parsed.title;
      }
    } catch {
      if (/Access to the path .* is denied/i.test(raw)) {
        return "امکان ذخیره فایل روی سرور وجود ندارد (مجوز پوشه Uploads تنظیم نیست). لطفاً با مدیر سرور تماس بگیرید.";
      }
      return raw;
    }
    if (/Access to the path .* is denied/i.test(raw)) {
      return "امکان ذخیره فایل روی سرور وجود ندارد (مجوز پوشه Uploads تنظیم نیست). لطفاً با مدیر سرور تماس بگیرید.";
    }
    return raw;
  }

  function getFieldErrorMessage(field: string): string {
    if (!fieldErrors[field]) return "";
    if (field === "mobile") {
      if (!mobile.trim()) return "شماره موبایل الزامی است.";
      return "فرمت شماره موبایل معتبر نیست. مثال: 09123456789";
    }
    if (field === "email") {
      if (!email.trim()) return "ایمیل الزامی است.";
      return "فرمت ایمیل معتبر نیست.";
    }
    if (field === "nationalCode") return "کد ملی معتبر نیست.";
    return "";
  }

  function validateForm(): boolean {
    const e: Record<string, boolean> = {};
    const errorsText: string[] = [];

    const firstNameMissing = !firstName.trim();
    const lastNameMissing = !lastName.trim();
    const mobileMissing = !mobile.trim();
    const emailMissing = !email.trim();
    const genderMissing = !gender;
    const birthDateMissing = !birthDateIso;
    const provinceMissing = !provinceId;
    const cityMissing = !cityId;
    const educationLevelMissing = !educationLevelId;
    const imageMissing = !imageFile;
    const resumeMissing = !resumeFile;

    const mobileInvalid = !mobileMissing && !isValidIranMobile(mobile);
    const emailInvalid = !emailMissing && !isValidEmail(email);
    const nationalCodeInvalid =
      !!nationalCode.trim() && !isValidIranNationalCode(nationalCode);

    // required fields
    e.firstName = firstNameMissing;
    e.lastName = lastNameMissing;
    e.mobile = mobileMissing || mobileInvalid;
    e.email = emailMissing || emailInvalid;
    e.gender = genderMissing;
    e.birthDateIso = birthDateMissing;
    e.provinceId = provinceMissing;
    e.cityId = cityMissing;
    e.educationLevelId = educationLevelMissing;
    e.imageFile = imageMissing;
    e.resumeFile = resumeMissing;
    e.nationalCode = nationalCodeInvalid;

    // birthdate must not be in the future (if present)
    if (birthDateIso) {
      const bd = new Date(birthDateIso);
      if (Number.isNaN(bd.getTime()) || bd > new Date()) {
        e.birthDateIso = true;
      }
    }

    const compact = Object.fromEntries(Object.entries(e).filter(([, v]) => v));
    setFieldErrors(compact);

    if (mobileInvalid) {
      errorsText.push("فرمت شماره موبایل معتبر نیست. مثال: 09123456789");
    }
    if (emailInvalid) {
      errorsText.push("فرمت ایمیل معتبر نیست.");
    }
    if (nationalCodeInvalid) {
      errorsText.push("کد ملی معتبر نیست.");
    }
    if (
      firstNameMissing ||
      lastNameMissing ||
      mobileMissing ||
      emailMissing ||
      genderMissing ||
      birthDateMissing ||
      provinceMissing ||
      cityMissing ||
      educationLevelMissing ||
      imageMissing ||
      resumeMissing
    ) {
      errorsText.unshift("فیلدهای الزامی باید تکمیل شوند.");
    }
    if (errorsText.length) {
      setError(errorsText.join(" "));
    }

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
        `/api/Applicants/create`,
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
      return;
    }

    const prov = toInt(provinceId)!;
    const city = toInt(cityId)!;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("FirstName", firstName.trim());
      formData.append("LastName", lastName.trim());
      formData.append("JobGroupId", jobIdNum.toString());
      formData.append("ImageFile", imageFile);
      formData.append("ResumeFile", resumeFile);
      formData.append("ProvinceId", prov.toString());
      formData.append("CityId", city.toString());

      const mobileValue = mobile.trim();
      if (mobileValue) formData.append("Mobile", mobileValue);
      const nationalCodeValue = nationalCode.trim();
      if (nationalCodeValue) formData.append("NationalCode", nationalCodeValue);
      const emailValue = email.trim();
      if (emailValue) formData.append("Email", emailValue);
      const linkedInValue = linkedInLink.trim();
      if (linkedInValue) formData.append("LinkedInLink", linkedInValue);

      if (gender) formData.append("Gender", gender);
      if (birthDateIso) formData.append("BirthDate", birthDateIso);
      if (maritalStatus) formData.append("MaritalStatus", maritalStatus);
      if (!isFemale && militaryStatus)
        formData.append("MilitaryStatus", militaryStatus);
      if (educationLevelId) formData.append("EducationLevelId", educationLevelId);
      if (educationField.trim())
        formData.append("EducationField", educationField.trim());
      if (lastJobTitle.trim())
        formData.append("LastJobTitle", lastJobTitle.trim());
      if (workExperienceYears.trim())
        formData.append("WorkExperienceYears", workExperienceYears.trim());
      if (description.trim()) formData.append("Description", description.trim());

      const { data: applicantData, res: applicantRes } = await apiFetch<any>(
        `/api/Applicants/create`,
        {
          method: "POST",
          body: formData,
        },
      );
      await throwIfNotOk(applicantRes);
      void applicantData;

      setSuccess(true);
      setFieldErrors({});
      localStorage.setItem(`pma_applied_${jobIdNum}`, "true");
    } catch (e: any) {
      setError(
        getReadableApiError(e) ??
          e?.message ??
          "خطا در ثبت درخواست همکاری. لطفاً دوباره تلاش کنید."
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
      <div className="mx-auto max-w-6xl px-4 pt-3 pb-0">
        <div className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col max-h-[calc(100vh-44px)]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                ثبت درخواست همکاری
              </h1>
              <div className="mt-1 text-sm text-gray-600">
                رشته شغلی:{" "}
                <span className="font-semibold text-gray-800">
                  ({jobTitle || jobGroupId})
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="shrink-0 rounded-xl border bg-white px-4 py-1.5 text-sm hover:bg-gray-50"
            >
              بازگشت
            </button>
          </div>

          {alreadyApplied && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              به نظر می‌رسد برای این شغل قبلاً درخواست ثبت کرده‌اید.
            </div>
          )}

          <div ref={formScrollRef} className="mt-2 flex-1 overflow-y-auto pr-1">
          <div ref={formContentRef} className="grid grid-cols-1 gap-4">
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
                    setMobile(normalizeMobileInput(e.target.value));
                    clearFieldError("mobile");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.mobile ? "border-red-500" : ""
                  }`}
                  dir="ltr"
                />
                {!!getFieldErrorMessage("mobile") && (
                  <div className="mt-1 text-xs text-red-600">
                    {getFieldErrorMessage("mobile")}
                  </div>
                )}
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">کد ملی</div>
                <input
                  value={nationalCode}
                  onChange={(e) => {
                    setNationalCode(normalizeNationalCodeInput(e.target.value));
                    clearFieldError("nationalCode");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.nationalCode ? "border-red-500" : ""
                  }`}
                  dir="ltr"
                />
                {!!getFieldErrorMessage("nationalCode") && (
                  <div className="mt-1 text-xs text-red-600">
                    {getFieldErrorMessage("nationalCode")}
                  </div>
                )}
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
                    fieldErrors.email ? "border-red-500" : ""
                  }`}
                  type="email"
                  dir="ltr"
                />
                {!!getFieldErrorMessage("email") && (
                  <div className="mt-1 text-xs text-red-600">
                    {getFieldErrorMessage("email")}
                  </div>
                )}
              </label>

              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  لینک لینکدین
                </div>
                <input
                  value={linkedInLink}
                  onChange={(e) => setLinkedInLink(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
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
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthYear}
                    onChange={(e) => {
                      setBirthYear(e.target.value);
                      clearFieldError("birthDateIso");
                    }}
                    className={`w-full rounded-xl border px-2 py-2 text-sm ${
                      fieldErrors.birthDateIso ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">سال</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <select
                    value={birthMonth}
                    onChange={(e) => {
                      setBirthMonth(e.target.value);
                      clearFieldError("birthDateIso");
                    }}
                    className={`w-full rounded-xl border px-2 py-2 text-sm ${
                      fieldErrors.birthDateIso ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">ماه</option>
                    {monthOptions.map((m) => (
                      <option key={m.value} value={String(m.value)}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={birthDay}
                    onChange={(e) => {
                      setBirthDay(e.target.value);
                      clearFieldError("birthDateIso");
                    }}
                    className={`w-full rounded-xl border px-2 py-2 text-sm ${
                      fieldErrors.birthDateIso ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">روز</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={String(d)}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
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

            {/* 7) مقطع و رشته تحصیلی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  مقطع تحصیلی <span className="text-red-600">*</span>
                </div>
                <select
                  value={educationLevelId}
                  onChange={(e) => {
                    setEducationLevelId(e.target.value);
                    clearFieldError("educationLevelId");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    fieldErrors.educationLevelId ? "border-red-500" : ""
                  }`}
                  disabled={educationLevels.length === 0}
                >
                  <option value="">
                    {educationLevels.length ? "انتخاب کنید" : "در حال دریافت..."}
                  </option>
                  {educationLevels.map((x, idx) => (
                    <option key={idx} value={String(x.educationLevelId)}>
                      {x.title ?? `مقطع ${x.educationLevelId}`}
                    </option>
                  ))}
                </select>
                {educationLevelsLoadError && (
                  <div className="mt-1 text-xs text-gray-500">
                    {educationLevelsLoadError}
                  </div>
                )}
              </label>
              <label className="text-sm">
                <div className="mb-1 font-semibold text-gray-800">
                  رشته تحصیلی
                </div>
                <input
                  value={educationField}
                  onChange={(e) => setEducationField(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>
            </div>

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
          </div>

          {showScrollHint && (
            <div className="mt-1 text-center text-[11px] text-gray-400">
              ادامه فرم پایین صفحه است
            </div>
          )}

          <div className="mt-2 border-t bg-white pt-3">
            {!!error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
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
