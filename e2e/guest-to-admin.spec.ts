import { expect, test } from "@playwright/test";

/**
 * Acceptance path from docs/BUILD_PROMPT.md (revised 2026-09-23):
 * register → planner shows the right Fabindia size → answer intent + budget, tick a look, note → single save →
 * admin sees the row and the CSV contains it → unauthenticated admin body carries no guest data →
 * guest regenerates link, then deletes → admin no longer sees them.
 */
test("guest registers, answers, admin exports, guest deletes", async ({ page, request, context }) => {
  const email = `priya.${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Priya Example");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Country you live in (optional)").fill("Switzerland");
  await page.getByText("Womenswear", { exact: true }).click();
  await page.getByText("inches", { exact: true }).click();
  await page.getByLabel(/^Bust/).fill("36");
  await page.getByLabel(/^Waist/).fill("32");
  await page.getByLabel(/^Hip/).fill("40");
  await page.getByRole("button", { name: "Save and see my sizes" }).click();

  await expect(page).toHaveURL(/\/me\/[A-Za-z0-9_-]{20,}\?welcome=1/);
  const plannerUrl = page.url().split("?")[0];
  await expect(page.getByTestId("size-fabindia-women-tops")).toHaveText("M");
  await expect(page.getByText("Between sizes")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();

  // No horizontal scroll at phone width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // Answer once for the wedding, tick a Sangeet look, add a note, save the whole page once.
  await page.getByLabel("Please reserve or buy it for me in Mumbai").check();
  await page.getByLabel("₹8,000 – ₹15,000").check();
  const sangeet = page.locator("#event-sangeet");
  await sangeet.locator("summary").click();
  await sangeet.getByRole("checkbox").first().check();
  await sangeet.getByLabel("Notes for the couple (optional)").fill("Emerald if possible");
  await page.getByRole("button", { name: "Save my answers" }).click();
  await expect(page.getByTestId("saved")).toBeVisible();
  await expect(page.locator("#event-sangeet summary")).toContainText("1 ticked");
  await page.locator("#event-sangeet summary").click();
  await expect(page.locator("#event-sangeet").getByRole("checkbox").first()).toBeChecked();

  // Header link finds the planner again on this device.
  await page.getByRole("link", { name: "My planner" }).click();
  await expect(page).toHaveURL(plannerUrl);

  // Unauthenticated admin: redirect only, no guest data in the body.
  const anonAdmin = await request.get("/admin", { maxRedirects: 0 });
  expect(anonAdmin.status()).toBe(307);
  expect(await anonAdmin.text()).not.toContain(email);
  expect(await anonAdmin.text()).not.toContain("Priya Example");
  const anonExport = await request.get("/admin/export", { maxRedirects: 0 });
  expect(anonExport.status()).toBe(401);

  // Admin: wrong passcode fails, right passcode lands on the guest table.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Passcode").fill("nope");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(page.getByText("That passcode is not right.")).toBeVisible();
  await page.getByLabel("Passcode").fill("e2e-pass");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const table = page.getByTestId("guests-table");
  await expect(table).toContainText("Priya Example");
  await expect(table).toContainText("Fabindia: M");
  await expect(table).toContainText("Please reserve or buy it for me in Mumbai");
  await expect(table).toContainText("₹8,000 – ₹15,000");
  await expect(table).toContainText("Emerald if possible");

  // CSV export carries the same row.
  const cookies = await context.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const csv = await request.get("/admin/export", { headers: { cookie: cookieHeader } });
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const body = await csv.text();
  expect(body.split("\r\n")[0]).toContain("full_name,email");
  expect(body).toContain("Priya Example");
  expect(body).toContain(email);
  expect(body).toContain("Sangeet");
  expect(body).toContain("Emerald if possible");
  expect(body).toContain("Please reserve or buy it for me in Mumbai");

  // Regenerate: old link dies, new one works.
  await page.goto(plannerUrl);
  await page.getByText("Shared it by mistake?").click();
  await page.getByRole("button", { name: "Regenerate my link" }).click();
  await expect(page).toHaveURL(/\/me\/[A-Za-z0-9_-]{20,}\?relinked=1/);
  const newUrl = page.url().split("?")[0];
  expect(newUrl).not.toBe(plannerUrl);
  await page.goto(plannerUrl);
  await expect(page.getByText("That link doesn't work")).toBeVisible();

  // Delete with confirmation; admin no longer sees them.
  await page.goto(newUrl);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete everything about me" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1/);
  await page.goto("/admin");
  await expect(page.getByTestId("guests-table")).not.toContainText("Priya Example");
});

test("menswear guest sees Fabindia size driven by waist and the Tasva guidance", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Arjun Example");
  await page.getByLabel("Email").fill(`arjun.${Date.now()}@example.com`);
  await page.getByText("Menswear", { exact: true }).click();
  await page.getByLabel(/^Chest/).fill("102");
  await page.getByLabel(/^Waist/).fill("86");
  await page.getByLabel(/^Hip/).fill("100");
  await page.getByRole("button", { name: "Save and see my sizes" }).click();
  await expect(page.getByTestId("size-fabindia-men-kurtas")).toHaveText("L");
  await expect(page.getByText(/your waist needs L/)).toBeVisible();
  await expect(page.getByText("XS · S · M · L · XL · XXL · XXXL")).toBeVisible();
  await expect(page.getByText(/Complimentary fitting alterations/)).toBeVisible();
});

test("validation is human, associates errors, and catches a unit mix-up", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Unit Mixup");
  await page.getByLabel("Email").fill("mixup@example.com");
  await page.getByText("Womenswear", { exact: true }).click();
  await page.getByText("inches", { exact: true }).click();
  await page.getByLabel(/^Bust/).fill("91"); // cm typed while inches selected
  await page.getByLabel(/^Waist/).fill("81");
  await page.getByRole("button", { name: "Save and see my sizes" }).click();
  const alert = page.getByTestId("form-errors");
  await expect(alert).toBeVisible();
  await expect(alert).toBeFocused();
  await expect(alert).toContainText("Did you mean cm");
  await expect(alert).toContainText("Enter your hip");
  await expect(page.getByText("Too small")).toHaveCount(0);
  await expect(page.getByLabel(/^Bust/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel(/^Hip/)).toHaveAttribute("aria-describedby", /hip-error/);
  await expect(page).toHaveURL(/\/register/);
});
