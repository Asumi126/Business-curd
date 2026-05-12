import { test } from "@playwright/test";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "../../preview-screenshots");

test.use({ viewport: { width: 1440, height: 900 } });

test("v4 ようこそ画面（電話帳あり/なし）", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.screenshot({ path: path.join(OUT_DIR, "v4-welcome-empty.png"), fullPage: true });

  await page.evaluate(() => {
    const profiles = [
      {
        id: "p1",
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
          postalCode: "150-0001",
          address: "東京都渋谷区",
          website: "yamada.com",
          sns: {},
          logoDataUrl: "",
          memo: "",
          backText: "",
          backMessage: "",
          qrMode: "vcard",
          qrUrl: "",
          qrCaption: "",
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
            fineAdjust: { hidden: {}, backHidden: {}, scale: 1, offsetY: 0, hideTemplateExtras: false, customYearLabel: "", addressLayout: "inline" },
          },
        },
        templateId: "minimal-white",
        backStyleId: "qr-split",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "p2",
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
          postalCode: "",
          address: "",
          website: "",
          sns: {},
          logoDataUrl: "",
          memo: "",
          backText: "",
          backMessage: "",
          qrMode: "vcard",
          qrUrl: "",
          qrCaption: "",
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
            fineAdjust: { hidden: {}, backHidden: {}, scale: 1, offsetY: 0, hideTemplateExtras: false, customYearLabel: "", addressLayout: "inline" },
          },
        },
        templateId: "minimal-black",
        backStyleId: "minimal",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    window.localStorage.setItem("mycardmaker:v1:profiles", JSON.stringify(profiles));
  });
  await page.reload();
  await page.screenshot({ path: path.join(OUT_DIR, "v4-welcome-with-profiles.png"), fullPage: true });
});
