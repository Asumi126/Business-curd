"use client";

import { CardData, FieldKey, FontRole } from "../../lib/types";
import { CardRenderer } from "../CardRenderer";
import { CardBack } from "../CardBack";
import { FIELD_KEYS, FIELD_LABELS, getFieldValue } from "../../lib/fineAdjust";
import { StepShell } from "./StepShell";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
  templateId: string;
  backStyleId: string;
};

export function Step9Tune({ data, update, templateId, backStyleId }: Props) {
  const fa = data.customization.fineAdjust;

  const toggle = (key: FieldKey) => {
    const next = !fa.hidden[key];
    update({
      customization: {
        ...data.customization,
        fineAdjust: {
          ...fa,
          hidden: { ...fa.hidden, [key]: next },
        },
      },
    });
  };

  const setScale = (v: number) =>
    update({
      customization: { ...data.customization, fineAdjust: { ...fa, scale: v } },
    });

  const setOffsetX = (v: number) =>
    update({
      customization: { ...data.customization, fineAdjust: { ...fa, offsetX: v } },
    });
  const setOffsetY = (v: number) =>
    update({
      customization: { ...data.customization, fineAdjust: { ...fa, offsetY: v } },
    });

  // 表面／裏面 それぞれの自由レイアウト state を読み書きするヘルパ。
  // side で参照するフィールドが切り替わる：
  //   "front" → layoutOffsetPerRole / fontSizePerRole / bulkTextAlign
  //   "back"  → layoutOffsetPerRoleBack / fontSizePerRoleBack / bulkTextAlignBack
  type Side = "front" | "back";
  const getOffsets = (side: Side) =>
    (side === "front"
      ? data.customization.layoutOffsetPerRole
      : data.customization.layoutOffsetPerRoleBack) ?? {};
  const getSizes = (side: Side) =>
    (side === "front"
      ? data.customization.fontSizePerRole
      : data.customization.fontSizePerRoleBack) ?? {};
  const getAlign = (side: Side) =>
    side === "front"
      ? data.customization.bulkTextAlign
      : data.customization.bulkTextAlignBack;

  const setLayoutOffset = (
    side: Side,
    role: FontRole,
    axis: "x" | "y",
    v: number,
  ) => {
    const cur = getOffsets(side);
    const next = { ...cur };
    const item = next[role] ?? { x: 0, y: 0 };
    const updated = { ...item, [axis]: v };
    if (updated.x === 0 && updated.y === 0) {
      delete next[role];
    } else {
      next[role] = updated;
    }
    update({
      customization: {
        ...data.customization,
        ...(side === "front"
          ? { layoutOffsetPerRole: next }
          : { layoutOffsetPerRoleBack: next }),
      },
    });
  };

  const setFontSize = (side: Side, role: FontRole, scale: number) => {
    const cur = getSizes(side);
    const next = { ...cur };
    if (scale === 1) {
      delete next[role];
    } else {
      next[role] = scale;
    }
    update({
      customization: {
        ...data.customization,
        ...(side === "front"
          ? { fontSizePerRole: next }
          : { fontSizePerRoleBack: next }),
      },
    });
  };

  /**
   * 一括文字レイヤー位置調整 — すべての項目を「同じ mm 数」だけ一律に動かす。
   * 旧版は CSS text-align を使っていたため、各項目のコンテナ幅で見た目の
   * 移動量が異なる問題があった。ここでは全 role に同一 X オフセット (mm) を
   * セットすることで、項目間で完全に同じ移動量を保証する。
   *
   * mode 別の X 移動量（mm 一律）:
   *   left   → -10mm（テンプレ既定位置から 10mm 左へ）
   *   center →   0mm（既定位置に揃える）
   *   right  → +10mm（テンプレ既定位置から 10mm 右へ）
   * Y 軸はユーザーの個別設定を尊重して維持する。
   */
  const bulkAlign = (side: Side, mode: "left" | "center" | "right") => {
    const roles: FontRole[] = [
      "name",
      "nameEn",
      "company",
      "title",
      "contact",
      "tagline",
      "phone",
      "email",
      "address",
      "website",
      "description",
    ];
    const uniformX = mode === "left" ? -10 : mode === "right" ? 10 : 0;
    const cur = getOffsets(side);
    const nextOffsets: typeof cur = { ...cur };
    roles.forEach((r) => {
      const existing = nextOffsets[r];
      const y = existing?.y ?? 0;
      // X は全項目に同一値、Y は既存値を保持
      if (uniformX === 0 && y === 0) {
        delete nextOffsets[r];
      } else {
        nextOffsets[r] = { x: uniformX, y };
      }
    });
    update({
      customization: {
        ...data.customization,
        // CSS の text-align によるバラつきを避けるため bulkTextAlign は使わない。
        ...(side === "front"
          ? { layoutOffsetPerRole: nextOffsets, bulkTextAlign: undefined }
          : { layoutOffsetPerRoleBack: nextOffsets, bulkTextAlignBack: undefined }),
      },
    });
  };

  const clearBulkAlign = (side: Side) =>
    update({
      customization: {
        ...data.customization,
        ...(side === "front"
          ? { bulkTextAlign: undefined }
          : { bulkTextAlignBack: undefined }),
      },
    });

  const resetSideAll = (side: Side) =>
    update({
      customization: {
        ...data.customization,
        ...(side === "front"
          ? { layoutOffsetPerRole: {}, fontSizePerRole: {}, bulkTextAlign: undefined }
          : {
              layoutOffsetPerRoleBack: {},
              fontSizePerRoleBack: {},
              bulkTextAlignBack: undefined,
            }),
      },
    });

  const reset = () =>
    update({
      customization: {
        ...data.customization,
        fineAdjust: {
          hidden: {},
          backHidden: {},
          scale: 1,
          offsetY: 0,
          offsetX: 0,
          hideTemplateExtras: true,
          customYearLabel: "",
          addressLayout: "inline",
        },
      },
    });

  const setAddressLayout = (layout: "inline" | "stacked") =>
    update({
      customization: {
        ...data.customization,
        fineAdjust: { ...fa, addressLayout: layout },
      },
    });

  const setHideTemplateExtras = (v: boolean) =>
    update({
      customization: {
        ...data.customization,
        fineAdjust: { ...fa, hideTemplateExtras: v },
      },
    });

  const visibleCount = FIELD_KEYS.filter(
    (k) => !fa.hidden[k] && getFieldValue(data, k),
  ).length;

  return (
    <StepShell
      title="最後の微調整"
      subtitle="表示/非表示の切替や、全体スケール・縦位置を細かく調整できます。住所の改行は連絡先ステップで Enter キーで入力できます。"
    >
      <div className="lg:hidden flex flex-col gap-3 items-center">
        <CardRenderer data={data} templateId={templateId} className="scale-90 origin-center" />
        <CardBack data={data} templateId={templateId} backStyleId={backStyleId} className="scale-90 origin-center" />
      </div>

      {/* 表示する項目 — 表面/裏面を並べてコンパクトに切替。
          表面=FIELD_KEYS (fa.hidden)、裏面=BackHiddenFields (fa.backHidden)。
          サイズは小さめ。表面=青、裏面=琥珀色で識別。 */}
      {(() => {
        const backToggles: { key: keyof typeof fa.backHidden; label: string; hint: string }[] = [
          { key: "nameJa", label: "氏名", hint: "名前を裏面に表示するか" },
          { key: "company", label: "屋号・会社名", hint: "会社名を裏面に表示するか" },
          { key: "title", label: "肩書き・部署", hint: "肩書きや部署を裏面に表示するか" },
          { key: "contact", label: "連絡先・SNS", hint: "電話・メール・住所・SNSを裏面に表示するか" },
          { key: "monogram", label: "ロゴ・モノグラム", hint: "裏面にロゴや頭文字マークを表示するか" },
          { key: "ornaments", label: "装飾マーク", hint: "引用符・◆・パターン装飾を表示するか" },
        ];
        const toggleBack = (key: keyof typeof fa.backHidden) =>
          update({
            customization: {
              ...data.customization,
              fineAdjust: { ...fa, backHidden: { ...fa.backHidden, [key]: !fa.backHidden[key] } },
            },
          });

        return (
          <div className="grid gap-3 md:grid-cols-2">
            {/* 表面 */}
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-blue-900">
                  📋 表面に表示する項目
                </div>
                <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-600 text-white">
                  FRONT
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {FIELD_KEYS.map((key) => {
                  const value = getFieldValue(data, key);
                  if (!value) return null;
                  const hidden = !!fa.hidden[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      title={`${FIELD_LABELS[key]}: ${value}`}
                      className={`flex items-center gap-1.5 p-1.5 rounded border text-left transition ${
                        hidden
                          ? "border-neutral-200 bg-neutral-100 opacity-70"
                          : "border-blue-300 bg-white hover:border-blue-500"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          hidden ? "bg-neutral-300 text-neutral-600" : "bg-blue-600 text-white"
                        }`}
                      >
                        {hidden ? "—" : "✓"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold truncate ${
                          hidden ? "text-neutral-400 line-through" : "text-neutral-900"
                        }`}
                      >
                        {FIELD_LABELS[key]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="text-[9px] text-neutral-500 mt-1.5 leading-tight">
                {visibleCount}件 表示中。クリックでON/OFF切替。
              </div>
            </div>

            {/* 裏面 */}
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-amber-900">
                  📋 裏面に表示する項目
                </div>
                <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-600 text-white">
                  BACK
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {backToggles.map((t) => {
                  const visible = !fa.backHidden[t.key];
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggleBack(t.key)}
                      title={t.hint}
                      className={`flex items-center gap-1.5 p-1.5 rounded border text-left transition ${
                        visible
                          ? "border-amber-300 bg-white hover:border-amber-500"
                          : "border-neutral-200 bg-neutral-100 opacity-70"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          visible ? "bg-amber-600 text-white" : "bg-neutral-300 text-neutral-600"
                        }`}
                      >
                        {visible ? "✓" : "—"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold truncate ${
                          visible ? "text-neutral-900" : "text-neutral-400 line-through"
                        }`}
                      >
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="text-[9px] text-neutral-500 mt-1.5 leading-tight">
                クリックでON/OFF切替。プレビューに即反映。
              </div>
            </div>
          </div>
        );
      })()}

      {/* Global font size — moved here from Customize so it's grouped with
       *  other layout-affecting micro-adjustments. */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4 space-y-2">
        {/*
          タイトル行の右端に 100% 表示と「100% に戻す」ボタンを集約。
          ボタンは固定位置（タイトル右）に配置し、100% 以外のときだけ
          青く光るハイライト + クリック可能な状態に切り替える。
        */}
        <div className="flex items-center justify-between mb-1 gap-2">
          <div className="text-sm font-bold text-neutral-900">
            📏 全体のフォントサイズ
          </div>
          {(() => {
            const scale = data.customization.fontGlobalScale ?? 1;
            const isDefault = scale === 1;
            const handleReset = () => {
              if (isDefault) return;
              update({
                customization: { ...data.customization, fontGlobalScale: 1 },
              });
            };
            return (
              <button
                type="button"
                onClick={handleReset}
                disabled={isDefault}
                title={
                  isDefault
                    ? "現在 100%(標準)です"
                    : "クリックで 100%(標準)に戻す"
                }
                aria-label="フォントサイズを100%に戻す"
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-xs border transition ${
                  isDefault
                    ? "border-neutral-200 bg-white text-neutral-500 cursor-default"
                    : "border-blue-500 bg-blue-600 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.25)] hover:bg-blue-700 active:scale-95 animate-pulse"
                }`}
              >
                <span>{Math.round(scale * 100)}%</span>
                {!isDefault && <span className="text-[9px]">↩ 100%</span>}
              </button>
            );
          })()}
        </div>
        <div className="text-[11px] text-neutral-600 leading-relaxed mb-2">
          すべての文字を一括で拡大／縮小。<strong>標準 = 100%</strong>。100% より小さくすると、長文は自動で改行されます（広い文字間隔も詰まります）。
        </div>
        <input
          type="range"
          min={0.7}
          max={1.4}
          step={0.05}
          value={data.customization.fontGlobalScale ?? 1}
          onChange={(e) =>
            update({
              customization: {
                ...data.customization,
                fontGlobalScale: parseFloat(e.target.value),
              },
            })
          }
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
          <span>70%</span>
          <span>標準 100%</span>
          <span>140%</span>
        </div>
      </div>

      {/* 🎨 自由レイアウト・エディタ — 表面用と裏面用を独立して操作 */}
      {(() => {
        const candidates: {
          role: FontRole;
          label: string;
          hasFrontValue: boolean;
          hasBackValue: boolean;
        }[] = [
          {
            role: "name",
            label: "氏名",
            hasFrontValue: !!data.nameJa?.trim(),
            hasBackValue: !!data.nameJa?.trim() && !fa.backHidden.nameJa,
          },
          {
            role: "nameEn",
            label: "氏名（ローマ字）",
            hasFrontValue: !!data.nameEn?.trim() && !fa.hidden.nameEn,
            // 裏面の nameEn は氏名(nameJa)の表示状態に連動して扱う
            hasBackValue: !!data.nameEn?.trim() && !fa.backHidden.nameJa,
          },
          {
            role: "company",
            label: "会社・屋号",
            hasFrontValue: !!data.company?.trim(),
            hasBackValue: !!data.company?.trim() && !fa.backHidden.company,
          },
          {
            role: "title",
            label: "肩書き",
            hasFrontValue: !!data.title?.trim() && !fa.hidden.title,
            hasBackValue: !!data.title?.trim() && !fa.backHidden.title,
          },
          // 紹介文 / サービス一覧（裏面の企業PR系テンプレ専用）。
          // CompanyCard の description、ServiceList の services 一覧の位置を
          // 微調整できる。表面では使われない。
          (() => {
            const COMPANY_BACK_STYLES = new Set([
              "company-card",
              "service-list",
              "pr-poster",
            ]);
            const isCompanyBack = COMPANY_BACK_STYLES.has(backStyleId);
            const bc = data.backCard;
            // 表示判定: 該当テンプレ + 独立カスタム有効 + descriptionかservicesに内容あり
            const hasContent =
              !!(bc?.enabled &&
                (bc.description?.trim() || (bc.services && bc.services.length > 0)));
            return {
              role: "description" as FontRole,
              label: backStyleId === "service-list" ? "サービス一覧（裏面）" : "紹介文（裏面）",
              hasFrontValue: false, // 表面では使わない
              hasBackValue: isCompanyBack && hasContent,
            };
          })(),
          // スローガン系の裏面テンプレ (slogan-big / qr-slogan / qr-big-text /
          // pr-poster / custom-bg-back) は tagline をスローガン本文として描画する。
          // これらが選ばれている場合は項目ラベルを「スローガン（裏面）」に変えて
          // 入力済みでなくても候補に含め、文字位置を必ず調整できるようにする。
          (() => {
            const SLOGAN_BACK_STYLES = new Set([
              "slogan-big",
              "qr-slogan",
              "qr-big-text",
              "pr-poster",
              "custom-bg-back",
            ]);
            const isSloganBack = SLOGAN_BACK_STYLES.has(backStyleId);
            return {
              role: "tagline" as FontRole,
              label: isSloganBack ? "スローガン（裏面）" : "タグライン",
              hasFrontValue: !!data.tagline?.trim() && !fa.hidden.tagline,
              // スローガン系裏面の場合は ornaments OFF でも常に編集可能にする。
              // それ以外は従来通り tagline が入力済 & ornaments ON の場合のみ。
              hasBackValue: isSloganBack
                ? true
                : !!data.tagline?.trim() && !fa.backHidden.ornaments,
            };
          })(),
          {
            role: "contact",
            label: "連絡先（全体まとめて移動）",
            hasFrontValue: !!(data.phone || data.email || data.address || data.website),
            hasBackValue:
              !!(data.phone || data.email || data.address || data.website) &&
              !fa.backHidden.contact,
          },
          // 連絡先サブロール — テンプレに data-role を追加せずとも、Icon SVG の
          // data-card-icon マーカを基に :has() で親 div を特定して個別調整可能。
          {
            role: "phone",
            label: "└ 電話番号",
            hasFrontValue: !!data.phone?.trim(),
            hasBackValue: !!data.phone?.trim() && !fa.backHidden.contact,
          },
          {
            role: "email",
            label: "└ メールアドレス",
            hasFrontValue: !!data.email?.trim(),
            hasBackValue: !!data.email?.trim() && !fa.backHidden.contact,
          },
          {
            role: "website",
            label: "└ Webサイト",
            hasFrontValue: !!data.website?.trim(),
            hasBackValue: !!data.website?.trim() && !fa.backHidden.contact,
          },
          {
            role: "address",
            label: "└ 住所",
            hasFrontValue: !!data.address?.trim(),
            hasBackValue: !!data.address?.trim() && !fa.backHidden.contact,
          },
        ];

        const renderEditor = (side: "front" | "back") => {
          const offsets = getOffsets(side);
          const sizes = getSizes(side);
          const align = getAlign(side);
          const items = candidates.filter((c) =>
            side === "front" ? c.hasFrontValue : c.hasBackValue,
          );
          const sideLabel = side === "front" ? "表面" : "裏面";
          const colorClass =
            side === "front" ? "border-emerald-300 bg-emerald-50/30" : "border-amber-300 bg-amber-50/30";
          const accentBtnBg =
            side === "front" ? "bg-emerald-600 border-emerald-600" : "bg-amber-600 border-amber-600";
          const accentBtnHover =
            side === "front"
              ? "hover:border-emerald-500 hover:bg-emerald-50/40"
              : "hover:border-amber-500 hover:bg-amber-50/40";

          return (
            <div className={`rounded-xl border-2 ${colorClass} p-3 space-y-3`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-neutral-900">
                    🎨 {sideLabel}の自由レイアウト
                  </div>
                  <div className="text-[11px] text-neutral-600 leading-relaxed">
                    {sideLabel}の各項目の<strong>位置（X/Y mm）</strong>と
                    <strong>サイズ倍率</strong>を個別に調整。{sideLabel}プレビューにリアル反映。
                    <br />
                    <span className="text-[10px] text-neutral-500">
                      連絡先は<strong>「全体まとめて移動」</strong>と
                      <strong>電話・メール・Web・住所の個別調整</strong>の両方が可能です。
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${
                    side === "front" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                  }`}
                >
                  {side === "front" ? "FRONT" : "BACK"}
                </span>
              </div>

              {/* ⚡ 一括操作 */}
              <div className="rounded-md bg-white border border-neutral-200 p-2 space-y-2">
                <div className="text-[10px] font-bold text-neutral-700">
                  ⚡ {sideLabel}の一括操作
                </div>
                <div>
                  <div className="text-[9px] text-neutral-500 mb-1">
                    整列（{sideLabel}の全項目をカード内にきちんと収めて左／中央／右に揃えます）
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: "left", label: "左寄せ整列", emoji: "◧" },
                        { id: "center", label: "中央整列", emoji: "◫" },
                        { id: "right", label: "右寄せ整列", emoji: "◨" },
                      ] as { id: "left" | "center" | "right"; label: string; emoji: string }[]
                    ).map(({ id, label, emoji }) => {
                      const active = align === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => bulkAlign(side, id)}
                          className={`text-[10px] px-1.5 py-1 rounded border active:scale-95 transition flex items-center justify-center gap-1 ${
                            active
                              ? `${accentBtnBg} text-white shadow-sm`
                              : `border-neutral-300 bg-white text-neutral-800 ${accentBtnHover}`
                          }`}
                          title={`${sideLabel}の全項目を${label}にします`}
                        >
                          <span className="text-sm">{emoji}</span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {align && (
                    <button
                      type="button"
                      onClick={() => clearBulkAlign(side)}
                      className="mt-1 w-full text-[10px] py-1 rounded border border-neutral-300 text-neutral-600 bg-white hover:bg-neutral-50"
                    >
                      ↺ {sideLabel}の整列を解除
                    </button>
                  )}
                </div>
              </div>

              {/* 項目別 X/Y/倍率 */}
              {items.length === 0 ? (
                <div className="text-[11px] text-neutral-500 bg-white border border-neutral-200 rounded p-2">
                  {sideLabel}に表示する入力項目がありません。
                </div>
              ) : (
                <div className="space-y-1.5">
                  {items.map(({ role, label }) => {
                    const offset = offsets[role] ?? { x: 0, y: 0 };
                    const size = sizes[role] ?? 1;
                    return (
                      <div
                        key={role}
                        className="rounded-md bg-white border border-neutral-200 p-2 space-y-1"
                      >
                        <div className="text-[11px] font-bold text-neutral-900">{label}</div>
                        <div className="grid grid-cols-3 gap-1 pl-1">
                          <label className="flex items-center gap-1 text-[10px]">
                            X
                            <input
                              type="number"
                              value={offset.x.toFixed(1)}
                              onChange={(e) =>
                                setLayoutOffset(side, role, "x", parseFloat(e.target.value) || 0)
                              }
                              step={0.5}
                              min={-20}
                              max={20}
                              className="w-14 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                            />
                            <span className="text-[9px] text-neutral-400">mm</span>
                          </label>
                          <label className="flex items-center gap-1 text-[10px]">
                            Y
                            <input
                              type="number"
                              value={offset.y.toFixed(1)}
                              onChange={(e) =>
                                setLayoutOffset(side, role, "y", parseFloat(e.target.value) || 0)
                              }
                              step={0.5}
                              min={-15}
                              max={15}
                              className="w-14 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                            />
                            <span className="text-[9px] text-neutral-400">mm</span>
                          </label>
                          <label className="flex items-center gap-1 text-[10px]">
                            倍
                            <input
                              type="number"
                              value={size.toFixed(2)}
                              onChange={(e) =>
                                setFontSize(side, role, parseFloat(e.target.value) || 1)
                              }
                              step={0.05}
                              min={0.5}
                              max={2}
                              className="w-14 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => resetSideAll(side)}
                    className="w-full text-[10px] py-1.5 rounded border border-neutral-300 text-neutral-600 bg-white hover:bg-neutral-50"
                  >
                    ↺ {sideLabel}の項目別調整を全てリセット
                  </button>
                </div>
              )}
            </div>
          );
        };

        return (
          <div className="grid gap-3 md:grid-cols-2">
            {renderEditor("front")}
            {renderEditor("back")}
          </div>
        );
      })()}

      <div className="rounded-xl border border-neutral-200 p-4 space-y-4">
        <div>
          <div className="text-sm font-bold text-neutral-900 mb-1">
            🎯 一括文字レイヤー位置調整（背景は動きません）
          </div>
          <div className="text-[11px] text-neutral-600 mb-3 leading-relaxed">
            背景画像や塗りはそのままに、文字情報だけを左右・上下に動かせます。
            印刷時の余白の出方を見ながら微調整してください。
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              横位置（X軸）
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              {fa.offsetX > 0 ? "+" : ""}{fa.offsetX.toFixed(1)}mm
            </div>
          </div>
          <input
            type="range"
            min={-8}
            max={8}
            step={0.5}
            value={fa.offsetX}
            onChange={(e) => setOffsetX(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5 font-mono">
            <span>← 左 −8mm</span>
            <span>0</span>
            <span>右 +8mm →</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              縦位置（Y軸）
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              {fa.offsetY > 0 ? "+" : ""}{fa.offsetY.toFixed(1)}mm
            </div>
          </div>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.5}
            value={fa.offsetY}
            onChange={(e) => setOffsetY(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5 font-mono">
            <span>↑ 上 −5mm</span>
            <span>0</span>
            <span>下 +5mm ↓</span>
          </div>
        </div>

        {(fa.offsetX !== 0 || fa.offsetY !== 0) && (
          <button
            type="button"
            onClick={() => {
              setOffsetX(0);
              setOffsetY(0);
            }}
            className="w-full text-xs px-3 py-2 rounded-md border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50"
          >
            ↩ 0 にリセット
          </button>
        )}

        <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 leading-relaxed">
          ⚠️ 文字位置調整はテンプレートによって効き方が異なります。背景まで動いてしまう旧テンプレートではこの調整は反映されない場合があります（順次対応中）。
        </div>
      </div>

      {/* 住所の配置 UI は カスタマイズ→テキストタブ末尾 に移設したためここでは表示しない。 */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="px-3 py-1 rounded-md bg-white border border-amber-300 text-[11px] text-amber-800 font-medium hover:bg-amber-100"
        >
          ↺ 全リセット
        </button>
      </div>
    </StepShell>
  );
}
