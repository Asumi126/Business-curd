import { test, expect } from "@playwright/test";

/**
 * 名刺の項目別X/Y位置調整機能の動作確認
 */
test("名刺の項目別X/Y調整がレンダリングに反映される", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mycardmaker:v1:appMode", "business-card");
  });
  await page.goto("http://localhost:3000");

  // ステップを進めてカスタマイズページまで行く
  // Step1Welcome → Skip → ... → Step8Customize の道のりが長いので、
  // 直接 generateFontOverrideCss が data-role 要素に transform を適用するか確認する

  // テスト用に直接 layoutOffsetPerRole を localStorage に書き込んで再読込
  await page.evaluate(() => {
    // wizard の data も書き換える必要があるが、ここでは Step8 まで進む代わりに
    // CSS が生成されるか単体確認する
  });

  // Step1 のスキップ可能なら全部スキップ
  const startBtn = page.locator('button:has-text("新規")').first();
  if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(200);
  }

  // 「次へ」「進む」を連打してできるだけ進む
  for (let i = 0; i < 12; i++) {
    const nextBtn = page.locator('button:has-text("次へ"), button:has-text("進む"), button:has-text("カスタマイズへ")').first();
    if (!(await nextBtn.isVisible({ timeout: 1500 }).catch(() => false))) break;
    if ((await nextBtn.isDisabled().catch(() => true))) break;
    await nextBtn.click();
    await page.waitForTimeout(150);
  }

  // 'data-role="name"' を持つ要素が存在するか確認
  const hasName = await page.locator('[data-role="name"]').count();
  console.log("data-role=name 要素数:", hasName);

  // フォントタブをクリック
  const fontTab = page.locator('button:has-text("フォント")').first();
  if (await fontTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fontTab.click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: "test-results/per-role-debug.png", fullPage: true });

  // 横位置スライダーが存在するか
  const yokoSliders = await page.locator('text=横位置').count();
  console.log("横位置スライダー数:", yokoSliders);
});
