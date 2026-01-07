# Complete Frontend Auth Guide (Next.js 14+ App Router – Recommended)

This guide covers **full authentication flow** including:
- Email/password + OTP
- Google login
- Token storage
- Protected routes
- Auto refresh
- Logout

## 1. Folder Structure (Next.js App Router)

```
app/
├── auth/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── verify/page.tsx
│   ├── callback/page.tsx        ← Handles Google redirect
│   └── success/page.tsx        ← Optional
├── dashboard/page.tsx          ← Protected
├── layout.tsx
├── globals.css
lib/
├── auth.ts                     ← All auth functions
├── api.ts                      ← Axios/fetch wrapper
```

## 2. Auth Utilities (`lib/auth.ts`)

```typescript
// lib/auth.ts
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const STORAGE_KEY = "professionalsbd_auth";

export const authService = {
  saveTokens(accessToken: string, refreshToken: string, user: User) {
    const state: AuthState = { accessToken, refreshToken, user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  getAuthState(): AuthState | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  isAuthenticated(): boolean {
    const state = this.getAuthState();
    return !!state?.accessToken && !this.isTokenExpired(state.accessToken);
  },

  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  async refreshAccessToken(): Promise<boolean> {
    const state = this.getAuthState();
    if (!state?.refreshToken) return false;

    try {
      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      this.saveTokens(data.data.accessToken, data.data.refreshToken, data.data.user);
      return true;
    } catch {
      this.clear();
      return false;
    }
  },
};
```

Install: `npm install jwt-decode`

## 3. API Wrapper with Auto Refresh (`lib/api.ts`)

```typescript
// lib/api.ts
import { authService } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const api = async (endpoint: string, options: RequestInit = {}) => {
  let { accessToken } = authService.getAuthState() || {};

  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Auto refresh on 401
  if (res.status === 401) {
    const refreshed = await authService.refreshAccessToken();
    if (refreshed) {
      const newState = authService.getAuthState();
      headers.set("Authorization", `Bearer ${newState?.accessToken}`);
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    }
  }

  return res;
};
```

## 4. Handle Google Callback (`app/auth/callback/page.tsx`)

```tsx
// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth";

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const userStr = params.get("user");

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        authService.saveTokens(accessToken, refreshToken, user);
        router.push("/dashboard");
      } catch {
        router.push("/auth/login?error=invalid_callback");
      }
    } else {
      router.push("/auth/login?error=failed");
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Completing login...</p>
    </div>
  );
}
```

## 5. Protected Route HOC (`middleware.ts` or Component)

```tsx
// components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
    }
  }, [router]);

  if (!authService.isAuthenticated()) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
```

## 6. Google Login Button

```tsx
const handleGoogleLogin = () => {
  window.location.href = "/api/v1/auth/google";
};
```

## Final Frontend Auth Flow

1. User clicks "Login with Google" → redirects to `/api/v1/auth/google`
2. Google auth → callback → `/auth/callback`
3. Tokens saved → redirect to dashboard
4. All API calls auto-refresh token
5. Protected routes redirect if not logged in
