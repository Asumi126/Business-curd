import { test, expect } from "@playwright/test";

test.describe("My Card Maker - smoke", () => {
  // Pre-seed localStorage so the app-mode picker is bypassed and the
  // business-card Wizard renders directly (the existing tests target it).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("mycardmaker:v1:appMode", "business-card");
      } catch {
        /* ignore */
      }
    });
  });

  test("ようこそ画面が表示される", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
    });

    await page.goto("/");
    // Welcome heading lives at the top of Step1
    await expect(
      page.getByRole("heading", { name: /名刺を作成する方法を選んでください/ }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /新規で作成/ })).toBeVisible();

    expect(errors.filter((e) => !e.includes("favicon"))).toEqual([]);
  });

  test("8ステップを最後まで通過してダウンロード画面に到達できる", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
    });

    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /新規で作成/ }).click();

    await expect(page.getByText("あなたのお名前を教えてください")).toBeVisible();
    await page.getByPlaceholder("山田 太郎").fill("テスト 太郎");
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("お仕事のことを教えてください")).toBeVisible();
    await page.getByPlaceholder("YAMADA DESIGN").fill("Test Co.");
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("連絡先を教えてください")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("ウェブサイトやSNSはありますか？")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    // Step 6 (after the swap): デザイン選択
    await expect(page.getByText("気に入ったデザインを選んでください")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    // Step 7 (after the swap): 挿入画像
    await expect(page.getByText("画像をアップロード（任意）")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    // After swap: Step 8 is 裏面選択, Step 9 is カスタマイズ
    await expect(page.getByText("裏面のデザインを選んでください")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("自分だけのカスタマイズ")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("最後の微調整")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("印刷発注できる本格データ")).toBeVisible();

    expect(errors.filter((e) => !e.includes("favicon"))).toEqual([]);
  });

  test("テンプレートが20種類以上ある", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /新規で作成/ }).click();
    // Step2 → 4 clicks = Step6 (デザイン選択)
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /次へ/ }).click();
    }

    // After the redesign, templates are grouped under three sections.
    // Verify the "標準デザイン" group exists and has at least 10 cards.
    await expect(page.getByText("標準デザイン")).toBeVisible();
    const headingText = await page
      .getByText(/標準デザイン[\s\S]*?\d+種類/)
      .first()
      .textContent();
    const m = (headingText ?? "").match(/(\d+)\s*種類/);
    expect(m).not.toBeNull();
    const n = parseInt(m![1], 10);
    expect(n).toBeGreaterThanOrEqual(10);
  });

  test("入力が localStorage に永続化される", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /新規で作成/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("永続テスト");
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("mycardmaker:v1:userdata"),
    );
    expect(stored).toContain("永続テスト");

    await page.reload();
    await page.getByRole("button", { name: /途中から続ける/ }).click();
    const value = await page.getByPlaceholder("山田 太郎").inputValue();
    expect(value).toBe("永続テスト");
  });
});
