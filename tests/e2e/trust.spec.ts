import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function axe(page: Page) {
  const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
}

const next = (page: Page) => page.getByRole("button", { name: "Fortsätt", exact: true }).click();

async function choose(page: Page, group: RegExp, option: string) {
  const groupEl = page.getByRole("radiogroup", { name: group });
  await groupEl.locator("label").filter({ has: page.getByRole("radio", { name: option, exact: true }) }).click();
  await expect(groupEl.getByRole("radio", { name: option, exact: true })).toBeChecked();
}

test("move-out package: moving help plus cleaning gives two prices, guarantees and promises", async ({ page }) => {
  await page.goto("/boka");
  await page.getByRole("button", { name: /^Flytt/ }).first().click();
  await page.getByRole("button", { name: /^Bära, lasta och lossa/ }).click();

  // Step 3: the package asks for the size of the home (the cleaning is priced by size).
  await expect(page.getByText(/Steg 3 av 8/)).toBeVisible();
  await page.getByText(/Lägg till flyttstädning i samma förfrågan/).click();
  await expect(page.getByText(/Besiktningsgaranti/).first()).toBeVisible();
  await choose(page, /typ av bostad/i, "Hyreslägenhet");
  await choose(page, /Hur stor/i, "60–79 m²");
  await choose(page, /husdjur/i, "Nej");
  await axe(page);
  await next(page);

  // Step 4: the cleaning's inspection date is asked.
  await expect(page.getByText(/Steg 4 av 8/)).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: /besiktningen/i })).toBeVisible();
  await page.getByRole("button", { name: /nästa månad/i }).click();
  await page.locator("button[data-date]:not([disabled]):not([aria-disabled='true'])").first().click();
  await choose(page, /tid på dagen/i, "Förmiddag");
  await choose(page, /besiktningen/i, "Vet inte än");
  await next(page);

  await page.getByLabel(/Postnummer/i).fill("11453");
  await next(page);

  // Step 6 has the 2026 rules box.
  await expect(page.getByText(/Reglerna för 2026/)).toBeVisible();
  for (const q of [/18 år/i, /skatt i Sverige/i, /Bor du i bostaden/i]) await choose(page, q, "Ja");
  await choose(page, /dela på avdraget/i, "1 person");
  await choose(page, /redan använt/i, "Nej");
  await next(page);

  // Step 7: one card per part of the package, both guarantees and the promises.
  await expect(page.getByText(/Steg 7 av 8/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ingår i flyttpaketet: Flyttstädning/ })).toBeVisible();
  await expect(page.getByText(/2\s300–3\s600\s*kr/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Avdragsgaranti", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Besiktningsgaranti" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Du betalar när jobbet är klart/ })).toBeVisible();
  await axe(page);
  await next(page);

  // Step 8: booking for a relative reveals the resident's fields and explains who pays.
  await expect(page.getByText(/Steg 8 av 8/)).toBeVisible();
  await page.getByText(/Jag bokar åt någon annan/).click();
  await expect(page.getByLabel(/Namn på den som bor i bostaden/)).toBeVisible();
  await expect(page.getByText(/Vem får avdraget\?/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await axe(page);
});

test("window cleaning offers a subscription and a reminder", async ({ page }) => {
  await page.goto("/boka");
  await page.getByRole("button", { name: /^Fönsterputs/ }).click();
  await expect(page.getByText(/Steg 3 av 8/)).toBeVisible();
  await choose(page, /Hur ofta/i, "Vår och höst, varje år");
  await choose(page, /Hur ofta/i, "En gång");
  await choose(page, /typ av bostad/i, "Villa eller radhus");
  await choose(page, /husdjur/i, "Nej");
  await next(page);
  await page.getByRole("button", { name: /nästa månad/i }).click();
  await page.locator("button[data-date]:not([disabled]):not([aria-disabled='true'])").first().click();
  await choose(page, /tid på dagen/i, "Förmiddag");
  await next(page);
  await page.getByLabel(/Postnummer/i).fill("11453");
  await next(page);
  for (const q of [/18 år/i, /skatt i Sverige/i, /Bor du i bostaden/i]) await choose(page, q, "Ja");
  await choose(page, /dela på avdraget/i, "1 person");
  await choose(page, /redan använt/i, "Nej");
  await next(page);
  await next(page);
  await expect(page.getByText(/Påminn mig när det är dags igen/)).toBeVisible();
  await expect(page.getByText(/om ungefär ett halvår/)).toBeVisible();
});

test("homepage shows our promises", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Våra löften till dig" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Inget extra arbete utan ditt ja/ })).toBeVisible();
});
