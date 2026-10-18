import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PUBLIC_ROUTES = [
  "/",
  "/boka",
  "/sa-fungerar-rut-och-rot",
  "/vad-ger-inte-avdrag",
  "/vanliga-fragor",
  "/om-oss",
  "/kontakt",
  "/villkor",
  "/integritetspolicy",
  "/admin/login",
];

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page is wider than the 375 px viewport").toBeLessThanOrEqual(1);
}

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`),
  ).toEqual([]);
}

for (const route of PUBLIC_ROUTES) {
  test(`${route} renders, fits 375 px and passes axe`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);
  });
}

test("phone number is visible on the homepage and in the flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /076-113 43 84/ }).first()).toBeVisible();
  await page.goto("/boka");
  await expect(page.getByText(/076-113 43 84/).first()).toBeVisible();
});

test("no booking or service fee is mentioned as a charge", async ({ page }) => {
  for (const route of ["/", "/boka", "/vanliga-fragor"]) {
    await page.goto(route);
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/serviceavgift/i);
    expect(text).not.toMatch(/kryphål/i);
  }
});

test("legal pages are published without a draft banner", async ({ page }) => {
  for (const route of ["/villkor", "/integritetspolicy", "/sa-fungerar-rut-och-rot", "/vad-ger-inte-avdrag"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Ska granskas av jurist|Utkast/)).toHaveCount(0);
  }
});

test("admin pages require login", async ({ page }) => {
  await page.goto("/admin/bokningar");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("unknown quote link shows a friendly message", async ({ page }) => {
  const res = await page.goto("/offert/finns-inte-alls-1234567890abcdefghijklmnop");
  expect(res?.status()).toBeLessThan(500);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/076-113 43 84/).first()).toBeVisible();
});
