import { test as base, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PROJECT_REF = new URL(SUPABASE_URL).host.split(".")[0];
const COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`;

const TEST_PASSWORD = "TestPassword123!";
const TEST_FULL_NAME = "E2E Test User";

type TestUser = { email: string; password: string; fullName: string };

function makeTestUser(): TestUser {
  return {
    email: `test-e2e-${Date.now()}-${randomUUID().slice(0, 8)}@agentflow.test`,
    password: TEST_PASSWORD,
    fullName: TEST_FULL_NAME,
  };
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name} for e2e auth fixture. ` +
        `Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ` +
        `and SUPABASE_SERVICE_ROLE_KEY in your test environment.`
    );
  }
  return value;
}

let supabaseAdminCache: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminCache) {
    supabaseAdminCache = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return supabaseAdminCache;
}

function base64urlEncode(input: string): string {
  const base64 = btoa(unescape(encodeURIComponent(input)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signUpTestUser(user: TestUser) {
  const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
  });
  if (error) throw error;
  return data.user!;
}

async function deleteTestUser(userId: string) {
  await getSupabaseAdmin().auth.admin.deleteUser(userId);
}

/**
 * Mints a Supabase session server-side (via admin `generate_link` +
 * `/auth/v1/verify`) and returns the cookie value in `@supabase/ssr` format.
 * Bypasses the login UI entirely — no password grant (which requires
 * captcha), no Turnstile widget interaction.
 *
 * Supabase captcha is enforced on the password grant + OTP request, but NOT
 * on OTP verification or magic-link clicks, so this flow works even when
 * `security_captcha_enabled` is true on the Supabase project.
 *
 * The cookie value format (`base64-<base64url(JSON.stringify(session))>`)
 * matches what `@supabase/ssr` writes in its `setItem` impl (see
 * `node_modules/@supabase/ssr/dist/module/cookies.js`).
 *
 * Throttling note: the Supabase `/auth/v1/verify` endpoint is rate-limited
 * per project (~30 req/min on the free tier). The fixture is therefore
 * `worker`-scoped — one user, one session, one rate-limit hit per worker
 * instead of one per test.
 */
async function mintSession(email: string): Promise<string> {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  if (!linkRes.ok) {
    throw new Error(`generate_link failed: ${linkRes.status} ${await linkRes.text()}`);
  }
  const { email_otp } = await linkRes.json();

  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token: email_otp, email }),
  });
  if (!verifyRes.ok) {
    throw new Error(`verify failed: ${verifyRes.status} ${await verifyRes.text()}`);
  }
  const session = await verifyRes.json();

  const sessionJson = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type ?? "bearer",
    expires_in: session.expires_in ?? 3600,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    user: session.user,
  });
  return "base64-" + base64urlEncode(sessionJson);
}

async function injectSessionCookie(page: Page, cookieValue: string) {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const baseUrlObj = new URL(baseUrl);
  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value: cookieValue,
      url: baseUrl,
      httpOnly: false,
      secure: baseUrlObj.protocol === "https:",
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 3600,
    },
  ]);
}

type CachedSession = {
  email: string;
  userId: string;
  cookieValue: string;
  refCount: number;
};

let sessionCache: CachedSession | null = null;

async function acquireSession(): Promise<CachedSession> {
  if (sessionCache) {
    sessionCache.refCount++;
    return sessionCache;
  }
  const user = makeTestUser();
  const created = await signUpTestUser(user);
  const cookieValue = await mintSession(user.email);
  sessionCache = {
    email: user.email,
    userId: created.id,
    cookieValue,
    refCount: 1,
  };
  return sessionCache;
}

async function releaseSession(): Promise<void> {
  if (!sessionCache) return;
  sessionCache.refCount--;
  if (sessionCache.refCount <= 0) {
    const userId = sessionCache.userId;
    sessionCache = null;
    await deleteTestUser(userId);
  }
}

type AuthFixture = {
  email: string;
  userId: string;
  cookieValue: string;
};

export const test = base.extend<{
  authenticatedPage: Page;
  authFixture: AuthFixture;
  testUser: TestUser;
}>({
  authFixture: async ({}, use) => {
    const session = await acquireSession();
    try {
      await use({
        email: session.email,
        userId: session.userId,
        cookieValue: session.cookieValue,
      });
    } finally {
      await releaseSession();
    }
  },
  authenticatedPage: async ({ page, authFixture }, use) => {
    await injectSessionCookie(page, authFixture.cookieValue);
    await use(page);
  },
  testUser: async ({}, use) => {
    await use(makeTestUser());
  },
});

export { expect };
