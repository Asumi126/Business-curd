import { test } from "@playwright/test";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "../../preview-screenshots");

test.describe("v2 プレビュー用スクリーンショット", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  async function fillSampleAndAdvanceTo(page: import("@playwright/test").Page, targetStep: number) {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("山田 太郎");
    if (targetStep < 2) return;
    if (targetStep > 2) {
      await page.getByPlaceholder("Taro Yamada").fill("Taro Yamada");
      await page.getByRole("button", { name: /次へ/ }).click();
      await page.getByPlaceholder("YAMADA DESIGN").fill("YAMADA DESIGN");
      await page.locator('input[placeholder="代表 / Webデザイナー"]').fill("代表 / Webデザイナー");
    }
    if (targetStep > 3) {
      await page.getByRole("button", { name: /次へ/ }).click();
      await page.getByPlaceholder("090-1234-5678").fill("090-1234-5678");
      await page.getByPlaceholder("yamada@example.com").fill("yamada@example.com");
      await page.getByPlaceholder("東京都渋谷区神宮前1-2-3").fill("東京都渋谷区神宮前1-2-3");
    }
    if (targetStep > 4) {
      await page.getByRole("button", { name: /次へ/ }).click();
      await page.locator('input[placeholder="https://example.com"]').fill("yamada-design.com");
    }
    for (let i = 5; i < targetStep; i++) {
      await page.getByRole("button", { name: /次へ/ }).click();
    }
    await page.waitForTimeout(400);
  }

  test("各画面のスクリーンショット", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.screenshot({ path: path.join(OUT_DIR, "v2-01-welcome.png"), fullPage: true });

    await fillSampleAndAdvanceTo(page, 2);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-02-name.png"), fullPage: true });

    await fillSampleAndAdvanceTo(page, 6);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-06-logo.png"), fullPage: true });

    await fillSampleAndAdvanceTo(page, 7);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-07-templates-all.png"), fullPage: true });

    await page.getByText("ソフト・グラデーション").first().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-08-customize-palette.png"), fullPage: true });

    await page.getByRole("button", { name: /✒️ フォント/ }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-08b-customize-font.png"), fullPage: true });

    await page.getByRole("button", { name: /🌐 パターン/ }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-08c-customize-pattern.png"), fullPage: true });

    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-09-back.png"), fullPage: true });

    await page.getByText("メモ罫線", { exact: false }).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-09b-back-memo.png"), fullPage: true });

    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-09c-tune.png"), fullPage: true });

    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-10-finish.png"), fullPage: true });
  });

  test("テンプレートカテゴリ別", async ({ page }) => {
    await fillSampleAndAdvanceTo(page, 7);

    const cats = ["all", "minimal", "business", "modern", "pop", "creative", "japanese", "natural"];
    const labelMap: Record<string, string> = {
      all: "すべて",
      minimal: "ミニマル",
      business: "ビジネス",
      modern: "モダン",
      pop: "ポップ",
      creative: "クリエイティブ",
      japanese: "和風",
      natural: "ナチュラル",
    };
    for (const cat of cats) {
      const label = labelMap[cat];
      const btn = page.getByRole("button", { name: new RegExp(`^${label} \\(`) });
      if (await btn.count()) {
        await btn.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(OUT_DIR, `v2-templates-${cat}.png`),
          fullPage: true,
        });
      }
    }
  });

  test("モバイル：テンプレ一覧", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSampleAndAdvanceTo(page, 7);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-mobile-07-templates.png"), fullPage: true });

    await page.getByText("ミニマル・ホワイト").click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /次へ/ }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "v2-mobile-08-customize.png"), fullPage: true });
  });
});
