import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function axe(page: Page) {
  const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
}

const next = (page: Page) => page.getByRole("button", { name: "Fortsätt", exact: true }).click();

/** Picks an option in a chip/yes-no radio group by the group's and the option's accessible names. */
async function choose(page: Page, group: RegExp, option: string) {
  const groupEl = page.getByRole("radiogroup", { name: group });
  const radio = groupEl.getByRole("radio", { name: option, exact: true });
  // The native radio is visually hidden; users tap its label (the chip).
  await groupEl.locator("label").filter({ has: page.getByRole("radio", { name: option, exact: true }) }).click();
  await expect(radio).toBeChecked();
}

test("flyttstäd request: click-only flow shows the indicative price and keeps answers on back", async ({ page }) => {
  await page.goto("/boka");

  // Step 1 – category tile advances by itself.
  await expect(page.getByRole("heading", { level: 1, name: /Vad behöver du hjälp med/ })).toBeVisible();
  await expect(page.getByText(/Steg 1 av 8/)).toBeVisible();
  await page.getByRole("button", { name: /^Städning/ }).click();

  // Step 2 – service.
  await expect(page.getByText(/Steg 2 av 8/)).toBeVisible();
  await page.getByRole("button", { name: /^Flyttstädning/ }).click();

  // Step 3 – home.
  await expect(page.getByText(/Steg 3 av 8/)).toBeVisible();
  await axe(page);
  await choose(page, /typ av bostad/i, "Bostadsrätt");
  await choose(page, /Hur stor/i, "60–79 m²");
  await choose(page, /husdjur/i, "Nej");
  await next(page);

  // Step 4 – when: pick the first selectable day next month.
  await expect(page.getByText(/Steg 4 av 8/)).toBeVisible();
  await page.getByRole("button", { name: /nästa månad/i }).click();
  await page.locator("button[data-date]:not([disabled]):not([aria-disabled='true'])").first().click();
  await choose(page, /tid på dagen/i, "Förmiddag");
  await next(page);

  // Step 5 – where (the only typing before the contact step).
  await expect(page.getByText(/Steg 5 av 8/)).toBeVisible();
  await page.getByLabel(/Postnummer/i).fill("11453");
  await next(page);

  // Step 6 – eligibility.
  await expect(page.getByText(/Steg 6 av 8/)).toBeVisible();
  for (const q of [/18 år/i, /skatt i Sverige/i, /Bor du i bostaden/i]) {
    await choose(page, q, "Ja");
  }
  await choose(page, /dela på avdraget/i, "1 person");
  await choose(page, /redan använt/i, "Nej");
  await axe(page);
  await next(page);

  // Step 7 – indicative price for 60–79 m²: usually 3 800–4 800 kr after RUT.
  await expect(page.getByText(/Steg 7 av 8/)).toBeVisible();
  await expect(page.getByText(/3\s800–4\s800\s*kr/).first()).toBeVisible();
  await expect(page.getByText(/Ingen bokningsavgift/i).first()).toBeVisible();
  await expect(page.getByText(/preliminärt/i).first()).toBeVisible();
  await axe(page);

  // Back keeps the answers.
  await page.goBack();
  await expect(page.getByText(/Steg 6 av 8/)).toBeVisible();
  await page.goForward();
  await expect(page.getByText(/3\s800–4\s800\s*kr/).first()).toBeVisible();
  await next(page);

  // Step 8 – contact form with required consent.
  await expect(page.getByText(/Steg 8 av 8/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Skicka förfrågan" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await axe(page);
});

test("ineligible answers still show a price, without deduction, and never block", async ({ page }) => {
  await page.goto("/boka");
  await page.getByRole("button", { name: /^Städning/ }).click();
  await page.getByRole("button", { name: /^Flyttstädning/ }).click();
  await choose(page, /typ av bostad/i, "Bostadsrätt");
  await choose(page, /Hur stor/i, "60–79 m²");
  await choose(page, /husdjur/i, "Nej");
  await next(page);
  await page.getByRole("button", { name: /nästa månad/i }).click();
  await page.locator("button[data-date]:not([disabled]):not([aria-disabled='true'])").first().click();
  await choose(page, /tid på dagen/i, "Förmiddag");
  await next(page);
  await page.getByLabel(/Postnummer/i).fill("11122");
  await next(page);
  await choose(page, /18 år/i, "Nej");
  await choose(page, /skatt i Sverige/i, "Ja");
  await choose(page, /Bor du i bostaden/i, "Ja");
  await choose(page, /dela på avdraget/i, "1 person");
  await choose(page, /redan använt/i, "Nej");
  await next(page);
  await expect(page.getByText(/Steg 7 av 8/)).toBeVisible();
  // Without deduction: 7 600–9 600 kr.
  await expect(page.getByText(/7\s600–9\s600\s*kr/).first()).toBeVisible();
  await next(page);
  await expect(page.getByText(/Steg 8 av 8/)).toBeVisible();
});
