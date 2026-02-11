import { test, expect } from "@playwright/test";

test("marketing CTA opens one-click launch", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /ابدأ الإعداد بضغطة واحدة|Start One-Click Setup/i }).first().click();
  await expect(page).toHaveURL(/\/app\/launch/);
  await expect(page.getByRole("heading", { name: /مركز الإطلاق|One-Click Launch Center/i })).toBeVisible();
});
