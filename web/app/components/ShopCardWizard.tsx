"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "../lib/icons";

const STORAGE_KEY = "shopcardmaker:v1:data";

type StampStyle = "circle" | "star" | "heart" | "check";
export type BackLayout =
  | "stamp"
  | "info"
  | "image"
  | "map"
  | "custom"
  | "gallery"
  | "coupon"
  | "badge"
  | "qr-shop"
  | "message-big"
  | "custom-bg";
export type FrontTemplate =
  | "minimal"
  | "banner"
  | "centered"
  | "split"
  | "photo"
  | "elegant"
  | "custom-bg"
  | "tag"
  | "ribbon"
  | "circle-mark"
  | "side-stripe"
  | "horizontal-bar"
  | "diagonal"
  | "frame-double"
  | "stamp-style"
  | "kraft"
  | "pastel"
  | "neon"
  | "vintage"
  | "monogram-block";

export type ShopCardData = {
  // Brand
  shopName: string;
  shopNameEn: string;
  category: string;
  tagline: string;
  // Contact
  address: string;
  phone: string;
  hours: string;
  closedDay: string;
  website: string;
  instagram: string;
  // Back layout selection
  backLayout: BackLayout;
  // Stamp card (when backLayout === "stamp")
  stampCount: number;
  stampStyle: StampStyle;
  stampReward: string;
  stampNote: string;
  // Detailed info (when backLayout === "info")
  services: string; // multi-line, one service per line
  pricelist: string; // multi-line "メニュー名 / 値段"
  infoMessage: string; // 1-2 lines of greeting / mission
  // Image (when backLayout === "image")
  backImageDataUrl: string;
  backImageCaption: string;
  // Map (when backLayout === "map")
  mapImageDataUrl: string; // optional uploaded map screenshot
  mapDirections: string; // 道案内テキスト
  nearestStation: string;
  // Custom (when backLayout === "custom")
  customBackText: string; // 自由 multi-line text
  customBackTitle: string;
  // Logo / front image
  logoDataUrl: string;
  frontImageDataUrl: string;
  customBackgroundDataUrl: string;
  customBackgroundOpacity: number;
  // Custom background for the back side (independent from front)
  backCustomBackgroundDataUrl: string;
  backCustomBackgroundOpacity: number;
  backCustomBgText: string; // optional overlay text on back custom bg
  backCustomBgShowText: boolean;
  // Logo placement (works on every front template, including custom bg)
  logoPositionId:
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-center"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  logoSizeMm: number; // 8 - 30
  logoWithBackground: boolean; // white pad behind logo for dark backgrounds
  logoOffsetXmm: number;
  logoOffsetYmm: number;
  // Front template selection
  frontTemplate: FrontTemplate;
  // Back-specific extras for new layouts
  galleryImage1: string;
  galleryImage2: string;
  galleryImage3: string;
  couponLabel: string;
  couponTitle: string;
  couponDetail: string;
  couponExpiry: string;
  badgeText: string;
  badgeYear: string;
  qrUrl: string;
  qrLabel: string;
  bigMessage: string;
  bigMessageEn: string;
  // Visual
  brandColor: string;
  accentColor: string;
  // 自由レイアウト (Free Layout Editor) — 名札/一括メーカーと同仕様。
  // 各要素のON/OFF・X/Y(mm)・サイズ倍率を全テンプレ共通で適用。
  // 表面/裏面それぞれ独立して管理。
  shopFreeLayout: {
    align?: "left" | "center" | "right";
    globalScale: number;
    front: {
      hidden: Partial<Record<ShopFreeLayoutKey, boolean>>;
      offset: Partial<Record<ShopFreeLayoutKey, { x: number; y: number }>>;
      sizeScale: Partial<Record<ShopFreeLayoutKey, number>>;
    };
    back: {
      hidden: Partial<Record<ShopFreeLayoutKey, boolean>>;
      offset: Partial<Record<ShopFreeLayoutKey, { x: number; y: number }>>;
      sizeScale: Partial<Record<ShopFreeLayoutKey, number>>;
    };
  };
};

type ShopFreeLayoutKey =
  | "shopName"
  | "shopNameEn"
  | "category"
  | "tagline"
  | "logo"
  | "address"
  | "phone"
  | "hours"
  | "website"
  | "instagram";

const defaultShopData: ShopCardData = {
  shopName: "",
  shopNameEn: "",
  category: "",
  tagline: "",
  address: "",
  phone: "",
  hours: "",
  closedDay: "",
  website: "",
  instagram: "",
  backLayout: "stamp",
  stampCount: 10,
  stampStyle: "circle",
  stampReward: "",
  stampNote: "",
  services: "",
  pricelist: "",
  infoMessage: "",
  backImageDataUrl: "",
  backImageCaption: "",
  mapImageDataUrl: "",
  mapDirections: "",
  nearestStation: "",
  customBackText: "",
  customBackTitle: "",
  logoDataUrl: "",
  frontImageDataUrl: "",
  customBackgroundDataUrl: "",
  customBackgroundOpacity: 1,
  backCustomBackgroundDataUrl: "",
  backCustomBackgroundOpacity: 1,
  backCustomBgText: "",
  backCustomBgShowText: false,
  logoPositionId: "top-right",
  logoSizeMm: 12,
  logoWithBackground: false,
  logoOffsetXmm: 0,
  logoOffsetYmm: 0,
  frontTemplate: "minimal",
  galleryImage1: "",
  galleryImage2: "",
  galleryImage3: "",
  couponLabel: "SPECIAL COUPON",
  couponTitle: "",
  couponDetail: "",
  couponExpiry: "",
  badgeText: "",
  badgeYear: "",
  qrUrl: "",
  qrLabel: "",
  bigMessage: "",
  bigMessageEn: "",
  brandColor: "#7c3aed",
  accentColor: "#fde68a",
  shopFreeLayout: {
    align: undefined,
    globalScale: 1,
    front: { hidden: {}, offset: {}, sizeScale: {} },
    back: { hidden: {}, offset: {}, sizeScale: {} },
  },
};

const CATEGORY_PRESETS = [
  "カフェ・喫茶店",
  "美容室・サロン",
  "ネイル・まつ毛",
  "整体・マッサージ",
  "飲食店・レストラン",
  "ヨガ・フィットネス",
  "教室・スクール",
  "雑貨・小売",
  "その他",
];

type ShopCardWizardProps = { onBackToSelector?: () => void };

export function ShopCardWizard({ onBackToSelector }: ShopCardWizardProps = {}) {
  const [data, setData] = useState<ShopCardData>(defaultShopData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          setData({ ...defaultShopData, ...JSON.parse(raw) });
        }
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const update = <K extends keyof ShopCardData>(key: K, value: ShopCardData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-start gap-3">
          <span className="text-xl leading-none mt-0.5">🏪</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-base font-bold tracking-tight">Shop Card Maker</div>
              {/* カード種類選択へ — タイトルの真横に配置 (家マーク+オレンジ) */}
              {onBackToSelector && (
                <button
                  type="button"
                  onClick={onBackToSelector}
                  className="flex items-center gap-1 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-full transition shadow-sm shrink-0"
                  title="カードの種類選択画面に戻る"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    aria-hidden
                  >
                    <path d="M12 3.172l8.485 8.485-1.06 1.06L18 11.293V21h-5v-6h-2v6H6v-9.707l-1.425 1.424-1.06-1.06L12 3.172z" />
                  </svg>
                  <span className="hidden sm:inline">カード種類選択</span>
                </button>
              )}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              店舗カード＋スタンプカード（BETA版・モデルページ）
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_auto] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Brand */}
          <Section title="お店の基本情報" subtitle="ショップの顔となる情報を入れてください">
            <Field label="店舗名（必須）" hint="例: Café Lumière">
              <input
                type="text"
                value={data.shopName}
                onChange={(e) => update("shopName", e.target.value)}
                placeholder="店舗名"
                className="input"
              />
            </Field>
            <Field label="英語表記（任意）" hint="ローマ字・英文字でかっこよく">
              <input
                type="text"
                value={data.shopNameEn}
                onChange={(e) => update("shopNameEn", e.target.value)}
                placeholder="例: CAFE LUMIERE"
                className="input"
              />
            </Field>
            <Field label="業種・カテゴリ" hint="プリセットから選ぶか自由入力">
              <select
                value={data.category}
                onChange={(e) => update("category", e.target.value)}
                className="input"
              >
                <option value="">選択してください</option>
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                value={data.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="または自由入力"
                className="input mt-2"
              />
            </Field>
            <Field label="キャッチコピー / タグライン" hint="一言でお店の魅力を">
              <input
                type="text"
                value={data.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="例: 季節を味わう、丁寧な手仕事のカフェ"
                className="input"
              />
            </Field>
          </Section>

          {/* Contact / Hours */}
          <Section title="お店の情報" subtitle="お客様が見つけられる、訪れられる情報を">
            <Field label="住所">
              <input
                type="text"
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="東京都渋谷区..."
                className="input"
              />
            </Field>
            <Field label="電話番号">
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="03-1234-5678"
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="営業時間">
                <input
                  type="text"
                  value={data.hours}
                  onChange={(e) => update("hours", e.target.value)}
                  placeholder="10:00 - 20:00"
                  className="input"
                />
              </Field>
              <Field label="定休日">
                <input
                  type="text"
                  value={data.closedDay}
                  onChange={(e) => update("closedDay", e.target.value)}
                  placeholder="水曜日"
                  className="input"
                />
              </Field>
            </div>
            <Field label="ウェブサイト">
              <input
                type="url"
                value={data.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>
            <Field label="Instagram">
              <input
                type="text"
                value={data.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                placeholder="@yourshop"
                className="input"
              />
            </Field>
          </Section>

          {/* Standard front templates (19 designs, custom-bg excluded) */}
          <div className="rounded-2xl border-2 border-purple-300 bg-purple-50/30 p-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xl">📦</span>
              <h3 className="text-base font-bold text-neutral-900">標準デザイン</h3>
              <span className="text-[10px] font-mono text-neutral-500">19種類</span>
            </div>
            <p className="text-[11px] text-neutral-600 mb-3 leading-relaxed">
              画像なしで使えるベーシックテンプレート。
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: "minimal", label: "ミニマル", desc: "クリーン・シンプル" },
                  { id: "banner", label: "バナー", desc: "上半分カラー帯" },
                  { id: "centered", label: "中央寄せ", desc: "ロゴ中心" },
                  { id: "split", label: "スプリット", desc: "左右ツートン" },
                  { id: "photo", label: "写真メイン", desc: "上半分写真" },
                  { id: "elegant", label: "エレガント", desc: "ボーダー枠" },
                  { id: "tag", label: "タグ風", desc: "店名がタグ表示" },
                  { id: "ribbon", label: "リボン", desc: "上にリボン帯" },
                  { id: "circle-mark", label: "サークル", desc: "円形ロゴ強調" },
                  { id: "side-stripe", label: "サイド線", desc: "左に縦帯" },
                  { id: "horizontal-bar", label: "ヨコ線", desc: "中央水平線" },
                  { id: "diagonal", label: "斜め分割", desc: "ダイナミック" },
                  { id: "frame-double", label: "二重枠", desc: "高級感" },
                  { id: "stamp-style", label: "スタンプ風", desc: "ハンコ調" },
                  { id: "kraft", label: "クラフト", desc: "茶色紙風" },
                  { id: "pastel", label: "パステル", desc: "やさしい配色" },
                  { id: "neon", label: "ネオン", desc: "暗背景＋発光" },
                  { id: "vintage", label: "ヴィンテージ", desc: "アンティーク" },
                  { id: "monogram-block", label: "モノグラム", desc: "頭文字大" },
                ] as { id: FrontTemplate; label: string; desc: string }[]
              ).map((t) => {
                const sel = data.frontTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update("frontTemplate", t.id)}
                    className={`p-2 rounded-md border-2 text-left transition ${
                      sel
                        ? "border-purple-600 bg-white shadow-sm"
                        : "border-neutral-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div
                      className={`text-[11px] font-bold ${
                        sel ? "text-purple-700" : "text-neutral-900"
                      }`}
                    >
                      {t.label}
                    </div>
                    <div className="text-[9px] text-neutral-500">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom background — split into front / back, independent */}
          <div className="rounded-2xl border-2 border-pink-300 bg-pink-50/30 p-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xl">📷</span>
              <h3 className="text-base font-bold text-neutral-900">カスタム背景</h3>
              <span className="text-[10px] font-mono text-neutral-500">
                表面・裏面それぞれ設定可
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 mb-3 leading-relaxed">
              アップロードした画像を背景に全面配置できます。表面・裏面はそれぞれ独立して
              切り替え可能（表面だけ / 裏面だけ / 両面 のどれでも OK）。
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {/* === 表面 === */}
              <div className="rounded-xl bg-white border-2 border-pink-200 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700">
                    表面
                  </span>
                  <span className="text-[11px] text-neutral-600">フロント側カスタム背景</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "frontTemplate",
                      data.frontTemplate === "custom-bg" ? "minimal" : "custom-bg",
                    )
                  }
                  className={`w-full p-2.5 rounded-md border-2 text-left transition ${
                    data.frontTemplate === "custom-bg"
                      ? "border-pink-600 bg-pink-50"
                      : "border-neutral-200 bg-white hover:border-pink-300"
                  }`}
                >
                  <div
                    className={`text-[12px] font-bold ${
                      data.frontTemplate === "custom-bg" ? "text-pink-700" : "text-neutral-900"
                    }`}
                  >
                    {data.frontTemplate === "custom-bg"
                      ? "✓ 表面はカスタム背景を使用中"
                      : "📷 表面にカスタム背景を使う"}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {data.frontTemplate === "custom-bg"
                      ? "もう一度クリックで標準デザインに戻す"
                      : "クリックで表面の標準デザインから切り替え"}
                  </div>
                </button>

                {data.frontTemplate === "custom-bg" && (
                  <div className="space-y-2 pt-1">
                    <Field label="表面の背景画像">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-14 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                          {data.customBackgroundDataUrl ? (
                            <img
                              src={data.customBackgroundDataUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-neutral-400">未設定</span>
                          )}
                        </div>
                        <ImageInput
                          id="shop-custom-bg-front"
                          onPick={(d) => update("customBackgroundDataUrl", d)}
                          hasValue={!!data.customBackgroundDataUrl}
                          onClear={() => update("customBackgroundDataUrl", "")}
                        />
                      </div>
                    </Field>
                    {data.customBackgroundDataUrl && (
                      <Field
                        label={`表面の濃さ ${Math.round(data.customBackgroundOpacity * 100)}%`}
                      >
                        <input
                          type="range"
                          min={0.2}
                          max={1}
                          step={0.05}
                          value={data.customBackgroundOpacity}
                          onChange={(e) =>
                            update("customBackgroundOpacity", parseFloat(e.target.value))
                          }
                          className="w-full"
                        />
                      </Field>
                    )}
                  </div>
                )}
              </div>

              {/* === 裏面 === */}
              <div className="rounded-xl bg-white border-2 border-pink-200 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                    裏面
                  </span>
                  <span className="text-[11px] text-neutral-600">バック側カスタム背景</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "backLayout",
                      data.backLayout === "custom-bg" ? "stamp" : "custom-bg",
                    )
                  }
                  className={`w-full p-2.5 rounded-md border-2 text-left transition ${
                    data.backLayout === "custom-bg"
                      ? "border-purple-600 bg-purple-50"
                      : "border-neutral-200 bg-white hover:border-purple-300"
                  }`}
                >
                  <div
                    className={`text-[12px] font-bold ${
                      data.backLayout === "custom-bg" ? "text-purple-700" : "text-neutral-900"
                    }`}
                  >
                    {data.backLayout === "custom-bg"
                      ? "✓ 裏面はカスタム背景を使用中"
                      : "📷 裏面にカスタム背景を使う"}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {data.backLayout === "custom-bg"
                      ? "もう一度クリックでスタンプカードに戻す"
                      : "クリックで裏面の使い方を切り替え"}
                  </div>
                </button>

                {data.backLayout === "custom-bg" && (
                  <div className="space-y-2 pt-1">
                    <Field label="裏面の背景画像">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-14 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                          {data.backCustomBackgroundDataUrl ? (
                            <img
                              src={data.backCustomBackgroundDataUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-neutral-400">未設定</span>
                          )}
                        </div>
                        <ImageInput
                          id="shop-custom-bg-back"
                          onPick={(d) => update("backCustomBackgroundDataUrl", d)}
                          hasValue={!!data.backCustomBackgroundDataUrl}
                          onClear={() => update("backCustomBackgroundDataUrl", "")}
                        />
                      </div>
                    </Field>
                    {data.backCustomBackgroundDataUrl && (
                      <Field
                        label={`裏面の濃さ ${Math.round(data.backCustomBackgroundOpacity * 100)}%`}
                      >
                        <input
                          type="range"
                          min={0.2}
                          max={1}
                          step={0.05}
                          value={data.backCustomBackgroundOpacity}
                          onChange={(e) =>
                            update(
                              "backCustomBackgroundOpacity",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full"
                        />
                      </Field>
                    )}
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={data.backCustomBgShowText}
                        onChange={(e) =>
                          update("backCustomBgShowText", e.target.checked)
                        }
                      />
                      <span>背景の上にテキストを重ねる</span>
                    </label>
                    {data.backCustomBgShowText && (
                      <Field label="重ねるテキスト" optional>
                        <textarea
                          value={data.backCustomBgText}
                          onChange={(e) => update("backCustomBgText", e.target.value)}
                          placeholder="例: ENJOY YOUR DAY"
                          rows={2}
                          className="input"
                          style={{ resize: "vertical" }}
                        />
                      </Field>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo / image */}
          <Section title="ロゴ・画像" subtitle="お店のロゴと表面用画像（任意）">
            <Field label="ロゴ画像（透過PNG推奨）" hint="どのテンプレートでも、設定した位置に表示されます">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                  {data.logoDataUrl ? (
                    <img src={data.logoDataUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-neutral-400">未設定</span>
                  )}
                </div>
                <ImageInput
                  id="shop-logo"
                  onPick={(d) => update("logoDataUrl", d)}
                  hasValue={!!data.logoDataUrl}
                  onClear={() => update("logoDataUrl", "")}
                />
              </div>
            </Field>

            {/* Logo placement controls — only when a logo is uploaded */}
            {data.logoDataUrl && (
              <div className="rounded-lg bg-blue-50/40 border border-blue-200 p-3 space-y-3">
                <div className="text-[11px] font-bold text-blue-900">
                  📍 ロゴの配置・サイズ
                </div>

                {/* 9-point position picker */}
                <div>
                  <div className="text-[10px] text-neutral-600 mb-1">配置位置</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: "top-left", label: "↖" },
                        { id: "top-center", label: "↑" },
                        { id: "top-right", label: "↗" },
                        { id: "middle-left", label: "←" },
                        { id: "middle-center", label: "●" },
                        { id: "middle-right", label: "→" },
                        { id: "bottom-left", label: "↙" },
                        { id: "bottom-center", label: "↓" },
                        { id: "bottom-right", label: "↘" },
                      ] as { id: ShopCardData["logoPositionId"]; label: string }[]
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => update("logoPositionId", p.id)}
                        className={`p-2 rounded-md text-[12px] font-bold border transition ${
                          data.logoPositionId === p.id
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-neutral-700 border-neutral-200 hover:border-blue-400"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 w-12">サイズ</span>
                  <input
                    type="range"
                    min={6}
                    max={30}
                    step={0.5}
                    value={data.logoSizeMm}
                    onChange={(e) => update("logoSizeMm", parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono w-12 text-right">
                    {data.logoSizeMm.toFixed(1)}mm
                  </span>
                </div>

                {/* Fine offset X / Y */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 w-12">横（X）</span>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={0.5}
                    value={data.logoOffsetXmm}
                    onChange={(e) => update("logoOffsetXmm", parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono w-14 text-right">
                    {data.logoOffsetXmm > 0 ? "+" : ""}
                    {data.logoOffsetXmm.toFixed(1)}mm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 w-12">縦（Y）</span>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={0.5}
                    value={data.logoOffsetYmm}
                    onChange={(e) => update("logoOffsetYmm", parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono w-14 text-right">
                    {data.logoOffsetYmm > 0 ? "+" : ""}
                    {data.logoOffsetYmm.toFixed(1)}mm
                  </span>
                </div>

                <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.logoWithBackground}
                    onChange={(e) => update("logoWithBackground", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>白背景パディングをつける（暗い背景・写真の上で見やすく）</span>
                </label>

                {(data.logoOffsetXmm !== 0 ||
                  data.logoOffsetYmm !== 0 ||
                  data.logoSizeMm !== 12) && (
                  <button
                    type="button"
                    onClick={() => {
                      update("logoOffsetXmm", 0);
                      update("logoOffsetYmm", 0);
                      update("logoSizeMm", 12);
                    }}
                    className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                  >
                    ↩ サイズ・微調整をリセット
                  </button>
                )}
              </div>
            )}
            {(data.frontTemplate === "photo" ||
              data.frontTemplate === "centered") && (
              <Field
                label="表面用の画像（任意）"
                hint="店内・商品写真など。「写真メイン」「中央寄せ」テンプレで使用"
                optional
              >
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                    {data.frontImageDataUrl ? (
                      <img src={data.frontImageDataUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-neutral-400">未設定</span>
                    )}
                  </div>
                  <ImageInput
                    id="shop-front-img"
                    onPick={(d) => update("frontImageDataUrl", d)}
                    hasValue={!!data.frontImageDataUrl}
                    onClear={() => update("frontImageDataUrl", "")}
                  />
                </div>
              </Field>
            )}
          </Section>

          {/* Back layout selection — 10 types */}
          <Section
            title="裏面の使い方を選ぶ（11種類）"
            subtitle="用途に合わせて1つ選択"
          >
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: "stamp", emoji: "", label: "スタンプ", desc: "ポイントカード" },
                  { id: "info", emoji: "", label: "詳細情報", desc: "メニュー・サービス" },
                  { id: "image", emoji: "", label: "写真", desc: "店内・商品" },
                  { id: "map", emoji: "", label: "地図", desc: "アクセス案内" },
                  { id: "custom", emoji: "", label: "自由テキスト", desc: "メッセージ" },
                  { id: "gallery", emoji: "", label: "ギャラリー", desc: "画像3枚並べ" },
                  { id: "coupon", emoji: "", label: "クーポン", desc: "割引券形式" },
                  { id: "badge", emoji: "", label: "バッジ", desc: "実績・受賞表示" },
                  { id: "qr-shop", emoji: "", label: "QRショップ", desc: "URLをQRに" },
                  { id: "message-big", emoji: "", label: "大メッセージ", desc: "大きく一言" },
                  { id: "custom-bg", emoji: "", label: "カスタム背景", desc: "オリジナル画像" },
                ] as { id: BackLayout; emoji: string; label: string; desc: string }[]
              ).map((b) => {
                const sel = data.backLayout === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => update("backLayout", b.id)}
                    className={`flex flex-col items-start gap-0.5 p-2.5 rounded-lg border-2 transition text-left ${
                      sel
                        ? "border-purple-600 bg-purple-50/60"
                        : "border-neutral-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="text-base">{b.emoji}</div>
                    <div
                      className={`text-[11px] font-bold ${
                        sel ? "text-purple-700" : "text-neutral-900"
                      }`}
                    >
                      {b.label}
                    </div>
                    <div className="text-[9px] text-neutral-500 leading-tight">
                      {b.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Per-layout configuration */}
          {data.backLayout === "stamp" && (
            <Section title="スタンプカードの設定" subtitle="リピーターを増やす、お客様の楽しみを">
              <Field label="スタンプ枠数（最大50個）" hint="20個未満は細かく、20個以上は10刻みで">
                <div className="flex gap-1.5 flex-wrap">
                  {[5, 8, 10, 12, 15, 20, 30, 40, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update("stampCount", n)}
                      className={`px-2.5 py-1 rounded-md border text-xs ${
                        data.stampCount === n
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-neutral-700 border-neutral-300 hover:border-purple-400"
                      }`}
                    >
                      {n}個
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="スタンプの形">
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { id: "circle", label: "● 円" },
                      { id: "star", label: "★ 星" },
                      { id: "heart", label: "♥ ハート" },
                      { id: "check", label: "✓ チェック" },
                    ] as { id: StampStyle; label: string }[]
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update("stampStyle", s.id)}
                      className={`px-3 py-1.5 rounded-md border text-sm ${
                        data.stampStyle === s.id
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-neutral-700 border-neutral-300 hover:border-purple-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="特典内容" hint="スタンプを集めると...">
                <input
                  type="text"
                  value={data.stampReward}
                  onChange={(e) => update("stampReward", e.target.value)}
                  placeholder="例: 1杯無料 / 10%割引 / プレゼント"
                  className="input"
                />
              </Field>
              <Field label="補足メモ" optional>
                <input
                  type="text"
                  value={data.stampNote}
                  onChange={(e) => update("stampNote", e.target.value)}
                  placeholder="例: 1日1スタンプまで・有効期限なし"
                  className="input"
                />
              </Field>
            </Section>
          )}

          {data.backLayout === "info" && (
            <Section
              title="詳細情報"
              subtitle="メニュー・サービス・店主の挨拶など"
            >
              <Field label="お店からのメッセージ" hint="2〜3行で">
                <textarea
                  value={data.infoMessage}
                  onChange={(e) => update("infoMessage", e.target.value)}
                  placeholder="例: ご来店ありがとうございます。地元の食材にこだわった料理を提供しています。"
                  rows={2}
                  className="input"
                  style={{ resize: "vertical" }}
                />
              </Field>
              <Field label="サービス・取扱い（1行に1つ）">
                <textarea
                  value={data.services}
                  onChange={(e) => update("services", e.target.value)}
                  placeholder="モーニング&#10;ランチセット&#10;テイクアウト"
                  rows={4}
                  className="input"
                  style={{ resize: "vertical" }}
                />
              </Field>
              <Field label="メニュー / 価格表（1行に1項目「名前 / 価格」）" optional>
                <textarea
                  value={data.pricelist}
                  onChange={(e) => update("pricelist", e.target.value)}
                  placeholder="ブレンドコーヒー / ¥450&#10;カフェラテ / ¥520&#10;ケーキセット / ¥850"
                  rows={4}
                  className="input"
                  style={{ resize: "vertical" }}
                />
              </Field>
            </Section>
          )}

          {data.backLayout === "image" && (
            <Section title="写真メイン" subtitle="店内・商品・雰囲気を伝える1枚">
              <Field label="画像をアップロード">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                    {data.backImageDataUrl ? (
                      <img
                        src={data.backImageDataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] text-neutral-400">未設定</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="shop-back-img"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            update("backImageDataUrl", reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                        if (e.target) e.target.value = "";
                      }}
                    />
                    <label
                      htmlFor="shop-back-img"
                      className="inline-block px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-semibold cursor-pointer hover:bg-purple-700"
                    >
                      画像を選ぶ
                    </label>
                    {data.backImageDataUrl && (
                      <button
                        type="button"
                        onClick={() => update("backImageDataUrl", "")}
                        className="ml-2 text-xs text-neutral-500 hover:text-red-600"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </Field>
              <Field label="キャプション / 一言" optional>
                <input
                  type="text"
                  value={data.backImageCaption}
                  onChange={(e) => update("backImageCaption", e.target.value)}
                  placeholder="例: 季節の野菜たっぷりのワンプレート"
                  className="input"
                />
              </Field>
            </Section>
          )}

          {data.backLayout === "map" && (
            <Section title="地図・アクセス" subtitle="お店までの行き方を伝える">
              <Field label="最寄駅・主要バス停" hint="例: JR渋谷駅 徒歩5分">
                <input
                  type="text"
                  value={data.nearestStation}
                  onChange={(e) => update("nearestStation", e.target.value)}
                  placeholder="JR渋谷駅 西口より徒歩5分"
                  className="input"
                />
              </Field>
              <Field label="道案内（2-3行）" hint="目印・道順を簡潔に">
                <textarea
                  value={data.mapDirections}
                  onChange={(e) => update("mapDirections", e.target.value)}
                  placeholder="ハチ公口を出て道玄坂を上り、コンビニの角を右折。&#10;赤い看板が目印です。"
                  rows={3}
                  className="input"
                  style={{ resize: "vertical" }}
                />
              </Field>
              <Field label="地図画像（任意）" hint="Google Maps等のスクリーンショットをアップロード">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                    {data.mapImageDataUrl ? (
                      <img src={data.mapImageDataUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-neutral-400">地図なし</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="shop-map-img"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            update("mapImageDataUrl", reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                        if (e.target) e.target.value = "";
                      }}
                    />
                    <label
                      htmlFor="shop-map-img"
                      className="inline-block px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-semibold cursor-pointer hover:bg-purple-700"
                    >
                      地図画像を選ぶ
                    </label>
                    {data.mapImageDataUrl && (
                      <button
                        type="button"
                        onClick={() => update("mapImageDataUrl", "")}
                        className="ml-2 text-xs text-neutral-500 hover:text-red-600"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </Field>
            </Section>
          )}

          {data.backLayout === "gallery" && (
            <Section title="ギャラリー（3枚）" subtitle="店内・商品の写真を3枚">
              {[1, 2, 3].map((n) => {
                const key = `galleryImage${n}` as "galleryImage1" | "galleryImage2" | "galleryImage3";
                return (
                  <Field key={n} label={`画像 ${n}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                        {data[key] ? <img src={data[key]} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] text-neutral-400">未設定</span>}
                      </div>
                      <ImageInput id={`gal-${n}`} onPick={(d) => update(key, d)} hasValue={!!data[key]} onClear={() => update(key, "")} />
                    </div>
                  </Field>
                );
              })}
            </Section>
          )}

          {data.backLayout === "coupon" && (
            <Section title="クーポン" subtitle="ラベル・特典・有効期限などを自由に設定">
              <Field label="ラベル（上部の見出し）" hint="クーポン上部に表示される飾り文字">
                <input
                  type="text"
                  value={data.couponLabel}
                  onChange={(e) => update("couponLabel", e.target.value)}
                  placeholder="例: SPECIAL COUPON / お得な特典 / VIP TICKET"
                  className="input"
                />
              </Field>
              <Field label="メインタイトル（大きく表示）">
                <input
                  type="text"
                  value={data.couponTitle}
                  onChange={(e) => update("couponTitle", e.target.value)}
                  placeholder="例: 10% OFF / 1杯無料"
                  className="input"
                />
              </Field>
              <Field label="詳細" optional>
                <input
                  type="text"
                  value={data.couponDetail}
                  onChange={(e) => update("couponDetail", e.target.value)}
                  placeholder="例: ご来店時にこのカードを提示"
                  className="input"
                />
              </Field>
              <Field label="有効期限" optional>
                <input
                  type="text"
                  value={data.couponExpiry}
                  onChange={(e) => update("couponExpiry", e.target.value)}
                  placeholder="例: 2026/12/31"
                  className="input"
                />
              </Field>
            </Section>
          )}

          {data.backLayout === "badge" && (
            <Section title="バッジ" subtitle="受賞・認定・実績">
              <Field label="バッジテキスト"><input type="text" value={data.badgeText} onChange={(e) => update("badgeText", e.target.value)} placeholder="例: 厳選素材 / 特別認定" className="input" /></Field>
              <Field label="年" optional><input type="text" value={data.badgeYear} onChange={(e) => update("badgeYear", e.target.value)} placeholder="2026" className="input" /></Field>
            </Section>
          )}

          {data.backLayout === "qr-shop" && (
            <Section title="QRショップ" subtitle="オンラインショップURL">
              <Field label="QRラベル"><input type="text" value={data.qrLabel} onChange={(e) => update("qrLabel", e.target.value)} placeholder="例: ONLINE SHOP / WEB予約" className="input" /></Field>
              <Field label="URL"><input type="url" value={data.qrUrl} onChange={(e) => update("qrUrl", e.target.value)} placeholder="https://..." className="input" /></Field>
            </Section>
          )}

          {data.backLayout === "message-big" && (
            <Section title="大メッセージ" subtitle="心に残る一言を大きく">
              <Field label="メッセージ（日本語）"><input type="text" value={data.bigMessage} onChange={(e) => update("bigMessage", e.target.value)} placeholder="例: ありがとうございます" className="input" /></Field>
              <Field label="サブメッセージ（英語）" optional><input type="text" value={data.bigMessageEn} onChange={(e) => update("bigMessageEn", e.target.value)} placeholder="THANK YOU" className="input" /></Field>
            </Section>
          )}

          {data.backLayout === "custom" && (
            <Section title="自由テキスト" subtitle="メッセージ・営業案内・告知など">
              <Field label="見出し" optional>
                <input
                  type="text"
                  value={data.customBackTitle}
                  onChange={(e) => update("customBackTitle", e.target.value)}
                  placeholder="例: ご利用ありがとうございます"
                  className="input"
                />
              </Field>
              <Field label="本文（自由に複数行）">
                <textarea
                  value={data.customBackText}
                  onChange={(e) => update("customBackText", e.target.value)}
                  placeholder="店舗からのお知らせ、コンセプト、感謝のメッセージなど自由に記入"
                  rows={6}
                  className="input"
                  style={{ resize: "vertical" }}
                />
              </Field>
            </Section>
          )}

          {data.backLayout === "custom-bg" && (
            <Section
              title="裏面カスタム背景"
              subtitle="オリジナル画像を裏面の背景に全面配置"
            >
              <Field label="裏面の背景画像">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                    {data.backCustomBackgroundDataUrl ? (
                      <img
                        src={data.backCustomBackgroundDataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] text-neutral-400">未設定</span>
                    )}
                  </div>
                  <ImageInput
                    id="shop-custom-bg-back-2"
                    onPick={(d) => update("backCustomBackgroundDataUrl", d)}
                    hasValue={!!data.backCustomBackgroundDataUrl}
                    onClear={() => update("backCustomBackgroundDataUrl", "")}
                  />
                </div>
              </Field>
              {data.backCustomBackgroundDataUrl && (
                <Field
                  label={`背景の濃さ ${Math.round(data.backCustomBackgroundOpacity * 100)}%`}
                >
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={data.backCustomBackgroundOpacity}
                    onChange={(e) =>
                      update(
                        "backCustomBackgroundOpacity",
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-full"
                  />
                </Field>
              )}
              <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.backCustomBgShowText}
                  onChange={(e) => update("backCustomBgShowText", e.target.checked)}
                />
                <span>背景の上にテキストを重ねる</span>
              </label>
              {data.backCustomBgShowText && (
                <Field label="重ねるテキスト" optional>
                  <textarea
                    value={data.backCustomBgText}
                    onChange={(e) => update("backCustomBgText", e.target.value)}
                    placeholder="例: ENJOY YOUR DAY"
                    rows={2}
                    className="input"
                    style={{ resize: "vertical" }}
                  />
                </Field>
              )}
            </Section>
          )}

          {/* Colors */}
          <Section title="ブランドカラー" subtitle="お店の雰囲気に合わせて">
            <div className="grid grid-cols-2 gap-3">
              <Field label="メインカラー">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.brandColor}
                    onChange={(e) => update("brandColor", e.target.value)}
                    className="w-12 h-10 border border-neutral-300 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono">{data.brandColor.toUpperCase()}</span>
                </div>
              </Field>
              <Field label="アクセントカラー">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.accentColor}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="w-12 h-10 border border-neutral-300 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono">{data.accentColor.toUpperCase()}</span>
                </div>
              </Field>
            </div>
          </Section>

          {/* 自由レイアウト・エディタ — 名札/一括メーカーと同仕様。
              全テンプレ共通で「整列・全体サイズ」と「各要素のON/OFF・X/Y・倍率」を提供。
              テンプレ側の要素に `data-role="..."` を持たせた箇所に効きます。 */}
          <ShopFreeLayoutEditor
            shopFreeLayout={data.shopFreeLayout}
            onChange={(next) => update("shopFreeLayout", next)}
          />

          <div className="rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/40 p-4 text-[11px] text-purple-900 leading-relaxed">
            ⚙️ <strong>これは BETA 版のモデルページです。</strong>
            印刷対応・テンプレート選択・QR連携などは順次追加予定です。
            ご要望があれば教えてください。
          </div>
        </div>

        {/* Live preview aside */}
        <aside className="hidden lg:flex flex-col gap-3 sticky top-20 self-start w-[400px] flex-shrink-0">
          <div className="text-xs font-semibold text-neutral-500 tracking-wider uppercase">
            👀 プレビュー
          </div>
          <ShopCardPreview data={data} side="front" />
          <ShopCardPreview data={data} side="back" />
        </aside>
      </main>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d4d4d4;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: white;
          transition: border-color 0.15s;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #7c3aed;
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-purple-100 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
        {subtitle && (
          <p className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xs font-semibold text-neutral-700">{label}</span>
        {optional && (
          <span className="text-[9px] text-neutral-500">任意</span>
        )}
      </div>
      {children}
      {hint && <div className="text-[10px] text-neutral-500 mt-1">{hint}</div>}
    </label>
  );
}

function ShopCardPreview({
  data,
  side,
}: {
  data: ShopCardData;
  side: "front" | "back";
}) {
  // 自由レイアウト・エディタ — 各要素の位置・サイズ・表示ON/OFFを
  // 全テンプレ共通の CSS 上書きで適用。data-role 属性を持つ要素に対して
  // 影響する（テンプレ側で data-role を付与した要素のみ反映）。
  const fl = data.shopFreeLayout;
  const sideFl = side === "front" ? fl.front : fl.back;
  const scopeId = `shopfl-${side}`;
  const css = useMemo(() => {
    const rules: string[] = [];
    // 整列方向
    if (fl.align) {
      rules.push(
        `#${scopeId} [data-role] { text-align: ${fl.align}; }`,
      );
    }
    // 各 role に対し offset / sizeScale / hidden を CSS で適用
    (Object.keys(sideFl.hidden) as ShopFreeLayoutKey[]).forEach((k) => {
      if (sideFl.hidden[k]) {
        rules.push(`#${scopeId} [data-role="${k}"] { display: none !important; }`);
      }
    });
    (Object.keys(sideFl.offset) as ShopFreeLayoutKey[]).forEach((k) => {
      const o = sideFl.offset[k];
      if (o && (o.x !== 0 || o.y !== 0)) {
        rules.push(
          `#${scopeId} [data-role="${k}"] { transform: translate(${o.x}mm, ${o.y}mm); }`,
        );
      }
    });
    (Object.keys(sideFl.sizeScale) as ShopFreeLayoutKey[]).forEach((k) => {
      const s = sideFl.sizeScale[k];
      if (s && s !== 1) {
        rules.push(
          `#${scopeId} [data-role="${k}"] { font-size: ${Math.round(s * 100)}% !important; }`,
        );
      }
    });
    return rules.join("\n");
  }, [fl.align, sideFl, scopeId]);

  return (
    <div>
      <div className="text-[10px] text-neutral-500 mb-1 tracking-wider uppercase">
        {side === "front" ? "表面" : "裏面"}
      </div>
      <div className="bg-neutral-100 rounded-xl p-4 flex items-center justify-center">
        {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
        <div
          id={scopeId}
          className="card-frame relative overflow-hidden"
          style={{
            width: "91mm",
            height: "55mm",
            backgroundColor: side === "front" ? data.brandColor : "#ffffff",
            color: side === "front" ? "#ffffff" : "#171717",
            fontFamily: "'Helvetica Neue', system-ui, sans-serif",
            // 自由レイアウトの全体サイズ倍率 — 中央基点で拡縮
            transform: `scale(${fl.globalScale})`,
            transformOrigin: "center center",
          }}
        >
          {side === "front" ? (
            <FrontView data={data} />
          ) : (
            <BackView data={data} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Logo overlay — applied on top of every front template so the user can
 * place their shop logo anywhere on the card with consistent size+position
 * regardless of which template is selected.
 */
function LogoOverlay({ data }: { data: ShopCardData }) {
  if (!data.logoDataUrl) return null;
  const positions: Record<
    ShopCardData["logoPositionId"],
    React.CSSProperties
  > = {
    "top-left": { top: "3mm", left: "3mm" },
    "top-center": { top: "3mm", left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: "3mm", right: "3mm" },
    "middle-left": { top: "50%", left: "3mm", transform: "translateY(-50%)" },
    "middle-center": {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    },
    "middle-right": { top: "50%", right: "3mm", transform: "translateY(-50%)" },
    "bottom-left": { bottom: "3mm", left: "3mm" },
    "bottom-center": { bottom: "3mm", left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: "3mm", right: "3mm" },
  };
  const baseStyle = positions[data.logoPositionId];
  const presetTransform = (baseStyle.transform as string | undefined) ?? "";
  const dx = data.logoOffsetXmm;
  const dy = data.logoOffsetYmm;
  const composedTransform =
    dx === 0 && dy === 0
      ? presetTransform || undefined
      : `${presetTransform} translate(${dx}mm, ${dy}mm)`.trim();
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        ...baseStyle,
        transform: composedTransform,
        zIndex: 30,
      }}
    >
      <div
        style={{
          backgroundColor: data.logoWithBackground ? "#ffffff" : "transparent",
          padding: data.logoWithBackground ? "1mm" : 0,
          borderRadius: data.logoWithBackground ? "0.5mm" : 0,
        }}
      >
        <img
          src={data.logoDataUrl}
          alt=""
          style={{
            width: `${data.logoSizeMm}mm`,
            height: `${data.logoSizeMm}mm`,
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

function FrontView({ data }: { data: ShopCardData }) {
  // Render the chosen template, then layer the logo on top so logo
  // placement is consistent across all 20 templates.
  const inner = renderFrontTemplate(data);
  return (
    <>
      {inner}
      <LogoOverlay data={data} />
    </>
  );
}

function renderFrontTemplate(data: ShopCardData) {
  // We pass a stripped logo-less data into legacy templates so they
  // don't double-render the logo. The overlay above handles it.
  const noLogo: ShopCardData = { ...data, logoDataUrl: "" };
  const d = noLogo;
  switch (data.frontTemplate) {
    case "banner": return <FrontBanner data={d} />;
    case "centered": return <FrontCentered data={d} />;
    case "split": return <FrontSplit data={d} />;
    case "photo": return <FrontPhoto data={d} />;
    case "elegant": return <FrontElegant data={d} />;
    case "custom-bg": return <FrontCustomBg data={d} />;
    case "tag": return <FrontTag data={d} />;
    case "ribbon": return <FrontRibbon data={d} />;
    case "circle-mark": return <FrontCircleMark data={d} />;
    case "side-stripe": return <FrontSideStripe data={d} />;
    case "horizontal-bar": return <FrontHorizontalBar data={d} />;
    case "diagonal": return <FrontDiagonal data={d} />;
    case "frame-double": return <FrontFrameDouble data={d} />;
    case "stamp-style": return <FrontStampStyle data={d} />;
    case "kraft": return <FrontKraft data={d} />;
    case "pastel": return <FrontPastel data={d} />;
    case "neon": return <FrontNeon data={d} />;
    case "vintage": return <FrontVintage data={d} />;
    case "monogram-block": return <FrontMonogramBlock data={d} />;
    case "minimal":
    default: return <FrontMinimal data={d} />;
  }
}

function ContactBlock({ data, color }: { data: ShopCardData; color?: string }) {
  return (
    <div className="text-[6.5pt] leading-[1.5] grid gap-y-[0.3mm]" style={{ color }}>
      {data.address && (
        <div data-role="address" className="flex items-start gap-1">
          <Icon kind="pin" size="2.4mm" className="shrink-0 mt-[0.3mm]" />
          <span>{data.address}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-[2mm]">
        {data.phone && (
          <div data-role="phone" className="flex items-center gap-1">
            <Icon kind="phone" size="2.4mm" className="shrink-0" />
            {data.phone}
          </div>
        )}
        {data.hours && <div data-role="hours">🕐 {data.hours}</div>}
      </div>
      {data.closedDay && <div>定休日: {data.closedDay}</div>}
      {(data.website || data.instagram) && (
        <div className="flex gap-x-[3mm] flex-wrap">
          {data.website && (
            <span data-role="website" className="flex items-center gap-1">
              <Icon kind="web" size="2.4mm" className="shrink-0" />
              {data.website}
            </span>
          )}
          {data.instagram && (
            <span data-role="instagram" className="flex items-center gap-1">
              <Icon kind="ig" size="2.4mm" className="shrink-0" />
              {data.instagram}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FrontMinimal({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-[7mm]">
      <div>
        {data.category && (
          <div
            data-role="category"
            className="text-[6.5pt] tracking-[0.3em] uppercase font-semibold mb-[2mm]"
            style={{ color: data.accentColor }}
          >
            {data.category}
          </div>
        )}
        <div data-role="shopName" className="text-[18pt] font-bold leading-tight tracking-[-0.02em]">
          {data.shopName || "店舗名"}
        </div>
        {data.shopNameEn && (
          <div data-role="shopNameEn" className="text-[7pt] tracking-[0.25em] uppercase mt-[1mm] opacity-85">
            {data.shopNameEn}
          </div>
        )}
        {data.tagline && (
          <div data-role="tagline" className="text-[7.5pt] mt-[2mm] italic opacity-90">{data.tagline}</div>
        )}
      </div>
      <ContactBlock data={data} />
      {data.logoDataUrl && (
        <img data-role="logo" src={data.logoDataUrl} alt="" className="absolute top-[5mm] right-[5mm] w-[12mm] h-[12mm] object-contain" />
      )}
    </div>
  );
}

function FrontBanner({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div
        className="h-[40%] flex items-center justify-center text-center px-[6mm]"
        style={{ backgroundColor: data.brandColor, color: "#ffffff" }}
      >
        <div>
          {data.category && (
            <div
              className="text-[6pt] tracking-[0.4em] uppercase mb-[1mm]"
              style={{ color: data.accentColor }}
            >
              {data.category}
            </div>
          )}
          <div className="text-[16pt] font-bold leading-tight">{data.shopName || "店舗名"}</div>
          {data.shopNameEn && (
            <div className="text-[6pt] tracking-[0.25em] uppercase mt-[0.5mm] opacity-85">
              {data.shopNameEn}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-[5mm] bg-white text-neutral-900">
        {data.tagline && (
          <div className="text-[7pt] italic mb-[2mm]" style={{ color: data.brandColor }}>
            {data.tagline}
          </div>
        )}
        <ContactBlock data={data} color="#404040" />
      </div>
      {data.logoDataUrl && (
        <img src={data.logoDataUrl} alt="" className="absolute top-[3mm] right-[3mm] w-[10mm] h-[10mm] object-contain bg-white/80 rounded p-[1mm]" />
      )}
    </div>
  );
}

function FrontCentered({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-[6mm] bg-white text-neutral-900">
      {data.logoDataUrl ? (
        <img src={data.logoDataUrl} alt="" className="w-[14mm] h-[14mm] object-contain mb-[1.5mm]" />
      ) : (
        data.frontImageDataUrl && (
          <img src={data.frontImageDataUrl} alt="" className="w-[14mm] h-[14mm] object-cover rounded-full mb-[1.5mm] border-2" style={{ borderColor: data.brandColor }} />
        )
      )}
      {data.category && (
        <div
          className="text-[5.5pt] tracking-[0.3em] uppercase mb-[0.5mm]"
          style={{ color: data.accentColor || data.brandColor }}
        >
          {data.category}
        </div>
      )}
      <div
        className="text-[15pt] font-bold leading-tight"
        style={{ color: data.brandColor }}
      >
        {data.shopName || "店舗名"}
      </div>
      {data.shopNameEn && (
        <div className="text-[6pt] tracking-[0.2em] uppercase opacity-70">{data.shopNameEn}</div>
      )}
      {data.tagline && (
        <div className="text-[6.5pt] italic mt-[1mm] mb-[2mm] opacity-80">{data.tagline}</div>
      )}
      <div className="h-px w-[14mm] my-[1mm]" style={{ backgroundColor: data.brandColor }} />
      <ContactBlock data={data} color="#525252" />
    </div>
  );
}

function FrontSplit({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex">
      <div
        className="w-[40%] flex flex-col justify-center items-center text-center p-[3mm]"
        style={{ backgroundColor: data.brandColor, color: "#ffffff" }}
      >
        {data.logoDataUrl && (
          <img src={data.logoDataUrl} alt="" className="w-[12mm] h-[12mm] object-contain mb-[1mm]" />
        )}
        {data.category && (
          <div className="text-[5pt] tracking-[0.3em] uppercase opacity-90" style={{ color: data.accentColor }}>
            {data.category}
          </div>
        )}
        <div className="text-[10pt] font-bold leading-tight mt-[1mm]">{data.shopName || "店舗名"}</div>
        {data.shopNameEn && (
          <div className="text-[5pt] tracking-[0.2em] uppercase mt-[0.5mm] opacity-75">
            {data.shopNameEn}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center p-[5mm] bg-white">
        {data.tagline && (
          <div className="text-[7.5pt] italic mb-[2mm]" style={{ color: data.brandColor }}>
            {data.tagline}
          </div>
        )}
        <ContactBlock data={data} color="#404040" />
      </div>
    </div>
  );
}

function FrontPhoto({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="h-[55%] relative overflow-hidden">
        {data.frontImageDataUrl ? (
          <img src={data.frontImageDataUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[6.5pt] text-neutral-500"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,#e5e5e5 0 6px,#f5f5f5 6px 12px)" }}
          >
            画像をアップロード
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-[2mm] left-[5mm] right-[5mm] text-white">
          {data.category && (
            <div className="text-[5.5pt] tracking-[0.3em] uppercase opacity-90" style={{ color: data.accentColor }}>
              {data.category}
            </div>
          )}
          <div className="text-[12pt] font-bold leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            {data.shopName || "店舗名"}
          </div>
        </div>
      </div>
      <div className="flex-1 p-[4mm] bg-white">
        {data.tagline && (
          <div className="text-[6.5pt] italic mb-[1mm]" style={{ color: data.brandColor }}>
            {data.tagline}
          </div>
        )}
        <ContactBlock data={data} color="#404040" />
      </div>
    </div>
  );
}

function FrontElegant({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white text-neutral-900 p-[5mm]">
      <div
        className="absolute inset-[3mm] border pointer-events-none"
        style={{ borderColor: data.brandColor, borderWidth: "0.3mm" }}
      />
      <div
        className="absolute inset-[3.6mm] border pointer-events-none"
        style={{ borderColor: data.accentColor, borderWidth: "0.1mm" }}
      />
      <div className="relative flex-1 flex flex-col justify-center items-center text-center px-[4mm]">
        {data.logoDataUrl && (
          <img src={data.logoDataUrl} alt="" className="w-[11mm] h-[11mm] object-contain mb-[1mm]" />
        )}
        {data.category && (
          <div className="text-[5.5pt] tracking-[0.4em] uppercase mb-[1mm]" style={{ color: data.brandColor }}>
            — {data.category} —
          </div>
        )}
        <div
          className="text-[14pt] font-semibold leading-tight"
          style={{ fontFamily: "'Hiragino Mincho ProN', serif", color: data.brandColor }}
        >
          {data.shopName || "店舗名"}
        </div>
        {data.shopNameEn && (
          <div className="text-[5.5pt] tracking-[0.3em] uppercase mt-[0.5mm] opacity-70">{data.shopNameEn}</div>
        )}
        {data.tagline && (
          <div className="text-[6pt] italic mt-[1.5mm] opacity-80">{data.tagline}</div>
        )}
      </div>
      <div className="relative">
        <ContactBlock data={data} color="#525252" />
      </div>
    </div>
  );
}

function FrontCustomBg({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {data.customBackgroundDataUrl ? (
        <img src={data.customBackgroundDataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: data.customBackgroundOpacity }} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[6.5pt] text-neutral-400" style={{ backgroundImage: "repeating-linear-gradient(45deg,#e5e5e5 0 6px,#f5f5f5 6px 12px)" }}>背景画像をアップロード</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="relative flex-1 flex flex-col justify-end p-[6mm] text-white">
        {data.category && <div className="text-[6pt] tracking-[0.3em] uppercase mb-[1mm]" style={{ color: data.accentColor }}>{data.category}</div>}
        <div className="text-[15pt] font-bold leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[7pt] italic mt-[1mm] opacity-95">{data.tagline}</div>}
        <div className="mt-[2mm]"><ContactBlock data={data} color="#ffffff" /></div>
      </div>
    </div>
  );
}

function FrontTag({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col p-[5mm] bg-white">
      <div className="self-start px-[3mm] py-[1.5mm] text-white" style={{ backgroundColor: data.brandColor }}>
        <div className="text-[14pt] font-bold leading-none">{data.shopName || "店舗名"}</div>
      </div>
      {data.shopNameEn && <div className="text-[6pt] tracking-[0.3em] uppercase mt-[1mm] opacity-70">{data.shopNameEn}</div>}
      {data.category && <div className="text-[6pt] mt-[0.5mm]" style={{ color: data.accentColor }}>{data.category}</div>}
      {data.tagline && <div className="text-[7pt] italic mt-[1.5mm]" style={{ color: data.brandColor }}>{data.tagline}</div>}
      <div className="flex-1" />
      <ContactBlock data={data} color="#525252" />
    </div>
  );
}

function FrontRibbon({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="relative pt-[6mm]">
        <div className="absolute top-0 left-[-2mm] right-[-2mm] h-[7mm]" style={{ backgroundColor: data.brandColor }} />
        <div className="relative text-center text-white py-[1mm]" style={{ backgroundColor: data.brandColor }}>
          {data.category && <div className="text-[6pt] tracking-[0.3em] uppercase opacity-90" style={{ color: data.accentColor }}>{data.category}</div>}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center p-[5mm] text-center">
        <div className="text-[16pt] font-bold leading-tight" style={{ color: data.brandColor }}>{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[7pt] italic mt-[1mm] opacity-80">{data.tagline}</div>}
      </div>
      <div className="p-[4mm] pt-0"><ContactBlock data={data} color="#525252" /></div>
    </div>
  );
}

function FrontCircleMark({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex p-[5mm] bg-white">
      <div className="w-[20mm] h-[20mm] rounded-full self-center flex items-center justify-center shrink-0" style={{ backgroundColor: data.brandColor, color: "#ffffff" }}>
        {data.logoDataUrl ? <img src={data.logoDataUrl} alt="" className="w-[14mm] h-[14mm] object-contain" /> : <span className="text-[12pt] font-bold">{(data.shopName || "S").charAt(0)}</span>}
      </div>
      <div className="flex-1 flex flex-col justify-center pl-[4mm] min-w-0">
        {data.category && <div className="text-[5.5pt] tracking-[0.3em] uppercase mb-[0.5mm]" style={{ color: data.accentColor }}>{data.category}</div>}
        <div className="text-[13pt] font-bold leading-tight" style={{ color: data.brandColor }}>{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[6.5pt] italic mt-[1mm] opacity-80">{data.tagline}</div>}
        <div className="mt-[1.5mm]"><ContactBlock data={data} color="#525252" /></div>
      </div>
    </div>
  );
}

function FrontSideStripe({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex bg-white">
      <div className="w-[5mm]" style={{ backgroundColor: data.brandColor }} />
      <div className="flex-1 flex flex-col justify-center p-[5mm] min-w-0">
        {data.category && <div className="text-[6pt] tracking-[0.3em] uppercase mb-[1mm]" style={{ color: data.brandColor }}>{data.category}</div>}
        <div className="text-[15pt] font-bold leading-tight" style={{ color: data.brandColor }}>{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[7pt] italic mt-[1mm] opacity-80">{data.tagline}</div>}
        <div className="mt-[2mm]"><ContactBlock data={data} color="#525252" /></div>
      </div>
    </div>
  );
}

function FrontHorizontalBar({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col p-[5mm] bg-white justify-center">
      <div className="text-center mb-[2mm]">
        {data.category && <div className="text-[6pt] tracking-[0.3em] uppercase mb-[1mm]" style={{ color: data.accentColor }}>{data.category}</div>}
        <div className="text-[16pt] font-bold leading-tight" style={{ color: data.brandColor }}>{data.shopName || "店舗名"}</div>
      </div>
      <div className="h-[0.5mm] w-full my-[2mm]" style={{ backgroundColor: data.brandColor }} />
      <ContactBlock data={data} color="#525252" />
    </div>
  );
}

function FrontDiagonal({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      <div className="absolute inset-0" style={{ background: data.brandColor, clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 80%)" }} />
      <div className="absolute top-[5mm] left-[5mm] right-[5mm] text-white">
        {data.category && <div className="text-[6pt] tracking-[0.3em] uppercase mb-[1mm]" style={{ color: data.accentColor }}>{data.category}</div>}
        <div className="text-[16pt] font-bold leading-tight" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[6.5pt] italic mt-[0.5mm] opacity-90">{data.tagline}</div>}
      </div>
      <div className="absolute bottom-[5mm] left-[5mm] right-[5mm]"><ContactBlock data={data} color="#404040" /></div>
    </div>
  );
}

function FrontFrameDouble({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 bg-white p-[2mm]">
      <div className="absolute inset-[3mm] border" style={{ borderColor: data.brandColor, borderWidth: "0.4mm" }} />
      <div className="absolute inset-[4mm] border" style={{ borderColor: data.accentColor, borderWidth: "0.15mm" }} />
      <div className="relative h-full flex flex-col justify-center items-center text-center px-[6mm]">
        {data.category && <div className="text-[5.5pt] tracking-[0.4em] uppercase mb-[1mm]" style={{ color: data.brandColor }}>— {data.category} —</div>}
        <div className="text-[14pt] font-bold leading-tight" style={{ color: data.brandColor }}>{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[6.5pt] italic mt-[1mm] opacity-80">{data.tagline}</div>}
        <div className="h-px w-[10mm] my-[2mm]" style={{ backgroundColor: data.brandColor }} />
        <ContactBlock data={data} color="#525252" />
      </div>
    </div>
  );
}

function FrontStampStyle({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 bg-amber-50 p-[5mm] flex flex-col justify-center">
      <div className="self-start border-[0.6mm] rounded-full px-[4mm] py-[2mm]" style={{ borderColor: data.brandColor, color: data.brandColor }}>
        <div className="text-[5pt] tracking-[0.3em] uppercase opacity-70">SHOP CARD</div>
        <div className="text-[10pt] font-bold leading-tight">{data.shopName || "店舗名"}</div>
      </div>
      {data.tagline && <div className="text-[7pt] italic mt-[2mm]" style={{ color: data.brandColor }}>{data.tagline}</div>}
      <div className="flex-1" />
      <ContactBlock data={data} color="#525252" />
    </div>
  );
}

function FrontKraft({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 p-[5mm] flex flex-col" style={{ backgroundColor: "#d2b48c", color: "#3e2723" }}>
      <div className="border-b-2 pb-[2mm] mb-[2mm]" style={{ borderColor: "#3e2723" }}>
        {data.category && <div className="text-[6pt] tracking-[0.3em] uppercase opacity-70">{data.category}</div>}
        <div className="text-[15pt] font-bold leading-tight" style={{ fontFamily: "'Hiragino Mincho ProN', serif" }}>{data.shopName || "店舗名"}</div>
        {data.shopNameEn && <div className="text-[6pt] tracking-[0.2em] uppercase opacity-65 mt-[0.5mm]">{data.shopNameEn}</div>}
      </div>
      {data.tagline && <div className="text-[7pt] italic mb-[2mm]">{data.tagline}</div>}
      <div className="flex-1" />
      <ContactBlock data={data} color="#3e2723" />
    </div>
  );
}

function FrontPastel({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 p-[5mm] flex flex-col" style={{ background: `linear-gradient(135deg, ${data.accentColor}40, ${data.brandColor}30)`, color: data.brandColor }}>
      <div className="text-center">
        {data.category && <div className="text-[6pt] tracking-[0.3em] uppercase mb-[1mm] opacity-80">{data.category}</div>}
        <div className="text-[16pt] font-bold leading-tight">{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[6.5pt] italic mt-[1mm] opacity-85">{data.tagline}</div>}
      </div>
      <div className="flex-1" />
      <div className="bg-white/70 backdrop-blur-sm rounded p-[2mm]"><ContactBlock data={data} color="#404040" /></div>
    </div>
  );
}

function FrontNeon({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 p-[5mm] flex flex-col" style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}>
      <div>
        {data.category && <div className="text-[6pt] tracking-[0.4em] uppercase mb-[1mm]" style={{ color: data.accentColor, textShadow: `0 0 8px ${data.accentColor}` }}>{data.category}</div>}
        <div className="text-[16pt] font-bold leading-tight" style={{ color: data.brandColor, textShadow: `0 0 10px ${data.brandColor}, 0 0 20px ${data.brandColor}88` }}>{data.shopName || "店舗名"}</div>
        {data.shopNameEn && <div className="text-[6.5pt] tracking-[0.3em] uppercase mt-[0.5mm] opacity-75">{data.shopNameEn}</div>}
        {data.tagline && <div className="text-[6.5pt] italic mt-[1mm] opacity-85">{data.tagline}</div>}
      </div>
      <div className="flex-1" />
      <ContactBlock data={data} color="#bbbbbb" />
    </div>
  );
}

function FrontVintage({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 p-[4mm] flex flex-col" style={{ backgroundColor: "#fef9f0", color: "#5b4636" }}>
      <div className="border-2 flex-1 flex flex-col p-[3mm]" style={{ borderColor: "#5b4636", borderStyle: "double", borderWidth: "0.4mm" }}>
        <div className="text-center pb-[2mm] border-b" style={{ borderColor: "#5b463640" }}>
          <div className="text-[5pt] tracking-[0.5em] uppercase opacity-60">— EST. {data.badgeYear || "—"} —</div>
          <div className="text-[14pt] font-semibold mt-[0.5mm]" style={{ fontFamily: "'Hiragino Mincho ProN', serif" }}>{data.shopName || "店舗名"}</div>
          {data.shopNameEn && <div className="text-[5.5pt] tracking-[0.3em] uppercase mt-[0.5mm] italic">{data.shopNameEn}</div>}
        </div>
        {data.tagline && <div className="text-[6.5pt] italic mt-[2mm] text-center">"{data.tagline}"</div>}
        <div className="flex-1" />
        <ContactBlock data={data} color="#5b4636" />
      </div>
    </div>
  );
}

function FrontMonogramBlock({ data }: { data: ShopCardData }) {
  const initial = (data.shopNameEn || data.shopName || "S").charAt(0).toUpperCase();
  return (
    <div className="absolute inset-0 flex bg-white">
      <div className="w-[35%] flex items-center justify-center" style={{ backgroundColor: data.brandColor, color: "#ffffff" }}>
        <div className="text-[36pt] font-black leading-none">{initial}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center p-[4mm] min-w-0">
        {data.category && <div className="text-[5.5pt] tracking-[0.3em] uppercase mb-[1mm]" style={{ color: data.accentColor }}>{data.category}</div>}
        <div className="text-[12pt] font-bold leading-tight" style={{ color: data.brandColor }}>{data.shopName || "店舗名"}</div>
        {data.tagline && <div className="text-[6pt] italic mt-[1mm] opacity-80">{data.tagline}</div>}
        <div className="mt-[2mm]"><ContactBlock data={data} color="#525252" /></div>
      </div>
    </div>
  );
}

function ImageInput({
  id,
  onPick,
  hasValue,
  onClear,
}: {
  id: string;
  onPick: (dataUrl: string) => void;
  hasValue: boolean;
  onClear: () => void;
}) {
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        id={id}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") onPick(reader.result);
          };
          reader.readAsDataURL(file);
          if (e.target) e.target.value = "";
        }}
      />
      <label
        htmlFor={id}
        className="inline-block px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-semibold cursor-pointer hover:bg-purple-700"
      >
        画像を選ぶ
      </label>
      {hasValue && (
        <button type="button" onClick={onClear} className="ml-2 text-xs text-neutral-500 hover:text-red-600">
          削除
        </button>
      )}
    </div>
  );
}

function BackView({ data }: { data: ShopCardData }) {
  if (data.backLayout !== "stamp") {
    if (data.backLayout === "info") return <InfoBackView data={data} />;
    if (data.backLayout === "image") return <ImageBackView data={data} />;
    if (data.backLayout === "map") return <MapBackView data={data} />;
    if (data.backLayout === "custom") return <CustomBackView data={data} />;
    if (data.backLayout === "gallery") return <GalleryBackView data={data} />;
    if (data.backLayout === "coupon") return <CouponBackView data={data} />;
    if (data.backLayout === "badge") return <BadgeBackView data={data} />;
    if (data.backLayout === "qr-shop") return <QrShopBackView data={data} />;
    if (data.backLayout === "message-big") return <MessageBigBackView data={data} />;
    if (data.backLayout === "custom-bg") return <CustomBgBackView data={data} />;
  }
  // Calculate the best grid for any stampCount (3–50). Available space on
  // a 91×55mm back is roughly 83mm × 39mm. We score every plausible (cols,
  // rows) and pick the one that:
  //   • leaves no/few empty cells
  //   • matches the card's horizontal aspect ratio
  //   • lets each cell stay >= 4mm
  const N = data.stampCount;
  const { cols, rows, slotMm } = pickStampGrid(N);
  const gapMm = slotMm >= 8 ? 0.8 : slotMm >= 6 ? 0.6 : 0.4;
  const stamps = Array.from({ length: data.stampCount });

  const stampSym =
    data.stampStyle === "star"
      ? "★"
      : data.stampStyle === "heart"
        ? "♥"
        : data.stampStyle === "check"
          ? "✓"
          : "●";

  return (
    <div className="absolute inset-0 flex flex-col p-[4mm]">
      <div className="text-center mb-[1mm] shrink-0">
        <div
          className="text-[7pt] font-bold tracking-[0.2em] uppercase"
          style={{ color: data.brandColor }}
        >
          STAMP CARD
        </div>
        {data.stampReward && (
          <div className="text-[6pt] mt-[0.3mm] text-neutral-700 truncate">
            {data.stampReward}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${slotMm}mm)`,
            gridTemplateRows: `repeat(${rows}, ${slotMm}mm)`,
            gap: `${gapMm}mm`,
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          {stamps.map((_, i) => (
            <StampSlot
              key={i}
              index={i + 1}
              style={data.stampStyle}
              color={data.brandColor}
              sizeMm={slotMm}
            />
          ))}
        </div>
      </div>

      {data.stampNote && (
        <div className="text-[5.5pt] text-center text-neutral-600 mt-[1mm]">
          {data.stampNote}
        </div>
      )}
    </div>
  );
}

/**
 * Single stamp slot. Each stampStyle (circle / star / heart / check) maps
 * to a visually distinct empty placeholder so the user can immediately
 * recognize which style is active.
 */
/**
 * Pick (cols, rows, slot) — uses hand-tuned presets for common counts so
 * the grid fills the entire back area; falls back to a search for arbitrary N.
 */
function pickStampGrid(N: number): { cols: number; rows: number; slotMm: number } {
  const W = 83; // mm available width on the back
  const H = 39; // mm available height
  // Card back is wide (~83 × 39mm). To fully use that horizontal space and
  // mirror the 15-stamp 5×3 feeling, we prefer "many columns, few rows".
  const presets: Record<number, { cols: number; rows: number }> = {
    5: { cols: 5, rows: 1 },
    8: { cols: 4, rows: 2 },
    10: { cols: 5, rows: 2 },
    12: { cols: 6, rows: 2 },
    15: { cols: 5, rows: 3 },
    16: { cols: 8, rows: 2 },
    18: { cols: 9, rows: 2 },
    20: { cols: 10, rows: 2 },
    30: { cols: 10, rows: 3 },
    40: { cols: 10, rows: 4 },
    50: { cols: 10, rows: 5 },
  };
  const fitSlot = (cols: number, rows: number) => {
    const wFit = (W - (cols - 1) * 0.5) / cols;
    const hFit = (H - (rows - 1) * 0.5) / rows;
    return Math.max(4, Math.floor(Math.min(wFit, hFit, 12) * 2) / 2);
  };
  if (presets[N]) {
    const { cols, rows } = presets[N];
    return { cols, rows, slotMm: fitSlot(cols, rows) };
  }
  let best = { cols: N, rows: 1, slotMm: 5, score: Infinity };
  for (let rows = 1; rows <= 8; rows++) {
    const cols = Math.ceil(N / rows);
    if (cols < 1 || cols > 12) continue;
    const slot = fitSlot(cols, rows);
    if (slot < 4) continue;
    const score = (cols * rows - N) * 8 - slot * 3;
    if (score < best.score) best = { cols, rows, slotMm: slot, score };
  }
  return { cols: best.cols, rows: best.rows, slotMm: best.slotMm };
}

function StampSlot({
  index,
  style,
  color,
  sizeMm = 10,
}: {
  index: number;
  style: StampStyle;
  color: string;
  sizeMm?: number;
}) {
  const wrapper: React.CSSProperties = {
    width: `${sizeMm}mm`,
    height: `${sizeMm}mm`,
    margin: "auto",
    color,
  };
  // Number font scales with slot size so it remains legible at 5mm slots
  const numFontPt = sizeMm <= 5 ? 3.5 : sizeMm <= 7 ? 4.5 : 6;
  const borderWidthPx = sizeMm <= 5 ? 1 : sizeMm <= 7 ? 1.5 : 2;

  if (style === "circle") {
    return (
      <div
        className="flex items-center justify-center rounded-full"
        style={{ ...wrapper, border: `${borderWidthPx}px solid ${color}` }}
      >
        <span style={{ color, opacity: 0.35, fontSize: `${numFontPt}pt` }}>
          {index}
        </span>
      </div>
    );
  }

  if (style === "check") {
    return (
      <div
        className="flex items-center justify-center rounded-[1mm]"
        style={{ ...wrapper, border: `${borderWidthPx}px solid ${color}` }}
      >
        <span style={{ color, opacity: 0.35, fontSize: `${numFontPt}pt` }}>
          {index}
        </span>
      </div>
    );
  }

  if (style === "star") {
    return (
      <div className="flex items-center justify-center relative" style={wrapper}>
        <svg
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M12 2.6l3.09 6.26 6.91 1L17 14.74l1.18 6.86L12 18.36l-6.18 3.24L7 14.74 2 9.86l6.91-1L12 2.6z" />
        </svg>
        <span
          className="absolute"
          style={{ color, opacity: 0.35, fontSize: `${numFontPt}pt` }}
        >
          {index}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center relative" style={wrapper}>
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M12 21s-7.5-4.6-9.5-9.5C1 7.6 4 4 7.5 4c2 0 3.5 1.2 4.5 2.7C13 5.2 14.5 4 16.5 4 20 4 23 7.6 21.5 11.5 19.5 16.4 12 21 12 21z" />
      </svg>
      <span className="absolute" style={{ color, opacity: 0.35, fontSize: `${numFontPt}pt` }}>
        {index}
      </span>
    </div>
  );
}

function InfoBackView({ data }: { data: ShopCardData }) {
  const services = data.services.split("\n").filter((l) => l.trim());
  const prices = data.pricelist
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      const [name, price] = l.split("/").map((s) => s.trim());
      return { name: name ?? l, price: price ?? "" };
    });
  return (
    <div className="absolute inset-0 flex flex-col p-[5mm]">
      <div
        className="text-[8pt] font-bold tracking-[0.2em] uppercase mb-[1.5mm]"
        style={{ color: data.brandColor }}
      >
        SHOP INFO
      </div>
      {data.infoMessage && (
        <div className="text-[6.5pt] leading-relaxed mb-[2mm] text-neutral-700">
          {data.infoMessage}
        </div>
      )}
      {services.length > 0 && (
        <div className="mb-[1.5mm]">
          <div
            className="text-[5.5pt] tracking-[0.2em] uppercase font-bold mb-[0.5mm]"
            style={{ color: data.brandColor }}
          >
            SERVICES
          </div>
          <div className="grid grid-cols-2 gap-x-[2mm] text-[6pt] leading-tight">
            {services.map((s, i) => (
              <div key={i}>• {s}</div>
            ))}
          </div>
        </div>
      )}
      {prices.length > 0 && (
        <div className="flex-1 min-h-0">
          <div
            className="text-[5.5pt] tracking-[0.2em] uppercase font-bold mb-[0.5mm]"
            style={{ color: data.brandColor }}
          >
            MENU
          </div>
          <div className="text-[6pt] leading-tight space-y-[0.4mm]">
            {prices.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-neutral-500 font-semibold">{p.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageBackView({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {data.backImageDataUrl ? (
        <img src={data.backImageDataUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-[7pt] text-neutral-400"
          style={{ backgroundImage: "repeating-linear-gradient(45deg,#e5e5e5 0 6px,#f5f5f5 6px 12px)" }}
        >
          画像を選択してください
        </div>
      )}
      {data.backImageCaption && (
        <div
          className="absolute bottom-0 inset-x-0 px-[5mm] py-[3mm] text-[7pt] font-semibold"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
            color: "#ffffff",
          }}
        >
          {data.backImageCaption}
        </div>
      )}
    </div>
  );
}

function MapBackView({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col p-[4mm]">
      <div
        className="text-[7pt] font-bold tracking-[0.2em] uppercase mb-[1mm]"
        style={{ color: data.brandColor }}
      >
        ACCESS
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
        <div className="rounded overflow-hidden bg-neutral-100 flex items-center justify-center">
          {data.mapImageDataUrl ? (
            <img src={data.mapImageDataUrl} alt="map" className="w-full h-full object-cover" />
          ) : (
            <div className="text-[6pt] text-neutral-500 text-center p-2">
              地図画像
              <br />
              （任意でアップロード）
            </div>
          )}
        </div>
        <div className="text-[6.2pt] leading-relaxed flex flex-col gap-[1mm] text-neutral-800">
          {data.nearestStation && (
            <div>
              <span className="font-bold" style={{ color: data.brandColor }}>
                🚉 最寄
              </span>
              <br />
              {data.nearestStation}
            </div>
          )}
          {data.address && (
            <div>
              <span className="font-bold" style={{ color: data.brandColor }}>
                📍 住所
              </span>
              <br />
              {data.address}
            </div>
          )}
          {data.mapDirections && (
            <div>
              <span className="font-bold" style={{ color: data.brandColor }}>
                🛣 道案内
              </span>
              <br />
              {data.mapDirections}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GalleryBackView({ data }: { data: ShopCardData }) {
  const imgs = [data.galleryImage1, data.galleryImage2, data.galleryImage3];
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-[1mm] p-[2mm]" style={{ backgroundColor: data.brandColor }}>
      {imgs.map((src, i) => (
        <div key={i} className="bg-neutral-100 overflow-hidden flex items-center justify-center">
          {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <span className="text-[6pt] text-neutral-400">画像{i + 1}</span>}
        </div>
      ))}
    </div>
  );
}

function CouponBackView({ data }: { data: ShopCardData }) {
  const label = data.couponLabel || "SPECIAL COUPON";
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-[4mm] text-center" style={{ backgroundColor: data.brandColor, color: "#ffffff" }}>
      <div
        className="text-[7pt] tracking-[0.3em] uppercase mb-[1mm] font-bold"
        style={{ color: data.accentColor }}
      >
        {label}
      </div>
      <div className="border-2 border-dashed px-[5mm] py-[3mm] w-full" style={{ borderColor: data.accentColor }}>
        <div className="text-[18pt] font-black leading-tight" style={{ color: data.accentColor }}>{data.couponTitle || "10% OFF"}</div>
        {data.couponDetail && <div className="text-[7pt] mt-[1mm]">{data.couponDetail}</div>}
        {data.couponExpiry && <div className="text-[5.5pt] mt-[1.5mm] opacity-85">有効期限: {data.couponExpiry}</div>}
      </div>
    </div>
  );
}

function BadgeBackView({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-[4mm] bg-white">
      <div className="w-[28mm] h-[28mm] rounded-full border-[1.5mm] flex flex-col items-center justify-center" style={{ borderColor: data.brandColor, color: data.brandColor }}>
        <div className="text-[6pt] tracking-[0.2em] uppercase font-bold">★ ★ ★</div>
        <div className="text-[7pt] font-bold leading-tight text-center px-[2mm]">{data.badgeText || "特別認定"}</div>
        {data.badgeYear && <div className="text-[10pt] font-black mt-[0.5mm]">{data.badgeYear}</div>}
        <div className="text-[5pt] tracking-[0.2em] uppercase opacity-70">CERTIFIED</div>
      </div>
      {data.shopName && <div className="text-[8pt] font-bold mt-[2mm]" style={{ color: data.brandColor }}>{data.shopName}</div>}
    </div>
  );
}

function QrShopBackView({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex bg-white p-[4mm]">
      <div className="flex-1 flex flex-col justify-center pr-[3mm]">
        <div className="text-[7pt] tracking-[0.3em] uppercase font-bold" style={{ color: data.brandColor }}>{data.qrLabel || "ONLINE SHOP"}</div>
        <div className="text-[10pt] font-bold mt-[1mm]" style={{ color: data.brandColor }}>{data.shopName}</div>
        {data.tagline && <div className="text-[6.5pt] italic mt-[1mm] opacity-80">{data.tagline}</div>}
        <div className="text-[5.5pt] mt-[2mm] opacity-70 break-all">{data.qrUrl || data.website || "URLを設定"}</div>
      </div>
      <div className="w-[28mm] h-[28mm] self-center bg-white border-2 flex items-center justify-center" style={{ borderColor: data.brandColor }}>
        <div className="text-[5pt] text-neutral-400 text-center px-1">QRコード<br />（生成予定）</div>
      </div>
    </div>
  );
}

function MessageBigBackView({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-[6mm] text-center" style={{ background: `linear-gradient(135deg, ${data.brandColor}, ${data.accentColor})`, color: "#ffffff" }}>
      <div className="text-[6pt] tracking-[0.4em] uppercase opacity-90">{data.bigMessageEn || "THANK YOU"}</div>
      <div className="text-[18pt] font-bold leading-tight mt-[2mm]" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>{data.bigMessage || "ありがとうございます"}</div>
      {data.shopName && <div className="text-[6.5pt] tracking-[0.2em] uppercase mt-[3mm] opacity-90">— {data.shopName} —</div>}
    </div>
  );
}

function CustomBgBackView({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {data.backCustomBackgroundDataUrl ? (
        <img
          src={data.backCustomBackgroundDataUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: data.backCustomBackgroundOpacity }}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-[6.5pt] text-neutral-400"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#e5e5e5 0 6px,#f5f5f5 6px 12px)",
          }}
        >
          裏面の背景画像をアップロード
        </div>
      )}
      {data.backCustomBgShowText && data.backCustomBgText && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div
            className="relative flex-1 flex items-center justify-center text-center px-[6mm] text-white"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            <div
              className="text-[10pt] leading-[1.35] whitespace-pre-wrap"
              style={{ overflowWrap: "anywhere" }}
            >
              {data.backCustomBgText}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CustomBackView({ data }: { data: ShopCardData }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-[6mm]">
      {data.customBackTitle && (
        <div
          className="text-[10pt] font-bold tracking-[0.1em] mb-[2mm]"
          style={{ color: data.brandColor }}
        >
          {data.customBackTitle}
        </div>
      )}
      {data.customBackText ? (
        <div
          className="text-[7pt] leading-relaxed text-neutral-800 max-w-full"
          style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {data.customBackText}
        </div>
      ) : (
        <div className="text-[6.5pt] text-neutral-400">
          自由テキストを入力してください
        </div>
      )}
    </div>
  );
}

// =============================================================================
//  ShopFreeLayoutEditor — 名札/一括メーカーと同仕様の自由レイアウト・エディタ。
//  表面/裏面別に各要素のON/OFF・X/Y(mm)・サイズ倍率を調整できる。
//  値は ShopCardData.shopFreeLayout に保存され、ShopCardPreview 内の CSS で
//  data-role="..." 属性を持つ要素に対して適用される。
// =============================================================================

const SHOP_FREE_LAYOUT_ROLES: { role: ShopFreeLayoutKey; label: string }[] = [
  { role: "shopName", label: "店舗名" },
  { role: "shopNameEn", label: "英字店舗名" },
  { role: "category", label: "業種" },
  { role: "tagline", label: "キャッチコピー" },
  { role: "logo", label: "ロゴ" },
  { role: "address", label: "住所" },
  { role: "phone", label: "電話番号" },
  { role: "hours", label: "営業時間" },
  { role: "website", label: "ウェブサイト" },
  { role: "instagram", label: "Instagram" },
];

function ShopFreeLayoutEditor({
  shopFreeLayout,
  onChange,
}: {
  shopFreeLayout: ShopCardData["shopFreeLayout"];
  onChange: (next: ShopCardData["shopFreeLayout"]) => void;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  const fl = shopFreeLayout;
  const sideFl = side === "front" ? fl.front : fl.back;

  const updateSide = (patch: Partial<typeof sideFl>) => {
    onChange({
      ...fl,
      [side]: { ...sideFl, ...patch },
    });
  };
  const setOffset = (role: ShopFreeLayoutKey, axis: "x" | "y", v: number) => {
    const cur = sideFl.offset[role] ?? { x: 0, y: 0 };
    const next = { ...sideFl.offset, [role]: { ...cur, [axis]: v } };
    updateSide({ offset: next });
  };
  const setScale = (role: ShopFreeLayoutKey, v: number) => {
    const next = { ...sideFl.sizeScale, [role]: v };
    updateSide({ sizeScale: next });
  };
  const setHidden = (role: ShopFreeLayoutKey, hidden: boolean) => {
    const next = { ...sideFl.hidden, [role]: hidden };
    updateSide({ hidden: next });
  };
  const resetSide = () => {
    updateSide({ hidden: {}, offset: {}, sizeScale: {} });
  };
  const resetAll = () => {
    onChange({
      align: undefined,
      globalScale: 1,
      front: { hidden: {}, offset: {}, sizeScale: {} },
      back: { hidden: {}, offset: {}, sizeScale: {} },
    });
  };

  return (
    <section className="bg-white rounded-2xl border-2 border-purple-300 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">🎨</span>
        <div className="text-sm font-bold text-neutral-900">自由レイアウト・エディタ</div>
      </div>
      <div className="text-[11px] text-neutral-600 leading-snug mb-3">
        各要素のON/OFF・位置（X/Y mm）・サイズを調整できます。
        91×55mmカードに対し、左上が原点。<br />
        ※ data-role が付与された要素にのみ反映されます（順次対応中）。
      </div>

      {/* 表/裏 タブ切替 */}
      <div className="grid grid-cols-2 gap-1 mb-3 bg-neutral-100 rounded-md p-1">
        {(["front", "back"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`text-[11px] py-1 rounded font-bold transition ${
              side === s
                ? "bg-white text-purple-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {s === "front" ? "表面" : "裏面"}
          </button>
        ))}
      </div>

      {/* 一括操作 */}
      <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-2.5 mb-3">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[11px]">⚡</span>
          <span className="text-[11px] font-bold text-neutral-800">一括操作（表裏共通）</span>
        </div>
        <div className="text-[10px] text-neutral-600 mb-1">整列（全要素を一括整列）</div>
        <div className="grid grid-cols-3 gap-1 mb-2">
          {([
            { id: "left", label: "◧ 左揃え" },
            { id: "center", label: "▣ 中央" },
            { id: "right", label: "◨ 右寄せ" },
          ] as { id: "left" | "center" | "right"; label: string }[]).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() =>
                onChange({ ...fl, align: fl.align === a.id ? undefined : a.id })
              }
              className={`text-[10px] py-1 rounded border transition ${
                fl.align === a.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-neutral-700 border-neutral-300 hover:border-purple-400"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-neutral-600 mb-0.5">全体サイズ（全要素を一括拡縮）</div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-neutral-500">小</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={fl.globalScale}
            onChange={(e) =>
              onChange({ ...fl, globalScale: parseFloat(e.target.value) })
            }
            className="flex-1 accent-purple-600"
          />
          <span className="text-[9px] text-neutral-500">大</span>
          <span className="text-[10px] font-mono w-12 text-right">
            {Math.round(fl.globalScale * 100)}%
          </span>
        </div>
      </div>

      {/* 各要素（表/裏 別） */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {SHOP_FREE_LAYOUT_ROLES.map(({ role, label }) => {
          const hidden = sideFl.hidden[role] ?? false;
          const offset = sideFl.offset[role] ?? { x: 0, y: 0 };
          const scale = sideFl.sizeScale[role] ?? 1;
          return (
            <div
              key={role}
              className={`rounded-md border p-2 ${
                hidden ? "border-neutral-200 bg-neutral-50/60" : "border-neutral-200 bg-white"
              }`}
            >
              <label className="flex items-center gap-1.5 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={!hidden}
                  onChange={(e) => setHidden(role, !e.target.checked)}
                  className="accent-purple-600 w-3.5 h-3.5"
                />
                <span
                  className={`text-[11px] font-bold ${
                    hidden ? "text-neutral-400 line-through" : "text-neutral-900"
                  }`}
                >
                  {label}
                </span>
              </label>
              {!hidden && (
                <div className="grid grid-cols-3 gap-1.5 items-center text-[10px]">
                  <label className="flex items-center gap-1">
                    <span className="text-neutral-500 w-3">X</span>
                    <input
                      type="number"
                      step="0.5"
                      value={offset.x}
                      onChange={(e) => setOffset(role, "x", parseFloat(e.target.value) || 0)}
                      className="flex-1 min-w-0 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-neutral-500 w-3">Y</span>
                    <input
                      type="number"
                      step="0.5"
                      value={offset.y}
                      onChange={(e) => setOffset(role, "y", parseFloat(e.target.value) || 0)}
                      className="flex-1 min-w-0 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-neutral-500 w-3">倍</span>
                    <input
                      type="number"
                      step="0.05"
                      min={0.5}
                      max={2}
                      value={scale}
                      onChange={(e) => setScale(role, parseFloat(e.target.value) || 1)}
                      className="flex-1 min-w-0 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5 mt-3">
        <button
          type="button"
          onClick={resetSide}
          className="flex-1 text-[10px] py-1 rounded border border-neutral-300 bg-white hover:border-amber-400 hover:text-amber-700"
        >
          この面をリセット
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="flex-1 text-[10px] py-1 rounded border border-neutral-300 bg-white hover:border-red-400 hover:text-red-700"
        >
          全てリセット
        </button>
      </div>
    </section>
  );
}
