import { test } from "@playwright/test";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "../../preview-screenshots");

test.describe("v3 ロゴステップ", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("ロゴステップのスクショ", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("藤本 愛寿");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByPlaceholder("YAMADA DESIGN").fill("LANALIFE 株式会社");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "v3-step6-logo.png"), fullPage: true });
  });
});
