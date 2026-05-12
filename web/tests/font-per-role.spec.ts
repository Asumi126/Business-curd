import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("項目ごとのフォント変更（氏名のみ）が機能する", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: /サンプルデータ/ }).click();
  await page.waitForTimeout(400);
  await page.getByText("ミニマル・ホワイト").first().click();
  await page.getByRole("button", { name: /次へ/ }).click();

  await page.getByRole("button", { name: /✒️ フォント/ }).click();
  await page.waitForTimeout(200);

  // Open the per-role section: select "氏名（漢字）" → "テック・モノスペース"
  // Find the select for 氏名（漢字）
  const nameRow = page.locator('div').filter({ hasText: /^🪪氏名（漢字）/ }).last();
  // simpler: find selects, the first is for 氏名
  const selects = page.locator('select');
  await selects.first().selectOption({ label: /テック・モノスペース/ });
  await page.waitForTimeout(300);

  // Inspect name element font on front card
  const fontFamilyName = await page.locator('aside .card-frame [data-role="name"]').first().evaluate((el) => getComputedStyle(el).fontFamily);
  // Other elements should use template default (Helvetica Neue)
  const fontFamilyContact = await page.locator('aside .card-frame [data-role="contact"]').first().evaluate((el) => getComputedStyle(el).fontFamily);

  console.log("name font:", fontFamilyName);
  console.log("contact font:", fontFamilyContact);
  expect(fontFamilyName.toLowerCase()).toContain("mono");
  expect(fontFamilyContact.toLowerCase()).not.toContain("mono");
});
