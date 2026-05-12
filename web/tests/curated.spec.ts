import { test } from "@playwright/test";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "../../preview-screenshots");

test.describe("v3 厳選テンプレ撮影", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  async function advanceToTemplates(page: import("@playwright/test").Page) {
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
    await page.getByPlaceholder("東京都渋谷区神宮前1-2-3").fill("神奈川県横浜市青葉区梅ヶ丘20-7 グランテラスA");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.locator('input[placeholder="https://example.com"]').fill("lanalife.co.jp");
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(500);
  }

  test("厳選テンプレートギャラリー", async ({ page }) => {
    await advanceToTemplates(page);
    await page.screenshot({
      path: path.join(OUT_DIR, "v3-templates-curated.png"),
      fullPage: true,
    });
  });

  test("各テンプレ個別の大きな画像", async ({ page }) => {
    await advanceToTemplates(page);
    const templateNames = [
      "ミニマル・ホワイト",
      "ミニマル・ブラック",
      "コーポレート・ブルー",
      "コーポレート・ネイビー",
      "スプリット・ダイアゴナル",
      "ウォール街・トラディショナル",
      "ソフト・グラデーション",
      "モダン・ブルーグラデ",
      "サンセット・グラデーション",
      "ダーク・テック",
      "テック・モノスペース",
      "プレミアム・ブラック&ゴールド",
      "和モダン・侘",
      "アーキテクチュラル",
    ];
    for (const name of templateNames) {
      try {
        await page.getByText(name, { exact: false }).first().click();
        await page.waitForTimeout(300);
        const preview = page.locator("aside").first();
        await preview.screenshot({
          path: path.join(OUT_DIR, `v3-card-${slug(name)}.png`),
        });
      } catch (e) {
        console.warn(`Failed for ${name}:`, e);
      }
    }
  });
});

function slug(s: string): string {
  return s
    .replace(/[・\s&]+/g, "-")
    .replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠-]/g, "")
    .toLowerCase();
}
