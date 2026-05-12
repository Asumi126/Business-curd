import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("全体フォント変更が氏名にも反映される", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  // Use sample data → jump to template selection
  await page.getByRole("button", { name: /サンプルデータ/ }).click();
  await page.waitForTimeout(400);

  // Check we're at template selection (step 7)
  await expect(page.getByText("気に入ったデザインを選んでください")).toBeVisible();
  // Pick MinimalWhite
  await page.getByText("ミニマル・ホワイト").first().click();

  // Go to customize
  await page.getByRole("button", { name: /次へ/ }).click();
  await expect(page.getByText("自分だけのカスタマイズ")).toBeVisible();

  // Open font tab
  await page.getByRole("button", { name: /✒️ フォント/ }).click();
  await page.waitForTimeout(200);

  // Snapshot the font BEFORE
  const before = await page.locator("aside .card-frame").first().evaluate((el) => {
    const nameEl = el.querySelector(".text-\\[22pt\\]") as HTMLElement | null;
    return nameEl ? getComputedStyle(nameEl).fontFamily : "";
  });

  // Pick a different global font (テック・モノスペース)
  await page.getByText("テック・モノスペース", { exact: false }).first().click();
  await page.waitForTimeout(400);

  // Snapshot the font AFTER
  const after = await page.locator("aside .card-frame").first().evaluate((el) => {
    const nameEl = el.querySelector(".text-\\[22pt\\]") as HTMLElement | null;
    return nameEl ? getComputedStyle(nameEl).fontFamily : "";
  });

  console.log("BEFORE:", before);
  console.log("AFTER:", after);
  expect(after).not.toBe(before);
  expect(after.toLowerCase()).toContain("mono");
});
