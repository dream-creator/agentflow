import { test as base, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const testUser = {
  email: `test-e2e-${Date.now()}@agentflow.test`,
  password: "TestPassword123!",
  fullName: "E2E Test User",
};

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function signUpTestUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true,
    user_metadata: {
      full_name: testUser.fullName,
    },
  });

  if (error) throw error;
  return data.user;
}

async function deleteTestUser(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

export const test = base.extend<{
  authenticatedPage: Page;
  testUser: typeof testUser;
}>({
  authenticatedPage: async ({ page }, use) => {
    const user = await signUpTestUser();
    await signIn(page, testUser.email, testUser.password);
    await use(page);
    await deleteTestUser(user.id);
  },
  testUser: async ({}, use) => {
    await use(testUser);
  },
});

export { expect };
