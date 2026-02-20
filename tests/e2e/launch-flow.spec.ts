import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.open = () => null;
  });
});

test("marketing CTA opens one-click launch", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", {
      name: /ابدأ الإعداد بضغطة واحدة|Start One-Click Setup/i
    })
    .first()
    .click();

  await expect(page).toHaveURL(/\/app\/launch/);
  await expect(
    page.getByRole("heading", {
      name: /مركز الإطلاق|One-Click Launch Center/i
    })
  ).toBeVisible();
});

test("launch page supports connector switch and identifier mode", async ({ page }) => {
  await page.goto("/app/launch");

  const connectorSelect = page.getByLabel(/Connector|الموصل/i);
  await connectorSelect.selectOption("klaviyo");
  await expect(page.getByLabel(/Account ID|معرف الحساب/i)).toBeVisible();

  await connectorSelect.selectOption("salla");
  await expect(page.getByLabel(/Store ID|معرف المتجر/i)).toBeVisible();
});

test("klaviyo demo install sync and launch flow works", async ({ page }) => {
  await page.goto("/app/launch");

  await page.getByLabel(/Connector|الموصل/i).selectOption("klaviyo");
  await page.getByLabel(/Account ID|معرف الحساب/i).fill("acc-e2e-demo");

  await page
    .getByRole("button", { name: /Start Klaviyo Install|بدء ربط كلافيو/i })
    .click();
  await expect(page.locator(".logBlock")).toContainText(/Klaviyo install URL generated/i);

  await page.getByRole("button", { name: /Sync Core Data|مزامنة البيانات/i }).click();
  await expect(page.getByRole("heading", { name: /Sync Result|نتيجة المزامنة/i })).toBeVisible();

  await page
    .getByRole("button", { name: /Run One-Click Engine|تشغيل المحرك/i })
    .click();
  await expect(page.getByRole("heading", { name: /Launch Result|نتيجة التشغيل/i })).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() => ({
        connector: window.localStorage.getItem("ribh_connector"),
        externalId: window.localStorage.getItem("ribh_external_id")
      }))
    )
    .toEqual({
      connector: "klaviyo",
      externalId: "acc-e2e-demo"
    });
});

test("salla flow remains backward compatible", async ({ page }) => {
  await page.goto("/app/launch");

  await page.getByLabel(/Connector|الموصل/i).selectOption("salla");
  await page.getByLabel(/Store ID|معرف المتجر/i).fill("salla-e2e-store");

  await page.getByRole("button", { name: /Sync Core Data|مزامنة البيانات/i }).click();
  await expect(page.getByRole("heading", { name: /Sync Result|نتيجة المزامنة/i })).toBeVisible();

  await page
    .getByRole("button", { name: /Run One-Click Engine|تشغيل المحرك/i })
    .click();
  await expect(page.getByRole("heading", { name: /Launch Result|نتيجة التشغيل/i })).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() => ({
        connector: window.localStorage.getItem("ribh_connector"),
        externalId: window.localStorage.getItem("ribh_external_id")
      }))
    )
    .toEqual({
      connector: "salla",
      externalId: "salla-e2e-store"
    });
});

test("analytics shows benchmark gate verdict", async ({ page }) => {
  await page.goto("/app/launch");

  await page.getByLabel(/Connector|الموصل/i).selectOption("klaviyo");
  await page.getByLabel(/Account ID|معرف الحساب/i).fill("acc-e2e-benchmark");
  await page
    .getByRole("button", { name: /Run One-Click Engine|تشغيل المحرك/i })
    .click();
  await expect(page.getByRole("heading", { name: /Launch Result|نتيجة التشغيل/i })).toBeVisible();

  await page.goto("/app/analytics");
  await expect(
    page.getByRole("heading", { name: /Core 3 Benchmark Gate|بوابة المقارنة المعيارية/i })
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator("section").filter({ hasText: /Core 3 Benchmark Gate|بوابة المقارنة المعيارية/i })).toContainText(
    /Pass|نجاح|Fail|فشل/i
  );
});
