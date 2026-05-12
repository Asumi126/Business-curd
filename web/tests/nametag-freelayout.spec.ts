import { test, expect } from "@playwright/test";

test.describe("Nametag free layout editor", () => {
  test.beforeEach(async ({ page }) => {
    // 直接名札メーカーに入る
    await page.addInitScript(() => {
      window.localStorage.setItem("mycardmaker:v1:appMode", "nametag");
      window.localStorage.setItem(
        "nametag-wizard:v1",
        JSON.stringify({
          people: [
            {
              id: "test1",
              name: "山田 太郎",
              kana: "やまだ たろう",
              affiliation: "営業部",
              title: "リーダー",
              url: "",
              freeText: "",
            },
          ],
          templateId: "free-layout",
          eventName: "テストイベント",
          eventDate: "",
          mainColor: "#10b981",
          logoDataUrl: "",
          visibleFields: {
            kana: true, affiliation: true, title: true, freeText: true,
            qr: true, eventName: true, eventDate: true, logo: true,
          },
          useCase: "custom",
          fieldLabels: { name: "氏名", kana: "ふりがな", affiliation: "所属", title: "役職", freeText: "ひとこと" },
          customBgDataUrl: "",
          customBgOpacity: 0.4,
          freeLayout: {
            name: { enabled: true, x: 5, y: 18, scale: 1 },
            kana: { enabled: true, x: 5, y: 12, scale: 0.7 },
            affiliation: { enabled: true, x: 5, y: 38, scale: 0.7 },
            title: { enabled: true, x: 5, y: 45, scale: 0.7 },
            freeText: { enabled: false, x: 5, y: 50, scale: 0.7 },
            qr: { enabled: true, x: 70, y: 38, scale: 1 },
            logo: { enabled: true, x: 70, y: 3, scale: 1 },
            eventName: { enabled: true, x: 5, y: 4, scale: 0.6 },
            customText: { enabled: false, x: 5, y: 50, scale: 0.7 },
          },
          backLayout: "none",
          backText: "",
          backCustomBgDataUrl: "",
          backOverlay: { qr: false, freeText: false, logo: false, name: false, customText: "" },
        }),
      );
    });
    await page.goto("http://localhost:3000");
  });

  test("X座標変更時のプレビュー反映", async ({ page }) => {
    await page.waitForTimeout(1500);

    // 初期 left を取得
    const nameEl = page.locator("text=山田 太郎").first();
    const initialLeft = await nameEl.evaluate((el) => (el as HTMLElement).style.left);
    console.log("初期 left:", initialLeft);

    // エディタを発見
    const editorHeader = page.locator('text=🎨 自由レイアウト・エディタ');
    await expect(editorHeader).toBeVisible({ timeout: 5000 });

    // 氏名項目の X 入力欄を見つける（最初の number input）
    // エディタ内の最初の項目（氏名）のXに該当
    const xInputs = page.locator('label:has-text("X") input[type="number"]');
    const xCount = await xInputs.count();
    console.log("X inputs count:", xCount);

    if (xCount > 0) {
      const firstX = xInputs.first();
      const currentX = await firstX.inputValue();
      console.log("現在のX:", currentX);
      // 値を変更
      await firstX.fill("25");
      await firstX.blur();
      await page.waitForTimeout(500);

      const newLeft = await nameEl.evaluate((el) => (el as HTMLElement).style.left);
      console.log("変更後 left:", newLeft);

      expect(newLeft).not.toEqual(initialLeft);
    }
  });

  test("一括操作: 左揃え/中央/右寄せ", async ({ page }) => {
    await page.waitForTimeout(1500);

    const nameEl = page.locator("text=山田 太郎").first();
    const initialLeft = await nameEl.evaluate((el) => (el as HTMLElement).style.left);

    // 「中央」ボタンを押す
    const centerBtn = page.locator('button:has-text("中央")').first();
    await expect(centerBtn).toBeVisible();
    await centerBtn.click();
    await page.waitForTimeout(500);

    const centerLeft = await nameEl.evaluate((el) => (el as HTMLElement).style.left);
    const centerTransform = await nameEl.evaluate((el) => (el as HTMLElement).style.transform);
    console.log("中央押下後 left:", centerLeft, "transform:", centerTransform);
    expect(centerLeft).toContain("44");
    expect(centerTransform).toContain("translateX(-50%)");

    // 「右寄せ」ボタンを押す
    const rightBtn = page.locator('button:has-text("右寄せ")').first();
    await rightBtn.click();
    await page.waitForTimeout(500);

    const rightLeft = await nameEl.evaluate((el) => (el as HTMLElement).style.left);
    const rightTextAlign = await nameEl.evaluate((el) => (el as HTMLElement).style.textAlign);
    console.log("右寄せ押下後 left:", rightLeft, "textAlign:", rightTextAlign);
    expect(rightLeft).toContain("50");
    expect(rightTextAlign).toBe("left");
  });

  test("全体サイズスライダー", async ({ page }) => {
    await page.waitForTimeout(1500);
    const nameEl = page.locator("text=山田 太郎").first();
    const initialFontSize = await nameEl.evaluate((el) => (el as HTMLElement).style.fontSize);

    // 全体サイズスライダー（type="range" min=0.5 max=2）
    const sizeSlider = page.locator('input[type="range"][min="0.5"][max="2"]').first();
    await sizeSlider.fill("1.5");
    await page.waitForTimeout(500);

    const newFontSize = await nameEl.evaluate((el) => (el as HTMLElement).style.fontSize);
    console.log("初期fontSize:", initialFontSize, "1.5倍後:", newFontSize);
    expect(newFontSize).not.toEqual(initialFontSize);
  });
});
