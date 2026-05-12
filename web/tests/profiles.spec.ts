import { test, expect } from "@playwright/test";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "../../preview-screenshots");

test.describe("名刺帳機能", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("名刺帳を開いてプロフィールを保存できる", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /始める/ }).click();
    await page.getByPlaceholder("山田 太郎").fill("テスト 一郎");
    await page.waitForTimeout(200);

    await page.getByRole("button", { name: /名刺帳/ }).click();
    await expect(page.getByRole("heading", { name: /📂 名刺帳/ })).toBeVisible();

    await page.screenshot({ path: path.join(OUT_DIR, "v3-profiles-empty.png"), fullPage: true });

    await page.getByPlaceholder(/プロフィール名/).fill("マイ・テスト名刺");
    await page.getByRole("button", { name: /新規保存/ }).click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(OUT_DIR, "v3-profiles-saved.png"), fullPage: true });

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("mycardmaker:v1:profiles"),
    );
    expect(stored).toContain("マイ・テスト名刺");
  });

  test("welcome画面に保存済みプロフィールが表示される", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const profile = {
        id: "test_01",
        label: "メイン名刺",
        data: {
          nameJa: "山田 太郎",
          nameEn: "Taro Yamada",
          title: "Webデザイナー",
          company: "YAMADA DESIGN",
          department: "",
          tagline: "",
          phone: "090-1234-5678",
          email: "yamada@example.com",
          address: "東京都渋谷区",
          website: "yamada.com",
          sns: {},
          logoDataUrl: "",
          memo: "",
          customization: {
            paletteId: "auto",
            customColors: {},
            fontGlobal: "auto",
            fontPerRole: {},
            patternId: "none",
            monogramStyle: "circle",
            contactPrefix: "icon",
            fineAdjust: { hidden: {}, scale: 1, offsetY: 0 },
          },
        },
        templateId: "minimal-white",
        backStyleId: "qr-split",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      window.localStorage.setItem("mycardmaker:v1:profiles", JSON.stringify([profile]));
    });
    await page.reload();
    await expect(page.getByText("名刺帳から続きを始める")).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "v3-welcome-with-profiles.png"), fullPage: true });
  });

  test("プロフィールから読み込んでテンプレ画面に飛ぶ", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const profile = {
        id: "test_02",
        label: "副業用",
        data: {
          nameJa: "佐藤 花子",
          nameEn: "Hanako Sato",
          title: "イラストレーター",
          company: "SATO STUDIO",
          department: "",
          tagline: "",
          phone: "",
          email: "sato@example.com",
          address: "",
          website: "",
          sns: {},
          logoDataUrl: "",
          memo: "",
          backText: "",
          customization: {
            paletteId: "auto",
            customColors: {},
            backColors: {},
            fontGlobal: "auto",
            fontPerRole: {},
            patternId: "none",
            monogramStyle: "none",
            contactPrefix: "icon",
            cardSize: "standard",
            fineAdjust: { hidden: {}, backHidden: {}, scale: 1, offsetY: 0 },
          },
        },
        templateId: "minimal-black",
        backStyleId: "slogan-big",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      window.localStorage.setItem("mycardmaker:v1:profiles", JSON.stringify([profile]));
    });
    await page.reload();
    await page.getByText("副業用").first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText("気に入ったデザインを選んでください")).toBeVisible();
  });
});
