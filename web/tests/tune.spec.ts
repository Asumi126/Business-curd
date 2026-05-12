import { test } from "@playwright/test";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "../../preview-screenshots");

test.describe("v3 微調整画面", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("微調整ステップのスクショ", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("藤本 愛寿");
    await page.getByPlaceholder("Taro Yamada").fill("Asumi Fujimoto");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByPlaceholder("YAMADA DESIGN").fill("LANALIFE 株式会社");
    await page.locator('input[placeholder="代表 / Webデザイナー"]').fill("代表取締役");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByPlaceholder("090-1234-5678").fill("090-7419-0992");
    await page.getByPlaceholder("yamada@example.com").fill("a-fujimoto@lanalife.co.jp");
    await page.getByPlaceholder("150-0001").fill("227-0052");
    await page.getByPlaceholder("東京都渋谷区神宮前1-2-3").fill("神奈川県横浜市青葉区梅ヶ丘20-7");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.locator('input[placeholder="https://example.com"]').fill("lanalife.co.jp");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByText("ウォール街・トラディショナル").click();
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "v3-tune.png"), fullPage: true });

    const finishBtn = page.getByRole("button", { name: /次へ/ });
    await finishBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "v3-finish.png"), fullPage: true });
  });
});
