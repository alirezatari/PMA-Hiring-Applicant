import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiFetch } from "./api";

type AuthUser = {
  userId: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  createdDate?: string | null;
};

type AuthState = {
  token: string;
  user: AuthUser;
  roleId?: number | null;
};

type AuthContextValue = {
  state: AuthState | null;
  ready: boolean;
  login: (
    username: string,
    password: string,
    captcha?: { captchaId?: string; captchaValue?: string; secret?: string }
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredAuth(): AuthState | null {
  const raw = localStorage.getItem("pma_auth_state");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthState;
    if (parsed?.token && parsed?.user?.userId) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState | null>(() => loadStoredAuth());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  async function login(
    username: string,
    password: string,
    captcha?: { captchaId?: string; captchaValue?: string; secret?: string }
  ) {
    const payload: Record<string, any> = {
      username,
      password,
    };
    if (captcha?.captchaId) payload.captchaId = captcha.captchaId;
    if (captcha?.captchaValue) payload.captchaValue = captcha.captchaValue;
    if (captcha?.secret) payload.secret = captcha.secret;

    const { data, res } = await apiFetch<any>(`/api/Authenticate/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok || !data?.token) {
      let msg = data?.message || data?.error;
      if (!msg) {
        if (res.status === 400 || res.status === 401) {
          msg = "نام کاربری یا رمز عبور اشتباه است.";
        } else if (res.status) {
          msg = `خطا در ورود (HTTP ${res.status})`;
        } else {
          msg = "خطا در ورود";
        }
      }
      throw new Error(msg);
    }

    const base: AuthState = {
      token: data.token,
      user: {
        userId: Number(data.userId),
        username: data.username ?? username,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        createdDate: data.createdDate ?? null,
      },
      roleId: null,
    };

    localStorage.setItem("pma_auth_token", base.token);

    let roleId: number | null = null;
    try {
      const { data: rolesData, res: rolesRes } = await apiFetch<any>(
        `/api/UserRoles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: base.user.userId, roleId: 0 }),
        }
      );
      if (rolesRes.ok) {
        const list: any[] = Array.isArray(rolesData?.userRoles)
          ? rolesData.userRoles
          : Array.isArray(rolesData)
          ? rolesData
          : [];
        const first = list[0];
        const n = Number(first?.roleId);
        if (Number.isFinite(n)) roleId = n;
      }
    } catch {
      // ignore role fetch errors; user is still logged in
    }

    const next: AuthState = { ...base, roleId };
    localStorage.setItem("pma_auth_state", JSON.stringify(next));
    setState(next);
  }

  function logout() {
    localStorage.removeItem("pma_auth_state");
    localStorage.removeItem("pma_auth_token");
    setState(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ state, ready, login, logout }),
    [state, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute({
  children,
}: {
  children: React.ReactElement;
}) {
  const { state, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!state?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
