import { test, expect } from "@playwright/test";
import * as path from "path";

test("カスタム背景アップロード動作確認", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("mycardmaker:v1:appMode", "business-card");
  });
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(1500);

  // 名刺ウィザードに入る（Step1Welcomeから新規作成へ）
  const newBtn = page.locator('button').filter({ hasText: /新規|スキップ/ }).first();
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn.click();
    await page.waitForTimeout(300);
  }

  // ロゴ・カスタム背景のあるステップまで進む（Step6Logo）
  for (let i = 0; i < 15; i++) {
    // 「📷 カスタム背景画像」が見えたら停止
    if (await page.locator("text=カスタム背景画像").first().isVisible({ timeout: 500 }).catch(() => false)) {
      break;
    }
    const next = page.locator('button').filter({ hasText: /次へ|進む|スキップ/ }).first();
    if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
      const disabled = await next.isDisabled().catch(() => true);
      if (disabled) break;
      await next.click();
      await page.waitForTimeout(200);
    } else {
      break;
    }
  }

  // 「📷 カスタム背景画像」セクションの確認
  const header = page.locator("text=📷 カスタム背景画像").first();
  const headerVisible = await header.isVisible({ timeout: 3000 }).catch(() => false);
  console.log("ヘッダー表示:", headerVisible);

  if (!headerVisible) {
    console.log("カスタム背景UIが見つからない");
    console.log("Errors:", errors);
    return;
  }

  // ファイルセレクター（input[type=file]）を見つけ、テスト用画像をセット
  const fileInput = page.locator('input[type="file"][accept*="image"]').first();
  await expect(fileInput).toBeAttached({ timeout: 3000 });

  // 1x1 透明 PNG のbase64（最小のテスト画像）
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const buffer = Buffer.from(pngBase64, "base64");
  await fileInput.setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer,
  });
  await page.waitForTimeout(1500);

  // ImageCropModal が開くはず
  const cropTitle = page.locator("text=切り取り").first();
  const cropVisible = await cropTitle.isVisible({ timeout: 3000 }).catch(() => false);
  console.log("切り取りモーダル表示:", cropVisible);

  console.log("---エラーログ---");
  errors.forEach((e) => console.log(e));
  console.log("---エラー終わり---");
});
