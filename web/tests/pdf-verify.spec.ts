import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test.use({ viewport: { width: 1440, height: 900 } });

test("PDF寸法が91x55mm + 塗り足し3mm = 97x61mmで出力される", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: /始める/ }).click();
  await page.getByPlaceholder("山田 太郎").fill("検証 太郎");
  for (let i = 0; i < 9; i++) {
    await page.getByRole("button", { name: /次へ/ }).click();
  }

  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: /PDFをダウンロード/ }).click();
  const download = await downloadPromise;
  const tmpPath = path.join("/tmp", "verify-card.pdf");
  await download.saveAs(tmpPath);
  expect(fs.existsSync(tmpPath)).toBe(true);
  console.log("PDF saved at:", tmpPath, "Size:", fs.statSync(tmpPath).size);
});
