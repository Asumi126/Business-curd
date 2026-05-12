import { test, expect } from "@playwright/test";

test.describe("My Card Maker - export", () => {
  test("PDFダウンロードボタンを押すとPDFファイルがダウンロードされる", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
    });

    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("Export 太郎");
    for (let i = 0; i < 9; i++) {
      await page.getByRole("button", { name: /次へ/ }).click();
    }

    await expect(page.getByText("印刷発注できる本格データ")).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.getByRole("button", { name: /PDFをダウンロード/ }).click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/);

    expect(errors.filter((e) => !e.includes("favicon"))).toEqual([]);
  });

  test("PNG（表面）ダウンロードが動作する", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("PNG 太郎");
    for (let i = 0; i < 9; i++) {
      await page.getByRole("button", { name: /次へ/ }).click();
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.getByRole("button", { name: /表面\s*PNG/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test("テンプレート選択がライブプレビューに反映される", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("プレビューテスト");
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: /次へ/ }).click();
    }

    await expect(page.getByText("気に入ったデザインを選んでください")).toBeVisible();
    await page.getByText("ダーク・テック").click();
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /次へ/ }).click();
    }

    await expect(page.getByText("印刷発注できる本格データ")).toBeVisible();
    const namesOnPage = await page.getByText("プレビューテスト").count();
    expect(namesOnPage).toBeGreaterThanOrEqual(1);
  });
});
