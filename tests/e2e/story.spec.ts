import { expect, test } from "@playwright/test";

test("homepage tells the three steps with photos", async ({ page }) => {
  await page.goto("/");
  const steps = page.getByRole("region", { name: "Så enkelt är det" }).getByRole("listitem");
  await expect(steps).toHaveCount(3);
  for (const title of ["Välj tjänst", "Välj tid", "Vi fixar resten"]) {
    await expect(page.getByRole("heading", { level: 3, name: new RegExp(title) })).toBeVisible();
  }
  // The hero's tiles open the booking flow on the right category; the search finds services.
  const tiles = page.getByRole("navigation", { name: "Populära tjänster" });
  await expect(tiles.getByRole("link", { name: "Städ & fönster" })).toHaveAttribute("href", "/boka?kategori=stadning");
  await expect(tiles.getByRole("link", { name: "Flytt & bärhjälp" })).toHaveAttribute("href", "/boka?kategori=flytt");
  await page.getByRole("searchbox", { name: "Vad ska göras?" }).fill("fönsterputs");
  await expect(page.getByRole("link", { name: /Fönsterputs/ }).first()).toHaveAttribute("href", "/boka?tjanst=fonsterputs");
  await page.getByRole("searchbox", { name: "Vad ska göras?" }).fill("");
  // The four service cards further down link to the booking flow.
  const services = page.getByRole("region", { name: "Hjälp i hemmet, från golv till tak" });
  for (const name of ["Städning", "Flytthjälp", "Måla & tapetsera", "Snickeri"]) {
    await expect(services.getByRole("link", { name, exact: true })).toHaveAttribute("href", "/boka");
  }
});

test("calculator starts on the SPEC example and follows the slider and the deduction type", async ({ page }) => {
  await page.goto("/");
  const calc = page.getByRole("region", { name: "Räkna själv" });
  await calc.scrollIntoViewIfNeeded();
  const total = calc.getByRole("definition").last();
  await expect(total).toHaveText(/2\s800\skr/);

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

test("moving day is told as you scroll, and the times jump to their chapter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/");
  const timeline = page.getByRole("navigation", { name: "Flyttdagen timme för timme" });
  const chapters = page.locator("section[aria-labelledby=flyttdag-rubrik] li[data-index]");
  // All three chapters are in the page, not hidden behind tabs.
  for (const title of ["Bärarna kommer", "Flyttstädningen börjar", "Nycklarna lämnas"]) {
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(1);
  }
  await expect(chapters).toHaveCount(3);

  // Scrolling the second chapter to the middle of the screen moves the timeline on.
  await chapters.nth(1).evaluate((el) => el.scrollIntoView({ block: "center" }));
  await expect(timeline.getByRole("link", { name: /13:00/ })).toHaveAttribute("aria-current", "step");

  // A time in the timeline jumps to its chapter.
  await timeline.getByRole("link", { name: /17:00/ }).click();
  await expect(page).toHaveURL(/#flyttdag-3$/);
  await expect(timeline.getByRole("link", { name: /17:00/ })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("heading", { level: 3, name: "Nycklarna lämnas" })).toBeInViewport();
});
