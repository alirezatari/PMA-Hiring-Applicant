//export const API_BASE = "/pmahiringservice";
export const API_BASE = import.meta.env.VITE_API_BASE_URL;

export type ApiError = {
  status: number;
  message: string;
  body?: string;
};

async function readTextSafe(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data: T | null; res: Response }> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  // همیشه از Headers استفاده می‌کنیم تا انواع مختلف headers (آبجکت/آرایه/Headers) درست هندل شوند
  const headers = new Headers(init.headers);

  // پیش‌فرض‌ها
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // اگر FormData می‌فرستیم، Content-Type را دستی ست نکنید (مرورگر boundary را اضافه می‌کند)
  if (isFormData) {
    headers.delete("Content-Type");
  } else {
    // اگر body رشته‌ای (JSON.stringify) است و Content-Type ست نشده، ستش کن
    if (typeof init.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  // اگر 204 بود، بادی ندارد
  if (res.status === 204) {
    return { data: null, res };
  }

  // تلاش برای پارس JSON؛ اگر نبود متن خام
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = (await res.json()) as T;
    return { data, res };
  }

  // fallback: متن
  const text = await readTextSafe(res);
  return { data: text as unknown as T, res };
}

export function pickApplicantId(payload: any): number | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [
    payload.applicantId,
    payload.id,
    payload.data?.applicantId,
    payload.data?.id,
    payload.result?.applicantId,
    payload.result?.id,
  ];
  for (const x of candidates) {
    const n = Number(x);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export async function throwIfNotOk(res: Response) {
  if (res.ok) return;
  const body = await readTextSafe(res);
  const err: ApiError = {
    status: res.status,
    message: `HTTP ${res.status}`,
    body,
  };
  throw err;
}
