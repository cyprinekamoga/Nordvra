import { expect, test } from "@playwright/test";

test("homepage tells the three steps with photos", async ({ page }) => {
  await page.goto("/");
  const steps = page.getByRole("region", { name: "Så enkelt är det" }).getByRole("listitem");
  await expect(steps).toHaveCount(3);
  for (const title of ["Välj tjänst", "Välj tid", "Vi fixar resten"]) {
    await expect(page.getByRole("heading", { level: 3, name: new RegExp(title) })).toBeVisible();
  }
  // Hero photo has a real description and the SPEC example price.
  await expect(page.getByRole("img", { name: /diskbänk/ })).toBeVisible();
  await expect(page.getByText(/Du betalar\s4\s200\skr/).first()).toBeVisible();
});

test("calculator starts on the SPEC example and follows the slider and the deduction type", async ({ page }) => {
  await page.goto("/");
  const calc = page.getByRole("region", { name: "Räkna själv" });
  await calc.scrollIntoViewIfNeeded();
  const total = calc.getByRole("definition").last();
  await expect(total).toHaveText(/4\s200\skr/);

  await calc.getByLabel("Arbetskostnad före avdrag").fill("20000");
  await expect(total).toHaveText(/10\s000\skr/);

  await calc.getByText("Hantverkare").click();
  await expect(calc.getByText("ROT-avdrag 30 %")).toBeVisible();
  await expect(total).toHaveText(/14\s000\skr/);

  // Above the RUT cap (75 000 kr deduction) the deduction stops growing.
  await calc.getByText("Städning, flytt med mera").click();
  await calc.getByLabel("Arbetskostnad före avdrag").fill("200000");
  await expect(total).toHaveText(/125\s000\skr/);
  await expect(calc.getByText("Avdraget är begränsat av taket per person och år.")).toBeVisible();
});

test("moving day chapters work with clicks and arrow keys", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Flyttdagen timme för timme" });
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Bärarna kommer" })).toBeVisible();

  await tabs.getByRole("tab", { name: /13:00/ }).click();
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Flyttstädningen börjar" })).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: /17:00/ })).toBeFocused();
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Nycklarna lämnas" })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(tabs.getByRole("tab", { name: /08:00/ })).toHaveAttribute("aria-selected", "true");
});
