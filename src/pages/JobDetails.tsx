import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { JobGroup } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function splitBullets(text?: string | null) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function RemoteRibbon() {
  return (
    <div className="absolute top-0 left-0 overflow-hidden h-20 w-20 pointer-events-none">
      <div className="absolute top-4 -left-8 -rotate-45 bg-emerald-600 text-white text-xs font-bold px-10 py-1 shadow-md">
        دورکاری
      </div>
    </div>
  );
}

function Section({ title, bullets }: { title: string; bullets: string[] }) {
  if (!bullets.length) return null;
  return (
    <div className="mt-6">
      <div className="text-sm font-bold text-gray-900 mb-2">{title}</div>
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
        {bullets.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    console.log("API Base URL JobDetail:", import.meta.env.VITE_API_BASE_URL);

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/JobGroups/${id}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
        }

        const data = (await res.json()) as JobGroup;
        setJob(data);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError(e?.message ?? "خطا در دریافت اطلاعات");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  // hint: فقط اگر صفحه اسکرول‌پذیر باشد و کاربر هنوز اسکرول نکرده
  useEffect(() => {
    const check = () => {
      const canScroll =
        document.documentElement.scrollHeight > window.innerHeight + 4;
      const atTop = window.scrollY < 4;
      setShowScrollHint(canScroll && atTop);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [job]);

  const descBullets = useMemo(
    () => splitBullets(job?.description ?? null),
    [job?.description]
  );
  const reqBullets = useMemo(
    () => splitBullets(job?.jobRequirements ?? null),
    [job?.jobRequirements]
  );
  const benBullets = useMemo(
    () => splitBullets(job?.benefits ?? null),
    [job?.benefits]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* padding-bottom برای اینکه محتوا زیر CTA نره */}
      <div className="mx-auto max-w-4xl px-4 py-8 pb-28">
        {/* بازگشت: در RTL برای رفتن به سمت چپ باید justify-end باشد */}
        <div className="mb-5 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            بازگشت
          </button>
        </div>

        <div className="relative rounded-2xl border bg-white p-6 shadow-sm">
          {!loading && !error && job?.isRemoteAllowed === true && (
            <RemoteRibbon />
          )}

          {loading && (
            <div className="text-sm text-gray-700">در حال بارگذاری...</div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              خطا: {error}
            </div>
          )}

          {!loading && !error && job && (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-snug">
                {job.title ?? "بدون عنوان"}
              </h1>

              {/* مشخصات جمع‌وجور (ارتفاع کمتر) */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">شهر</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {job.cityName ?? "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">حداقل سابقه کاری</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {job.minWorkExperience == null
                      ? "—"
                      : `${job.minWorkExperience} سال`}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">حداقل مدرک تحصیلی</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {job.educationLevelName ?? job.minEducationLevelId ?? "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">نوع استخدام</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {job.employmentTypeName ?? job.employmentTypeId ?? "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">امکان دورکاری</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {job.isRemoteAllowed === true ? "بلی" : "خیر"}
                  </div>
                </div>
              </div>

              {/* سه بخش متنی، مثل شرح شغل */}
              <Section title="شرح شغل" bullets={descBullets} />
              <Section title="شرایط احراز" bullets={reqBullets} />
              <Section title="مزایای شغلی" bullets={benBullets} />
            </>
          )}
        </div>
      </div>

      {/* CTA ثابت پایین */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-white/90 backdrop-blur">
        {/* لایه محو برای حس «ادامه دارد» */}
        <div className="pointer-events-none absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-white/90 to-transparent" />

        <div className="mx-auto max-w-4xl px-4 py-3">
          {showScrollHint && (
            <div className="mb-2 text-center text-xs text-gray-500">
              برای دیدن ادامه صفحه اسکرول کنید ↓
            </div>
          )}

          <button
            onClick={() => navigate(`/apply/${id}`)}
            className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
          >
            درخواست همکاری
          </button>
        </div>
      </div>
    </div>
  );
}
