import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const CAPTCHA_LEN = 5;
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCaptcha() {
  let out = "";
  for (let i = 0; i < CAPTCHA_LEN; i += 1) {
    out += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return out;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaText, setCaptchaText] = useState<string>(() => randomCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);

    // noise lines
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = `rgba(59,130,246,${0.3 + i * 0.15})`;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.lineTo(w, Math.random() * h);
      ctx.stroke();
    }

    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#1f2937";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(captchaText, w / 2, h / 2);
  }, [captchaText]);

  const canSubmit = useMemo(() => {
    return (
      username.trim() &&
      password &&
      captchaInput.trim() &&
      !submitting
    );
  }, [username, password, captchaInput, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!import.meta.env.DEV) {
      if (
        captchaInput.trim().toUpperCase() !== captchaText.trim().toUpperCase()
      ) {
        setError("کد امنیتی نادرست است.");
        setCaptchaText(randomCaptcha());
        setCaptchaInput("");
        return;
      }
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      const next = location?.state?.from?.pathname || "/admin";
      navigate(next, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "ورود ناموفق بود.");
      setCaptchaText(randomCaptcha());
      setCaptchaInput("");
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
                <canvas
                  ref={canvasRef}
                  width={140}
                  height={48}
                  className="rounded-lg border bg-white"
                />
                <button
                  type="button"
                  onClick={() => setCaptchaText(randomCaptcha())}
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
