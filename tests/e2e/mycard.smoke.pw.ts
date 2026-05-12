import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("My Card Maker - smoke tests", () => {
  test("step 1: ようこそ画面が表示される", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
    });

    await page.goto(BASE_URL);
    await expect(page.getByText("ようこそ、My Card Maker へ")).toBeVisible();
    await expect(page.getByRole("button", { name: /始める/ })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("ウィザードの全ステップを通過できる", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByRole("button", { name: /始める/ }).click();

    await expect(page.getByText("あなたのお名前を教えてください")).toBeVisible();
    await page.getByPlaceholder("山田 太郎").fill("テスト 太郎");
    await page.getByPlaceholder("Taro Yamada").fill("Test Taro");
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("お仕事のことを教えてください")).toBeVisible();
    await page.getByPlaceholder("YAMADA DESIGN").fill("Test Co.");
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("連絡先を教えてください")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("ウェブサイトやSNSはありますか？")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("ロゴ画像をアップロードしますか？")).toBeVisible();
    await page.getByRole("button", { name: /次へ/ }).click();

    await expect(page.getByText("気に入ったデザインを選んでください")).toBeVisible();

    await page.getByRole("button", { name: /次へ/ }).click();
    await expect(page.getByText("名刺をダウンロードしましょう")).toBeVisible();
  });

  test("テンプレが少なくとも20種類表示される", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      // jump to step 7 directly via clicking next 6 times
    });
    await page.getByRole("button", { name: /始める/ }).click();
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: /次へ/ }).click();
    }
    const heading = page.getByText("気に入ったデザインを選んでください");
    await expect(heading).toBeVisible();
    const allFilter = page.getByRole("button", { name: /すべて \(/ });
    await expect(allFilter).toBeVisible();
    const text = await allFilter.textContent();
    expect(text).toMatch(/\d+/);
    const match = text?.match(/(\d+)/);
    const count = match ? parseInt(match[1], 10) : 0;
    expect(count).toBeGreaterThanOrEqual(20);
  });

  test("入力データが localStorage に保存される", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("永続テスト");

    await page.waitForTimeout(200);
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("mycardmaker:v1:userdata"),
    );
    expect(stored).toContain("永続テスト");

    await page.reload();
    await page.getByRole("button", { name: /始める/ }).click();
    const value = await page.getByPlaceholder("山田 太郎").inputValue();
    expect(value).toBe("永続テスト");
  });
});
