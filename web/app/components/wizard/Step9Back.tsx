"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BackCustomLine, CardData, FontFamilyKey } from "../../lib/types";
import { BACK_CATEGORY_LABELS, BACK_STYLES } from "../../backs";
import { CardBack } from "../CardBack";
import { StepShell } from "./StepShell";
import { Field, TextArea, TextInput } from "./Field";
import { FONTS, resolvePalette } from "../../lib/customization";
import { getTemplate } from "../../templates";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
  templateId: string;
  backStyleId: string;
  setBackStyleId: (id: string) => void;
  /** ステップ間ジャンプ用。「QRコードの設定 →」ボタンが step 6 (QR設定) へ遷移する。 */
  onJumpToStep?: (step: number) => void;
};

const CATEGORY_ORDER: ("memo" | "qr" | "branded" | "info" | "minimal")[] = [
  "qr",
  "memo",
  "branded",
  "info",
  "minimal",
];

const BACK_TEXT_PLACEHOLDER: Record<string, { label: string; placeholder: string; hint: string }> = {
  "qr-split": {
    label: "QR横の見出し",
    placeholder: "SCAN ME",
    hint: "デフォルトは「SCAN ME」。空欄ならこの文字が入ります。",
  },
  "big-qr": {
    label: "QR下のメッセージ",
    placeholder: "SCAN TO CONNECT",
    hint: "デフォルトは「SCAN TO CONNECT」。",
  },
  "memo-lined": {
    label: "見出し（左上）",
    placeholder: "MEMO",
    hint: "メモ罫線の見出し。「打合せメモ」「お話しした内容」などもOK。",
  },
  "memo-grid": {
    label: "見出し（左上）",
    placeholder: "NOTE",
    hint: "ドット方眼の見出し。",
  },
  "contact-list": {
    label: "見出し",
    placeholder: "CONTACT",
    hint: "連絡先一覧の見出し。",
  },
  minimal: {
    label: "メッセージ",
    placeholder: "thank you",
    hint: "「thank you」「Nice to meet you」「お会いできて光栄です」など短いメッセージ。",
  },
};

export function Step9Back({ data, update, templateId, backStyleId, setBackStyleId, onJumpToStep }: Props) {
  // 「裏面に表示する項目」UI は Step9Tune（最後の微調整）の「表面に表示する項目」
  // と並べて表示するように移設したため、ここでは扱わない（toggleBack も廃止）。

  const selectedBack = BACK_STYLES.find((b) => b.id === backStyleId) ?? BACK_STYLES[0];
  const isMemo = selectedBack.category === "memo";
  // スローガン入力が必要な裏面テンプレ。slogan-big だけでなく
  // QR + スローガン(qr-slogan) / QR + 大きな見出し(qr-big-text) / PR ポスター
  // など、tagline をスローガン本文として描画するテンプレを広くカバー。
  // 文字サイズなどの調整は最後の「テキストカスタマイズ」ステップで行う。
  const isSlogan = ["slogan-big", "qr-slogan", "qr-big-text", "pr-poster"].includes(
    selectedBack.id,
  );
  const isCompany = selectedBack.category === "company";
  const textCfg = BACK_TEXT_PLACEHOLDER[selectedBack.id];
  const fa = data.customization.fineAdjust;
  const bc = data.backCard;

  const updateBackCard = (patch: Partial<typeof bc>) =>
    update({ backCard: { ...bc, ...patch } });

  const setServices = (raw: string) =>
    updateBackCard({
      services: raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });

  const template = getTemplate(templateId);
  const frontPalette = resolvePalette(data, template.swatch);
  const backColors = data.customization.backColors;
  type BaseColorKey = "bg" | "fg" | "accent" | "muted";
  type BackColorKey = BaseColorKey | "bgRight" | "fgRight";
  const backColorRoles: { key: BaseColorKey; label: string; emoji: string; description: string }[] = [
    { key: "bg", label: "下地", emoji: "🎨", description: "裏面のベースの色" },
    { key: "fg", label: "文字", emoji: "🖋", description: "裏面の主要テキストの色" },
    { key: "accent", label: "アクセント", emoji: "✨", description: "ライン・枠・アイコンの色" },
    { key: "muted", label: "サブ文字", emoji: "🔘", description: "薄い情報の色" },
  ];
  const splitStyleBacks = ["qr-split", "qr-memo-split"];
  const isSplitStyle = splitStyleBacks.includes(backStyleId);

  const setBackColor = (key: BackColorKey, value: string) =>
    update({
      customization: {
        ...data.customization,
        backColors: { ...backColors, [key]: value },
      },
    });

  const clearBackColor = (key: BaseColorKey) => {
    const next = { ...backColors };
    delete next[key];
    update({ customization: { ...data.customization, backColors: next } });
  };

  const resetAllBackColors = () =>
    update({ customization: { ...data.customization, backColors: {} } });

  const copyAllFromFront = () =>
    update({
      customization: {
        ...data.customization,
        backColors: {
          bg: frontPalette.bg,
          fg: frontPalette.fg,
          accent: frontPalette.accent,
          muted: frontPalette.muted,
        },
      },
    });

  const copyOneFromFront = (key: "bg" | "fg" | "accent" | "muted") =>
    update({
      customization: {
        ...data.customization,
        backColors: { ...backColors, [key]: frontPalette[key] },
      },
    });

  const setSplitRight = (bg: string, fg?: string) =>
    update({
      customization: {
        ...data.customization,
        backColors: { ...backColors, bgRight: bg, ...(fg ? { fgRight: fg } : {}) },
      },
    });

  const clearSplitRight = () => {
    const next = { ...backColors };
    delete next.bgRight;
    delete next.fgRight;
    update({ customization: { ...data.customization, backColors: next } });
  };

  return (
    <StepShell
      title="裏面のデザインを選んでください"
      subtitle="表面とは別の裏面デザインを選べます。文字も自由にカスタム、表示する項目もここで個別にON/OFFできます。"
    >
      {/* 上部の大きなライブプレビューは廃止。右サイドのプレビューに統一して
          重なりをなくす（ユーザー要望: 右プレビューのみ残す） */}

      {/*
        旧「🎨 裏面の色を表面と別に変える」セクションは
        カスタマイズ → カラータブの「裏面」サブタブに移設したため、ここでは非表示にする。
        分割スタイル限定の「右半分の下地」部分のみ残置。
      */}
      <details className="rounded-xl border-2 border-purple-200 bg-purple-50/30 p-4 group" hidden>
        <summary className="cursor-pointer text-sm font-bold text-neutral-900 select-none flex items-center justify-between">
          <span>🎨 裏面の色を表面と別に変える（カスタマイズに移設）</span>
          <span className="text-neutral-400 group-open:rotate-180 transition">▾</span>
        </summary>
        <div className="text-[11px] text-neutral-600 mt-1 mb-3">
          表面と裏面の色を分けたい場合に使います。何も設定しなければ表面と同じ色になります。
        </div>
        <div className="grid gap-2">
          {backColorRoles.map((r) => {
            const current = backColors[r.key] ?? frontPalette[r.key];
            const overridden = !!backColors[r.key];
            return (
              <div
                key={r.key}
                className={`flex items-start gap-3 p-2 rounded-lg border-2 bg-white ${
                  overridden ? "border-purple-500 shadow-sm" : "border-neutral-200"
                }`}
              >
                <label
                  className="relative w-10 h-10 rounded-md border border-neutral-300 cursor-pointer overflow-hidden shrink-0"
                  style={{ backgroundColor: current }}
                >
                  <input
                    type="color"
                    value={normalizeHex(current)}
                    onChange={(e) => setBackColor(r.key, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm">{r.emoji}</span>
                    <span className="text-xs font-semibold text-neutral-900">裏面の{r.label}</span>
                    {overridden ? (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                        独立
                      </span>
                    ) : (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-100 text-neutral-500 font-medium">
                        表面と同じ
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">{r.description}</div>
                  <div className="text-[9px] font-mono text-neutral-400 mt-1">{normalizeHex(current).toUpperCase()}</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!overridden ? (
                    <button
                      type="button"
                      onClick={() => copyOneFromFront(r.key)}
                      className="text-[9px] px-2 py-1 rounded border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 whitespace-nowrap"
                      title="表面と同じ色を裏面に固定"
                    >
                      固定する
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => clearBackColor(r.key)}
                      className="text-[9px] px-2 py-1 rounded border border-neutral-200 text-neutral-500 bg-white hover:bg-neutral-50 whitespace-nowrap"
                      title="表面と連動に戻す"
                    >
                      連動に戻す
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={copyAllFromFront}
              className="text-xs px-3 py-1.5 rounded-md border border-purple-300 text-purple-700 bg-white hover:bg-purple-50"
            >
              📋 表面の色をすべてコピー
            </button>
            {Object.keys(backColors).length > 0 && (
              <button
                type="button"
                onClick={resetAllBackColors}
                className="text-xs px-3 py-1.5 rounded-md border border-neutral-300 text-neutral-600 bg-white hover:bg-neutral-50"
              >
                ↩ 全て表面と連動に戻す
              </button>
            )}
          </div>

          {/* 分割スタイル限定: 右半分の色 */}
          {isSplitStyle && (
            <div className="mt-4 pt-4 border-t-2 border-dashed border-purple-300">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🎯</span>
                <span className="text-xs font-bold text-neutral-900">
                  右半分の下地（分割デザイン専用）
                </span>
              </div>
              <div className="text-[10px] text-neutral-600 leading-relaxed mb-3">
                左右で別の色にできます。<strong>QR + メモ</strong>では右半分（メモ欄）を白にしておくと書き込みやすくなります。
              </div>

              <div
                className={`flex items-start gap-3 p-2 rounded-lg border-2 bg-white ${
                  backColors.bgRight ? "border-purple-500 shadow-sm" : "border-neutral-200"
                }`}
              >
                <label
                  className="relative w-10 h-10 rounded-md border border-neutral-300 cursor-pointer overflow-hidden shrink-0"
                  style={{ backgroundColor: backColors.bgRight ?? "#ffffff" }}
                >
                  <input
                    type="color"
                    value={normalizeHex(backColors.bgRight ?? "#ffffff")}
                    onChange={(e) => setBackColor("bgRight", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-neutral-900">右半分の下地</span>
                    {backColors.bgRight ? (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                        独立
                      </span>
                    ) : (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                        メモ用に白（自動）
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                    分割デザインの右側（メモ欄）の背景。文字色は背景に合わせて自動調整されます
                  </div>
                  <div className="text-[10px] text-neutral-700 font-mono mt-1">
                    {(backColors.bgRight ?? "#FFFFFF").toUpperCase()}
                  </div>
                </div>
                {backColors.bgRight && (
                  <button
                    type="button"
                    onClick={clearSplitRight}
                    className="text-[9px] px-2 py-1 rounded border border-neutral-200 text-neutral-500 bg-white hover:bg-neutral-50 whitespace-nowrap"
                  >
                    白に戻す
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setSplitRight("#ffffff", "#1a1a1a")}
                  className="text-[10px] px-2 py-1 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50"
                >
                  白
                </button>
                <button
                  type="button"
                  onClick={() => setSplitRight("#fafaf7", "#1a1a1a")}
                  className="text-[10px] px-2 py-1 rounded-md border border-neutral-300 bg-[#fafaf7] hover:opacity-80"
                >
                  オフホワイト
                </button>
                <button
                  type="button"
                  onClick={() => setSplitRight("#f5f5dc", "#1a1a1a")}
                  className="text-[10px] px-2 py-1 rounded-md border border-neutral-300 bg-[#f5f5dc] hover:opacity-80"
                >
                  クリーム
                </button>
                <button
                  type="button"
                  onClick={() => setSplitRight(frontPalette.bg, frontPalette.fg)}
                  className="text-[10px] px-2 py-1 rounded-md border border-purple-300 text-purple-700 bg-white hover:bg-purple-50"
                >
                  ↻ 表面と同じ
                </button>
              </div>
            </div>
          )}
        </div>
      </details>

      {/*
        「裏面に表示する項目」セクションは Step9Tune（最後の微調整）の
        「表面に表示する項目」と並べる形に移設したため、ここでは表示しない。
      */}

      {/* Company / PR back content (independent from front) */}
      {isCompany && (
        <div
          id="back-company-section"
          className="rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-5 scroll-mt-20"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="text-sm font-bold text-neutral-900">🏢 裏面を「企業PRカード」として独立カスタム</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                表面とは別の内容を裏面に。社名・サービス・URL・PRメッセージを自由入力できます。
                OFFのままなら表面と同じ会社情報が使われます。
              </div>
            </div>
            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={bc.enabled}
                onChange={(e) => updateBackCard({ enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-indigo-700">独立</span>
            </label>
          </div>

          {bc.enabled && (
            <div className="grid gap-3">
              <Field
                label="メイン見出し"
                hint="社名・商品名・PRしたいキーワード"
                example="株式会社ABC / Yamada Studio"
              >
                <TextInput
                  value={bc.heading}
                  onChange={(v) => updateBackCard({ heading: v })}
                  placeholder="株式会社ABC"
                />
              </Field>

              <Field
                label="サブ見出し / タグライン"
                optional
                hint="一行のキャッチコピー"
                example="Webデザイン・開発・SEOの一気通貫サポート"
              >
                <TextInput
                  value={bc.subheading}
                  onChange={(v) => updateBackCard({ subheading: v })}
                  placeholder="ものづくりに、デザインを。"
                />
              </Field>

              <Field
                label="紹介文（本文）"
                optional
                hint="会社や商品の紹介。改行可。3〜4行程度がおすすめ"
                example={"私たちはWeb制作・SEOコンサルティングを通じて\n中小企業の集客課題を解決します。"}
              >
                <TextArea
                  value={bc.description}
                  onChange={(v) => updateBackCard({ description: v })}
                  rows={3}
                  placeholder=""
                />
              </Field>

              {/* サービス一覧 — 行ごとの個別入力＋追加・削除ボタンで分かりやすく */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[12px] font-semibold text-neutral-800">
                    サービス一覧 <span className="text-[10px] text-neutral-500 font-normal">（最大6件・任意）</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    「サービス一覧」テンプレで使用
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 leading-snug">
                  各サービスを1つずつ入力してください。例: Webサイト制作 / SEOコンサルティング / LINE運用代行
                </div>
                <div className="space-y-1">
                  {(bc.services.length === 0 ? [""] : bc.services).map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-400 w-5 text-right font-mono shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={s}
                        onChange={(e) => {
                          // 行 idx の値を更新。リストが空のとき (placeholder行) は追加。
                          const list = bc.services.length === 0 ? [""] : [...bc.services];
                          list[idx] = e.target.value;
                          updateBackCard({ services: list });
                        }}
                        placeholder={`サービス${idx + 1}`}
                        className="flex-1 min-w-0 px-2 py-1 rounded-md border border-neutral-300 text-[12px] focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = bc.services.filter((_, i) => i !== idx);
                          updateBackCard({ services: next });
                        }}
                        disabled={bc.services.length === 0}
                        className="text-[10px] px-1.5 py-1 rounded border border-neutral-200 text-neutral-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
                        title="この行を削除"
                        aria-label="削除"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {bc.services.length < 6 && (
                  <button
                    type="button"
                    onClick={() => updateBackCard({ services: [...bc.services, ""] })}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-dashed border-emerald-400 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-50 transition"
                  >
                    ＋ サービスを追加
                  </button>
                )}
              </div>

              {/* PRポスター専用カスタムテキスト */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-indigo-50/40 border border-indigo-200 p-3">
                <div className="sm:col-span-2 text-[11px] font-bold text-indigo-900">
                  📣 PRポスター用ラベル（任意）
                </div>
                <Field label="左上のラベル文字" hint="既定: PR / 例: NEW / SPECIAL" optional>
                  <TextInput
                    value={bc.prLabel ?? ""}
                    onChange={(v) => updateBackCard({ prLabel: v })}
                    placeholder="PR"
                  />
                </Field>
                <Field label="CTA文字（QR横）" hint="既定: 詳しくはこちら / 例: 今すぐチェック" optional>
                  <TextInput
                    value={bc.prCta ?? ""}
                    onChange={(v) => updateBackCard({ prCta: v })}
                    placeholder="詳しくはこちら"
                  />
                </Field>
              </div>

              <Field
                label="URL（PR用サイト）"
                optional
                hint="QRコードもこのURLが使われます（QRモードを「URL」にした場合）"
                example="lanalife.co.jp / yamada-design.com"
              >
                <TextInput
                  value={bc.url}
                  onChange={(v) => updateBackCard({ url: v })}
                  placeholder="example.com"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="裏面用 電話" optional>
                  <TextInput
                    value={bc.contactPhone}
                    onChange={(v) => updateBackCard({ contactPhone: v })}
                    placeholder="03-0000-0000"
                  />
                </Field>
                <Field label="裏面用 メール" optional>
                  <TextInput
                    value={bc.contactEmail}
                    onChange={(v) => updateBackCard({ contactEmail: v })}
                    placeholder="info@example.com"
                  />
                </Field>
              </div>
            </div>
          )}
        </div>
      )}

      {/*
        QR系テンプレでは「QR横の見出し」を QR コード設定パネル内に集約。
        非QR系（memo / contact-list / slogan-big など）はこの位置で個別に表示する。
      */}
      {textCfg && !/^qr-|^dual-qr-|big-qr/.test(backStyleId) && (
        <Field
          label={textCfg.label}
          hint={textCfg.hint}
          example={textCfg.placeholder}
          optional
        >
          <TextInput
            value={data.backText}
            onChange={(v) => update({ backText: v })}
            placeholder={textCfg.placeholder}
          />
        </Field>
      )}

      {/* QR コードの設定 UI は新ステップ「QRコード設定」(StepQRSettings) に移設したため、
          ここでは描画しない。裏面 QR テンプレを選んでいる場合、その案内だけ表示する。 */}
      {/^qr-|^dual-qr-|big-qr/.test(backStyleId) && (
        <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-3 text-[11px] text-cyan-900 leading-relaxed flex items-start gap-2">
          <span className="text-base shrink-0 leading-none">📱</span>
          <div className="flex-1">
            このデザインは QR コードを使います。次のステップ
            <strong>「QRコード設定」</strong> で URL や見出しを設定してください。
          </div>
        </div>
      )}

      {isMemo && (
        <div id="back-memo-section" className="scroll-mt-20">
          <Field
            label="メモ初期テキスト"
            hint="メモ罫線にあらかじめ印字したいメッセージ（空欄なら罫線のみ）"
            example="お会いできて光栄です"
            optional
          >
            <TextArea
              value={data.memo}
              onChange={(v) => update({ memo: v })}
              placeholder=""
              rows={2}
            />
          </Field>
        </div>
      )}

      {backStyleId === "custom-text" && (
        <div id="back-custom-text-section" className="scroll-mt-20">
          <CustomTextLinesEditor data={data} update={update} />
        </div>
      )}

      {backStyleId === "custom-bg-back" && (
        <div id="back-custom-bg-section" className="scroll-mt-20">
          <CustomBgBackEditor data={data} update={update} />
        </div>
      )}

      {isSlogan && (
        <div
          id="back-slogan-section"
          className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4 scroll-mt-44"
        >
          <div className="text-sm font-bold text-neutral-900 mb-1">
            ✏️ スローガンを入力してください（必須）
          </div>
          <div className="text-[11px] text-neutral-600 mb-2">
            このデザインは、ここで入力した文字が大きく表示されます。空欄にするとプレースホルダーが表示されます。
          </div>
          <TextArea
            value={data.tagline}
            onChange={(v) => update({ tagline: v })}
            placeholder="例: Design that moves people. / 真心を、形にする。"
            rows={2}
          />
        </div>
      )}

      {/*
        裏面デザイン選択 — 関連設定欄へのジャンプ案内を上部に表示。
        各テンプレを選んだ後、必要な入力欄を逃さないようサクッと移動できる。
      */}
      {(() => {
        // 現在選択中のスタイルに必要な設定欄の情報。
        // 必須(required) / 任意(optional) のラベルで温度感を伝える。
        const needsInputs: {
          label: string;
          targetId: string;
          emoji: string;
          required?: boolean;
        }[] = [];
        if (backStyleId === "custom-text") {
          needsInputs.push({
            label: "カスタム文字を入力（必須）",
            targetId: "back-custom-text-section",
            emoji: "✏️",
            required: true,
          });
        }
        if (backStyleId === "custom-bg-back") {
          needsInputs.push({
            label: "カスタム背景を設定（必須）",
            targetId: "back-custom-bg-section",
            emoji: "🖼",
            required: true,
          });
        }
        if (isSlogan) {
          needsInputs.push({
            label: "スローガンを入力（必須）",
            targetId: "back-slogan-section",
            emoji: "💬",
            required: true,
          });
        }
        // 企業PRカード(company-card) — 社名/サブ見出し/紹介文の入力欄へ
        if (backStyleId === "company-card") {
          needsInputs.push({
            label: "企業情報を入力",
            targetId: "back-company-section",
            emoji: "🏢",
            required: true,
          });
        }
        // サービス一覧(service-list) — services 入力欄へ
        if (backStyleId === "service-list") {
          needsInputs.push({
            label: "サービス一覧を入力",
            targetId: "back-company-section",
            emoji: "📋",
            required: true,
          });
        }
        // PRポスター(pr-poster) — スローガン + ラベル/CTA を編集
        if (backStyleId === "pr-poster") {
          needsInputs.push({
            label: "PRラベル/CTAを編集",
            targetId: "back-company-section",
            emoji: "📣",
          });
        }
        // メモ系(memo-lined / memo-grid / qr-memo / qr-memo-split / dual-qr-memo)
        // — メモ罫線テンプレ。初期テキストは任意。
        if (isMemo) {
          needsInputs.push({
            label: "メモ初期テキストを編集（任意）",
            targetId: "back-memo-section",
            emoji: "📝",
          });
        }
        // QRコードを使うデザインの場合 (qr- や dual-qr- 等を含む)
        // QR の設定は step 6 (StepQRSettings) に独立移設されたため、
        // ボタンを押すと step 6 へ直接ジャンプする。
        const needsQrStep = /^qr-|^dual-qr-|big-qr/.test(backStyleId);
        if (needsInputs.length === 0 && !needsQrStep) return null;
        const hasRequired = needsInputs.some((i) => i.required) || needsQrStep;
        return (
          <div
            className={`rounded-xl border-2 p-3 flex items-center gap-3 flex-wrap ${
              hasRequired
                ? "border-amber-400 bg-amber-50"
                : "border-blue-300 bg-blue-50/50"
            }`}
          >
            <span className="text-base shrink-0">{hasRequired ? "⚠️" : "💡"}</span>
            <div className="flex-1 min-w-0">
              <div
                className={`text-xs font-bold ${
                  hasRequired ? "text-amber-900" : "text-blue-900"
                }`}
              >
                {hasRequired
                  ? "このデザインを完成させるには必要項目を入力してください"
                  : "このデザインで使える追加設定があります"}
              </div>
              <div
                className={`text-[10px] mt-0.5 ${
                  hasRequired ? "text-amber-800" : "text-blue-800"
                }`}
              >
                ボタンを押すと該当の入力欄まで自動でスクロールします
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {needsInputs.map((item) => (
                <button
                  key={item.targetId + item.label}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(item.targetId);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      el.style.transition = "box-shadow 0.3s ease";
                      el.style.boxShadow = item.required
                        ? "0 0 0 4px rgba(220,38,38,0.45)"
                        : "0 0 0 4px rgba(245,158,11,0.45)";
                      setTimeout(() => {
                        el.style.boxShadow = "";
                      }, 1600);
                    }
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md text-white font-semibold active:scale-95 transition ${
                    item.required
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {item.emoji} {item.label} →
                </button>
              ))}
              {needsQrStep && onJumpToStep && (
                <button
                  type="button"
                  onClick={() => onJumpToStep(6)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-cyan-600 text-white font-semibold hover:bg-cyan-700 active:scale-95 transition"
                  title="QRコード設定ステップ (Step 6) へ移動します"
                >
                  📱 QRコードの設定へ →
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* 裏面テンプレ一覧 — カテゴリ見出しを撤廃し、全テンプレを1つのフラット
          グリッドに整列。カスタムテキスト・カスタム背景は通常テンプレと同じ
          サイズのまま並びの最後に2枚配置（特別な強調枠は無し）。 */}
      {(() => {
        const CUSTOM_IDS = new Set(["custom-text", "custom-bg-back"]);

        // 裏面テンプレのカテゴリごとに色分けタグを返す。Step7Template (表面) と同じ思想。
        const tagStyleFor = (cat: string): { label: string; cls: string } => {
          const map: Record<string, { label: string; cls: string }> = {
            qr: { label: "QRコード", cls: "bg-cyan-100 text-cyan-700 border-cyan-200" },
            memo: { label: "メモ", cls: "bg-amber-100 text-amber-700 border-amber-200" },
            branded: { label: "ブランディング", cls: "bg-purple-100 text-purple-700 border-purple-200" },
            info: { label: "情報", cls: "bg-blue-100 text-blue-700 border-blue-200" },
            company: { label: "企業PR", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
            minimal: { label: "ミニマル", cls: "bg-neutral-100 text-neutral-700 border-neutral-200" },
          };
          return map[cat] ?? { label: cat, cls: "bg-neutral-100 text-neutral-700 border-neutral-200" };
        };

        /** 1枚分のカード描画。サイズは全テンプレ共通。 */
        const renderBackCard = (b: (typeof BACK_STYLES)[number]) => {
          const selected = b.id === backStyleId;
          const tag = tagStyleFor(b.category);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBackStyleId(b.id);
                setTimeout(() => {
                  let targetId = "";
                  if (b.id === "custom-text") targetId = "back-custom-text-section";
                  else if (b.id === "custom-bg-back") targetId = "back-custom-bg-section";
                  else if (b.id === "slogan-big") targetId = "back-slogan-section";
                  else if (/^qr-|^dual-qr-/.test(b.id)) targetId = "back-qr-section";
                  if (targetId) {
                    const el = document.getElementById(targetId);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      el.style.transition = "box-shadow 0.3s ease";
                      el.style.boxShadow = "0 0 0 4px rgba(245,158,11,0.45)";
                      setTimeout(() => { el.style.boxShadow = ""; }, 1600);
                    }
                  }
                }, 100);
              }}
              title={`${b.name} — ${b.description}`}
              className={`group relative flex flex-col gap-1 p-1 text-left transition ${
                selected
                  ? "ring-2 ring-blue-500 rounded-md"
                  : "hover:ring-1 hover:ring-blue-300 rounded-md"
              }`}
            >
              <div
                className="aspect-[91/55] w-full overflow-hidden relative bg-white"
                style={{ containerType: "inline-size" }}
              >
                <div
                  className="absolute inset-0 origin-top-left"
                  style={{
                    width: "91mm",
                    height: "55mm",
                    // 100cqw / (91mm in px) — コンテナ幅にぴったり合わせて縮小、
                    // 裏面デザインの全体が常にサムネ内に収まる(クリップなし)。
                    transform: "scale(calc(100cqw / (91 * 3.7795275591px)))",
                  }}
                >
                  <CardBack data={data} templateId={templateId} backStyleId={b.id} />
                </div>
                {/* カテゴリ色分けタグ — Step7Template (表面) と同じ位置・スタイル */}
                <span
                  className={`absolute top-0.5 left-0.5 text-[8px] font-bold px-1 py-[1px] rounded border leading-none shadow-sm ${tag.cls}`}
                >
                  {tag.label}
                </span>
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                    ✓
                  </span>
                )}
              </div>
              <div className="px-0.5">
                <div
                  className={`text-[10px] leading-tight truncate ${
                    selected ? "font-bold text-blue-700" : "font-semibold text-neutral-800"
                  }`}
                >
                  {b.name}
                </div>
                <div className="text-[9px] text-neutral-500 leading-tight line-clamp-2">
                  {b.description}
                </div>
              </div>
            </button>
          );
        };

        // 通常テンプレ（カスタム系を除く）
        const regularItems = BACK_STYLES.filter((b) => !CUSTOM_IDS.has(b.id));
        // カスタムテキスト・カスタム背景 — 2件を最下部に必ず横並びで表示
        const customItems = BACK_STYLES.filter((b) => CUSTOM_IDS.has(b.id));
        const isCustomSelected = CUSTOM_IDS.has(backStyleId);

        // 現在表示する通常テンプレに含まれるカテゴリのみ凡例に出す
        const ALL_CATS = ["qr", "memo", "branded", "info", "company", "minimal"];
        const presentCats = ALL_CATS.filter((c) => regularItems.some((b) => b.category === c));

        return (
          <div className="space-y-3">
            {/* 通常テンプレ — タイトル＋背景枠でくくる（表面 Step7Template と同様） */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xl shrink-0">🎨</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-blue-900">
                    テンプレートから選ぶ
                  </div>
                  <div className="text-[11px] text-blue-800/85 leading-relaxed">
                    用意された裏面デザインからお好きなものをクリック。タグの色で種類が一目でわかります。
                  </div>
                </div>
              </div>
              {/* カテゴリ凡例タグ（参照のみ） */}
              <div className="flex flex-wrap items-center gap-1 mb-2">
                {presentCats.map((c) => {
                  const tag = tagStyleFor(c);
                  const count = regularItems.filter((b) => b.category === c).length;
                  return (
                    <span
                      key={c}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border leading-none ${tag.cls}`}
                      title={`${tag.label}（${count}種類）`}
                    >
                      {tag.label}（{count}）
                    </span>
                  );
                })}
              </div>
              {/* テンプレ一覧グリッド — サイズは従来と同じ */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
                {regularItems.map((b) => renderBackCard(b))}
              </div>
            </div>

            {/* カスタム枠 — 「自分で組む」系の2件を専用枠で別表示（表面と同様の構造） */}
            {customItems.length > 0 && (
              <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-pink-50/40 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl shrink-0">✏️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-rose-900">
                      自分で組む（オリジナル裏面）
                    </div>
                    <div className="text-[11px] text-rose-800/85 leading-relaxed">
                      テンプレートデザインではなく、自由なテキストや独自の背景画像を裏面に使いたい場合はこちらを選択してください。
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {customItems.map((b) => renderBackCard(b))}
                </div>
              </div>
            )}

            {/* カスタム選択時の目立つ案内 */}
            {isCustomSelected && (
              <div
                className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 flex items-start gap-2.5 shadow-md animate-in fade-in"
                role="status"
              >
                <span className="text-2xl shrink-0 leading-none mt-0.5">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-amber-900 leading-tight mb-1">
                    {backStyleId === "custom-bg-back"
                      ? "カスタム背景には画像のアップロードが必要です"
                      : "カスタムテキストには文字の入力が必要です"}
                  </div>
                  <div className="text-[11px] text-amber-800 leading-relaxed">
                    {backStyleId === "custom-bg-back" ? (
                      <>
                        下の <strong>「📷 カスタム背景画像をアップロード」</strong> 欄で写真／イラストを選んでください。
                        画像を入れないと裏面は空の状態で書き出されます。
                      </>
                    ) : (
                      <>
                        下の <strong>「✏️ カスタムテキストを編集」</strong> 欄で表示したい文字を入力してください。
                        テキストを入れないと裏面は空の状態で書き出されます。
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId =
                        backStyleId === "custom-bg-back"
                          ? "back-custom-bg-section"
                          : "back-custom-text-section";
                      const el = document.getElementById(targetId);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        el.style.transition = "box-shadow 0.3s ease";
                        el.style.boxShadow = "0 0 0 4px rgba(245,158,11,0.55)";
                        setTimeout(() => { el.style.boxShadow = ""; }, 1800);
                      }
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition shadow-sm"
                  >
                    {backStyleId === "custom-bg-back" ? "📷 画像をアップロードへ" : "✏️ テキスト編集へ"} →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </StepShell>
  );
}

function normalizeHex(value: string): string {
  if (!value) return "#000000";
  if (value.startsWith("#") && (value.length === 7 || value.length === 4)) return value;
  return "#000000";
}

/**
 * Editor for the "custom-bg-back" style — upload background, opacity slider,
 * overlay toggle/color/opacity, and quick text fields (tagline / backText /
 * backMessage) which the back uses as centered text over the image.
 */
function CustomBgBackEditor({
  data,
  update,
}: {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
}) {
  const c = data.customization;
  return (
    <div className="rounded-xl border-2 border-pink-300 bg-pink-50/30 p-4 space-y-3">
      <div>
        <div className="text-sm font-bold text-neutral-900">📷 裏面の背景画像</div>
        <div className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
          アップロードした画像を裏面の背景にします。文字（スローガン・メッセージ）は中央に重ねて表示されます。
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-20 h-12 rounded border-2 border-dashed border-neutral-300 bg-white overflow-hidden shrink-0 flex items-center justify-center">
          {data.backCustomBackground ? (
            <img src={data.backCustomBackground} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] text-neutral-400">未設定</span>
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            id="back-bg-input"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  update({ backCustomBackground: reader.result });
                }
              };
              reader.readAsDataURL(file);
              if (e.target) e.target.value = "";
            }}
          />
          <label
            htmlFor="back-bg-input"
            className="inline-block text-xs px-3 py-1.5 rounded-md bg-pink-600 text-white font-semibold cursor-pointer hover:bg-pink-700"
          >
            画像をアップロード
          </label>
          {data.backCustomBackground && (
            <button
              type="button"
              onClick={() => update({ backCustomBackground: "" })}
              className="ml-2 text-xs text-neutral-500 hover:text-red-600"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {data.backCustomBackground && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-700">背景の濃さ</span>
              <span className="text-[10px] font-mono text-neutral-700">
                {Math.round((data.backCustomBackgroundOpacity ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={data.backCustomBackgroundOpacity ?? 1}
              onChange={(e) =>
                update({ backCustomBackgroundOpacity: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div className="rounded-lg border border-pink-200 bg-white p-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={c.overlayEnabled !== false}
                onChange={(e) =>
                  update({
                    customization: { ...c, overlayEnabled: e.target.checked },
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold">
                文字下にオーバーレイ（読みやすさ向上）
              </span>
            </label>
            {c.overlayEnabled !== false && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 w-12">色</span>
                  <input
                    type="color"
                    value={c.overlayColor ?? "#000000"}
                    onChange={(e) =>
                      update({ customization: { ...c, overlayColor: e.target.value } })
                    }
                    className="w-8 h-8 border border-neutral-300 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-600 w-12 ml-2">濃さ</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={c.overlayOpacity ?? 0.4}
                    onChange={(e) =>
                      update({
                        customization: { ...c, overlayOpacity: parseFloat(e.target.value) },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono text-neutral-700 w-10 text-right">
                    {Math.round((c.overlayOpacity ?? 0.4) * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>

          {/* オーバーレイ文字 ON/OFF — 既定 OFF（画像のみ）。
              ON にしたときだけ tagline/backText/backMessage が中央に重ね表示される。 */}
          <div className="rounded-lg border border-pink-200 bg-white p-2 space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!data.backCustomBgShowText}
                onChange={(e) =>
                  update({ backCustomBgShowText: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold">
                画像の上に文字を重ねて表示する
              </span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-100 text-neutral-500 font-bold">
                既定: OFF
              </span>
            </label>
            <div className="text-[10px] text-neutral-500 leading-relaxed pl-6">
              OFF のままなら画像だけの裏面になります。ON にすると、上の <strong>タグライン</strong> /
              <strong>裏面サブ見出し</strong> / <strong>メッセージ</strong> 欄の文字が中央に重ねて表示されます。
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Editor for the "custom-text" back style. Lets the user add/remove/edit
 * any number of text lines with per-line font, size, alignment, bold, italic.
 */
function CustomTextLinesEditor({
  data,
  update,
}: {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
}) {
  const lines = data.backCustomLines ?? [];

  const setLines = (next: BackCustomLine[]) =>
    update({ backCustomLines: next });

  const updateLine = (id: string, patch: Partial<BackCustomLine>) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: `l-${Date.now()}`,
        text: "",
        fontKey: "auto",
        sizePt: 9,
        align: "center",
      },
    ]);
  };

  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id));

  const moveLine = (id: string, dir: -1 | 1) => {
    const idx = lines.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= lines.length) return;
    const copy = [...lines];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    setLines(copy);
  };

  const fontOptions: { id: FontFamilyKey | "auto"; name: string }[] = [
    { id: "auto", name: "テンプレ標準" },
    ...FONTS.filter((f) => f.id !== "auto").map((f) => ({ id: f.id, name: f.name })),
  ];

  return (
    <div className="rounded-xl border-2 border-purple-300 bg-purple-50/30 p-4 space-y-3">
      <div>
        <div className="text-sm font-bold text-neutral-900">✏️ カスタムテキストの行</div>
        <div className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
          自由に行を追加・削除して、行ごとに文字・サイズ・フォント・揃え・太字・斜体を変えられます。
          <br />
          名言・スローガン・多言語タグライン・サービス一覧などに使えます。
        </div>
      </div>

      {lines.length === 0 && (
        <div className="text-center text-[11px] text-neutral-500 py-6 border-2 border-dashed border-purple-200 rounded-lg">
          まだ行がありません。下の「＋ 行を追加」から始めましょう。
        </div>
      )}

      <div className="space-y-2">
        {lines.map((line, idx) => (
          <div key={line.id} className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 font-mono">行 {idx + 1}</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => moveLine(line.id, -1)}
                disabled={idx === 0}
                className="text-[11px] px-1.5 py-0.5 rounded border border-neutral-200 disabled:opacity-30 hover:bg-neutral-50"
                title="上へ"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveLine(line.id, 1)}
                disabled={idx === lines.length - 1}
                className="text-[11px] px-1.5 py-0.5 rounded border border-neutral-200 disabled:opacity-30 hover:bg-neutral-50"
                title="下へ"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="text-[11px] px-2 py-0.5 rounded border border-red-200 text-red-600 bg-white hover:bg-red-50"
              >
                削除
              </button>
            </div>

            <textarea
              value={line.text}
              onChange={(e) => updateLine(line.id, { text: e.target.value })}
              placeholder="この行のテキスト（改行も可）"
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-purple-500 resize-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-neutral-500 mb-0.5">フォント</div>
                <select
                  value={line.fontKey}
                  onChange={(e) =>
                    updateLine(line.id, { fontKey: e.target.value as FontFamilyKey | "auto" })
                  }
                  className="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
                >
                  {fontOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 mb-0.5">
                  サイズ {line.sizePt}pt
                </div>
                <input
                  type="range"
                  min={5}
                  max={28}
                  step={0.5}
                  value={line.sizePt}
                  onChange={(e) => updateLine(line.id, { sizePt: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex border border-neutral-200 rounded overflow-hidden">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => updateLine(line.id, { align: a })}
                    className={`px-2 py-1 text-[11px] ${
                      line.align === a
                        ? "bg-purple-600 text-white"
                        : "bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {a === "left" ? "左寄せ" : a === "center" ? "中央" : "右寄せ"}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!line.bold}
                  onChange={(e) => updateLine(line.id, { bold: e.target.checked })}
                />
                <span className="font-bold">太字</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!line.italic}
                  onChange={(e) => updateLine(line.id, { italic: e.target.checked })}
                />
                <span className="italic">斜体</span>
              </label>
              <label
                className="relative inline-flex items-center gap-1 text-[11px] cursor-pointer"
                title="カスタム色（オフでテンプレ標準色）"
              >
                <input
                  type="color"
                  value={normalizeHex(line.color ?? "#000000")}
                  onChange={(e) => updateLine(line.id, { color: e.target.value })}
                  className="w-6 h-6 rounded border border-neutral-300 cursor-pointer"
                />
                <span>色</span>
                {line.color && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      updateLine(line.id, { color: undefined });
                    }}
                    className="text-[10px] text-neutral-500 hover:text-neutral-900"
                    title="標準色に戻す"
                  >
                    ↩
                  </button>
                )}
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addLine}
        className="w-full px-3 py-2 rounded-md border-2 border-dashed border-purple-300 text-purple-700 bg-white hover:bg-purple-50 text-sm font-semibold"
      >
        ＋ 行を追加
      </button>
    </div>
  );
}
