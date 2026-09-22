import { expect, test } from "@playwright/test";

/**
 * The acceptance path from docs/BUILD_PROMPT.md:
 * register → planner shows the right Fabindia size → choose a look and status →
 * admin sees the row and the CSV contains it → guest deletes → admin no longer sees it.
 */
test("guest registers, plans, admin exports, guest deletes", async ({ page, request, context }) => {
  const email = `priya.${Date.now()}@example.com`;

  // Register: womenswear, inches, bust 36 / waist 32 / hip 40 → Fabindia M (exact row).
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Priya Example");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Country you live in").fill("Switzerland");
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

  // No horizontal scroll on a phone-width viewport.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // Plan the Sangeet: pick the first look, ask the couple to pre-order, add a note.
  const sangeet = page.locator("#event-sangeet");
  await sangeet.getByRole("checkbox").first().check();
  await sangeet.getByLabel("Please reserve or pre-order this for me").check();
  await sangeet.getByLabel("Notes for the couple (optional)").fill("Emerald if possible");
  await sangeet.getByRole("button", { name: "Save Sangeet" }).click();
  await expect(page.getByTestId("saved-sangeet")).toBeVisible();
  await expect(page.locator("#event-sangeet").getByRole("checkbox").first()).toBeChecked();

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
  await expect(table).toContainText("Please reserve or pre-order this for me");
  await expect(table).toContainText("Emerald if possible");

  // CSV export carries the same row (uses the browser's cookies).
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

  // Unauthenticated export is refused.
  const anon = await request.get("/admin/export", { headers: { cookie: "" } });
  expect(anon.status()).toBe(401);

  // Guest deletes; admin no longer sees them.
  await page.goto(plannerUrl);
  await page.getByRole("button", { name: "Delete everything about me" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1/);
  await page.goto(plannerUrl);
  await expect(page.getByText("That link doesn't work")).toBeVisible();
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

test("validation catches a unit mix-up", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Unit Mixup");
  await page.getByLabel("Email").fill("mixup@example.com");
  await page.getByText("Womenswear", { exact: true }).click();
  await page.getByText("inches", { exact: true }).click();
  await page.getByLabel(/^Bust/).fill("91"); // cm typed while inches selected
  await page.getByLabel(/^Waist/).fill("81");
  await page.getByLabel(/^Hip/).fill("102");
  await page.getByRole("button", { name: "Save and see my sizes" }).click();
  await expect(page.getByText(/looks out of range/).first()).toBeVisible();
  await expect(page).toHaveURL(/\/register/);
});
