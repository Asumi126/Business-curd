import { test } from "@playwright/test";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "../../preview-screenshots");

test.use({ viewport: { width: 1440, height: 900 } });

test("v5 ようこそ画面（タイムライン展開）", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.screenshot({ path: path.join(OUT_DIR, "v5-welcome-collapsed.png"), fullPage: true });

  await page.getByText("これから聞かれる項目").click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, "v5-welcome-expanded.png"), fullPage: true });
});
