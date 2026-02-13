import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { API_BASE, apiFetch } from "../api";

type CaptchaState = {
  captchaId: string;
  secret: string;
  imageUrl: string;
};

function normalizeCaptcha(data: any): Omit<CaptchaState, "imageUrl"> {
  return {
    captchaId: String(
      data?.captchaId ?? data?.captchaID ?? data?.id ?? data?.captchaKey ?? "",
    ).trim(),
    secret: String(
      data?.secret ?? data?.captchaSecret ?? data?.captchaToken ?? "",
    ).trim(),
  };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaState | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshCaptcha();
  }, []);

  async function refreshCaptcha() {
    setCaptchaLoading(true);
    try {
      const { data, res } = await apiFetch<any>(`/api/Captcha`, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const base = normalizeCaptcha(data);
      if (!base.captchaId) throw new Error("captchaId دریافت نشد");

      let imageUrl = "";
      const ct = data?.imageContentType || data?.contentType || "image/png";
      const b64 = data?.imageBase64 || data?.captchaImageBase64;
      if (typeof b64 === "string" && b64.trim()) {
        imageUrl = `data:${ct};base64,${b64}`;
      } else {
        imageUrl =
          data?.imageUrl ||
          data?.captchaImageUrl ||
          `${API_BASE}/api/Captcha/image?captchaId=${encodeURIComponent(
            base.captchaId,
          )}&t=${Date.now()}`;
      }

      setCaptcha({
        captchaId: base.captchaId,
        secret: base.secret,
        imageUrl,
      });
      setCaptchaInput("");
    } catch (e: any) {
      setCaptcha(null);
      setError(e?.message ?? "خطا در دریافت کپچا");
    } finally {
      setCaptchaLoading(false);
    }
  }

  const canSubmit = useMemo(() => {
    return (
      username.trim() &&
      password &&
      captchaInput.trim() &&
      captcha?.captchaId &&
      !submitting
    );
  }, [username, password, captchaInput, captcha?.captchaId, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!captcha?.captchaId) {
      setError("کپچا آماده نیست.");
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password, {
        captchaId: captcha.captchaId,
        captchaValue: captchaInput.trim().toUpperCase(),
        secret: captcha.secret || undefined,
      });
      const next = location?.state?.from?.pathname || "/admin";
      navigate(next, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "ورود ناموفق بود.");
      await refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-extrabold text-gray-900">ورود</h1>
          <p className="mt-1 text-sm text-gray-600">
            برای دسترسی به بخش مدیریت وارد شوید.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="text-sm block">
              <div className="mb-1 font-semibold text-gray-800">
                نام کاربری
              </div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                autoComplete="username"
                dir="ltr"
              />
            </label>

            <label className="text-sm block">
              <div className="mb-1 font-semibold text-gray-800">رمز عبور</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                type="password"
                autoComplete="current-password"
                dir="ltr"
              />
            </label>

            <div className="text-sm">
              <div className="mb-1 font-semibold text-gray-800">کد امنیتی</div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-[140px] rounded-lg border bg-white overflow-hidden flex items-center justify-center">
                  {captchaLoading ? (
                    <span className="text-xs text-gray-500">در حال دریافت...</span>
                  ) : captcha?.imageUrl ? (
                    <img
                      src={captcha.imageUrl}
                      alt="captcha"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-red-600">خطا</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
                >
                  تازه‌سازی
                </button>
              </div>
              <input
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="کد بالا را وارد کنید"
                dir="ltr"
              />
            </div>

            {!!error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "در حال ورود..." : "ورود"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
