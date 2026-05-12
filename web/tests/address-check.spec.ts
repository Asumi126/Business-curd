import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("住所がプレビューに表示される", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: /新しく作る/ }).click();
  await page.getByPlaceholder("山田 太郎").fill("テスト 太郎");
  await page.getByRole("button", { name: /次へ/ }).click();
  await page.getByPlaceholder("YAMADA DESIGN").fill("テスト株式会社");
  await page.getByRole("button", { name: /次へ/ }).click();
  await page.getByPlaceholder("yamada@example.com").fill("test@example.com");
  await page.getByPlaceholder("150-0001").fill("100-0001");
  await page.getByPlaceholder("東京都渋谷区神宮前1-2-3").fill("東京都千代田区テスト町1-2-3");
  await page.getByRole("button", { name: /次へ/ }).click();
  await page.waitForTimeout(400);

  // Live preview should show address
  const addressVisible = await page
    .locator("aside")
    .first()
    .getByText("〒100-0001", { exact: false })
    .isVisible();
  expect(addressVisible).toBe(true);

  const addressText = await page
    .locator("aside")
    .first()
    .getByText(/千代田区/)
    .first()
    .isVisible();
  expect(addressText).toBe(true);
});
