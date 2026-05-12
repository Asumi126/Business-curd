"use client";

import { CardData } from "../../lib/types";
import { Field, TextInput } from "./Field";
import { FrontQREditor } from "./FrontQREditor";
import { StepShell } from "./StepShell";

/** 「QRコードを挿入しない」と明示する赤い警告バッジ。Step6Logo と統一デザイン。 */
function SkipBadge({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`mb-3 inline-flex items-center gap-2 cursor-pointer rounded-md border-2 px-2.5 py-1.5 transition select-none ${
        checked
          ? "border-red-500 bg-red-50 text-red-800 shadow-sm"
          : "border-red-300 bg-white text-red-700 hover:bg-red-50/60"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 shrink-0 accent-red-600"
      />
      <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
        {checked ? "✓ " : "⚠ "}
        {label}
      </span>
    </label>
  );
}

export type QRTab = "front" | "back";
/** Wizard の「次へ」が順送りする QR ステップのサブタブ順序。 */
export const QR_TABS: QRTab[] = ["front", "back"];

/**
 * 「QR横の見出し」入力欄の placeholder ラベルを裏面テンプレ別に切替するためのマップ。
 * Step9Back から流用したサブセット。ない場合は "SCAN ME" などの汎用値を表示する。
 */
const BACK_QR_TEXT_LABEL: Record<string, { label: string; placeholder: string; hint: string }> = {
  "qr-split": {
    label: "QR横の見出し",
    placeholder: "SCAN ME",
    hint: "QRの近くに表示される短い文字。空欄ならテンプレ既定値「SCAN ME」が入ります。",
  },
  "big-qr": {
    label: "QR下のメッセージ",
    placeholder: "SCAN TO CONNECT",
    hint: "QRの下に大きく表示される短いメッセージ。",
  },
  "qr-memo": {
    label: "QR横の見出し",
    placeholder: "Contact",
    hint: "QRの下に表示される見出し。",
  },
  "qr-memo-split": {
    label: "QR横の見出し",
    placeholder: "Contact",
    hint: "QRの下に表示される見出し。",
  },
  "qr-slogan": {
    label: "QR下の見出し",
    placeholder: "Contact",
    hint: "QRの下に表示される見出し。",
  },
  "qr-big-text": {
    label: "大見出し（QRの上）",
    placeholder: "LINEで繋がろう",
    hint: "QRの上に大きく表示される見出し。",
  },
  "dual-qr-side": {
    label: "1つ目のQRの見出し",
    placeholder: "vCard",
    hint: "左側QRの下に表示されるラベル。",
  },
  "dual-qr-stacked": {
    label: "1つ目のQRの見出し",
    placeholder: "Contact",
    hint: "上のQRに付くラベル。",
  },
  "dual-qr-memo": {
    label: "1つ目のQRの見出し",
    placeholder: "vCard",
    hint: "左のQRに付くラベル。",
  },
};

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
  backStyleId: string;
  /** 親 Wizard が制御する内部タブ状態。「次へ」「戻る」で順送りされる。 */
  tab: QRTab;
  setTab: (t: QRTab) => void;
};

/**
 * QRコード設定ステップ — 表面QR・裏面QR の設定を1ヶ所に集約。
 *
 * 旧構成では:
 *  - 表面QR: Step8Customize の「qr」タブにあった (FrontQREditor)
 *  - 裏面QR: Step9Back の中段に紛れて配置されていた
 * これを「QRコード設定」という独立ステップにまとめ、内部タブで表/裏を切替する。
 */
export function StepQRSettings({ data, update, backStyleId, tab, setTab }: Props) {
  const isQrStyle = /^qr-|^dual-qr-|big-qr/.test(backStyleId);
  const isDualQr =
    backStyleId === "dual-qr-side" ||
    backStyleId === "dual-qr-stacked" ||
    backStyleId === "dual-qr-memo";
  const textCfg = BACK_QR_TEXT_LABEL[backStyleId];

  return (
    <StepShell
      title="QRコードの設定"
      subtitle="表面に重ねるQRと、裏面に印字するQR の設定をここでまとめて行います。「次へ」で 表面 → 裏面 の順に進みます。"
    >
      {/* タブ切替 — 表面QR / 裏面QR */}
      <div className="sticky top-[148px] sm:top-[148px] z-20 -mx-4 px-3 py-1.5 bg-white border-y border-cyan-200 shadow-sm">
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: "front" as const, label: "表面のQR", emoji: "🪪", hint: "表面に小さくQRを重ねる" },
              { id: "back" as const, label: "裏面のQR", emoji: "📱", hint: "裏面テンプレで使うQRの内容を設定" },
            ]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md border transition ${
                  active
                    ? "bg-cyan-600 border-cyan-700 text-white shadow"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-cyan-400"
                }`}
                title={t.hint}
                aria-current={active ? "true" : undefined}
              >
                <span className="text-base leading-none">{t.emoji}</span>
                <span className="text-[10px] font-bold leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 表面QR タブ */}
      {tab === "front" && (
        <div className="space-y-3">
          <div className="rounded-lg bg-cyan-50 border border-cyan-200 px-3 py-2 text-[11px] text-cyan-900 leading-relaxed">
            <strong>表面QR</strong> は名刺の表面にオーバーレイで重ねる小さなQRです。
            位置・大きさ・指す情報を自由に設定できます。最大2つまで配置可能。
          </div>
          {/* スキップ宣言 — エディタの真上に赤バッジで目立つ位置に配置 */}
          <SkipBadge
            label="表面にQRコードを挿入しない"
            checked={!!data.frontQrSkipped}
            onChange={(v) => update({ frontQrSkipped: v })}
          />
          <FrontQREditor data={data} update={update} />
        </div>
      )}

      {/* 裏面QR タブ — 旧 Step9Back の QR セクションを移植 */}
      {tab === "back" && (
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900 leading-relaxed">
            <strong>裏面QR</strong> は裏面デザインに大きく印字するQRです。
            {!isQrStyle && (
              <span>
                {" "}現在の裏面デザインは QR を表示しないテンプレートですが、
                ここでの設定は将来 QR テンプレに切替えたときに引き継がれます。
              </span>
            )}
          </div>
          <SkipBadge
            label="裏面にQRコードを挿入しない"
            checked={!!data.backQrSkipped}
            onChange={(v) => update({ backQrSkipped: v })}
          />

          <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50/30 p-4 space-y-3">
            <div>
              <div className="text-sm font-bold text-neutral-900">📱 QRコードの内容</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                QRを読み取った時に開く情報を選びます。
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "vcard" as const,
                    label: "📇 連絡先（vCard）",
                    description: "iPhone等で読み取ると連絡先に追加できる",
                  },
                  {
                    id: "url" as const,
                    label: "🌐 カスタムURL",
                    description: "ウェブサイトやLPなど、好きなURLに飛ばす",
                  },
                ]
              ).map((opt) => {
                const selected = data.qrMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update({ qrMode: opt.id })}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border-2 transition text-left ${
                      selected
                        ? "border-blue-600 bg-white shadow-sm"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <div className="text-sm font-semibold text-neutral-900">{opt.label}</div>
                    <div className="text-[10px] text-neutral-500">{opt.description}</div>
                  </button>
                );
              })}
            </div>

            {data.qrMode === "url" && (
              <Field
                label="QRが指すURL"
                hint="このQRを読み取ったときに開くウェブサイトのURL。空欄ならウェブサイト欄が使われます"
                example="https://yamada-design.com / lanalife.co.jp"
              >
                <TextInput
                  value={data.qrUrl}
                  onChange={(v) => update({ qrUrl: v })}
                  placeholder="https://example.com"
                />
              </Field>
            )}

            <Field
              label={textCfg?.label ?? "QR横の見出し"}
              optional
              hint={
                textCfg?.hint ??
                "QRの近くに表示される短い見出し。「SCAN ME」「お問い合わせ」「LINE登録」など。空欄なら非表示またはテンプレ既定値が使われます。"
              }
              example={textCfg?.placeholder ?? "SCAN ME / お問い合わせ / LINE登録"}
            >
              <TextInput
                value={data.backText || data.qrCaption || ""}
                onChange={(v) => update({ backText: v, qrCaption: v })}
                placeholder={textCfg?.placeholder ?? "QRの横に表示する見出し"}
              />
            </Field>

            {/* 2つ目のQR (Dual-QR スタイル選択時のみ) */}
            {isDualQr && (
              <div className="rounded-xl border-2 border-purple-300 bg-purple-50/40 p-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">✨</span>
                  <span className="text-sm font-bold text-neutral-900">2つ目のQRコード</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-800 font-medium">
                    Dual QR
                  </span>
                </div>
                <div className="text-[11px] text-neutral-600 mb-3 leading-relaxed">
                  選択中の裏面スタイルは2つのQRを並べて表示できます。1つ目は連絡先（自動生成）、2つ目はお好みのURLや別の情報を設定できます。
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        qr2: {
                          enabled: true,
                          mode: "url",
                          url: data.qr2?.url ?? "",
                          caption: data.qr2?.caption ?? "Web",
                        },
                      })
                    }
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      data.qr2?.enabled && data.qr2?.mode === "url"
                        ? "border-purple-600 bg-white shadow-sm"
                        : "border-neutral-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="text-base mb-0.5">🌐</div>
                    <div className="text-xs font-bold">URL（推奨）</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      サイト・LINE・SNS等のリンク
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        qr2: {
                          enabled: true,
                          mode: "vcard",
                          url: data.qr2?.url ?? "",
                          caption: data.qr2?.caption ?? "Contact",
                        },
                      })
                    }
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      data.qr2?.enabled && data.qr2?.mode === "vcard"
                        ? "border-purple-600 bg-white shadow-sm"
                        : "border-neutral-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="text-base mb-0.5">📇</div>
                    <div className="text-xs font-bold">vCard</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      連絡先データ（自動生成）
                    </div>
                  </button>
                </div>

                {data.qr2?.enabled && data.qr2?.mode === "url" && (
                  <Field
                    label="2つ目のQRが指すURL"
                    hint="LINE公式アカウント、ポートフォリオサイト、ECサイトなど"
                    example="https://line.me/R/ti/p/@xxxx / https://yourshop.com"
                  >
                    <TextInput
                      value={data.qr2?.url ?? ""}
                      onChange={(v) =>
                        update({
                          qr2: {
                            ...(data.qr2 ?? { enabled: true, mode: "url" }),
                            enabled: true,
                            url: v,
                          },
                        })
                      }
                      placeholder="https://example.com"
                    />
                  </Field>
                )}

                {data.qr2?.enabled && (
                  <Field
                    label="2つ目のQRの説明文（ラベル）"
                    optional
                    hint="「LINE登録」「ポートフォリオ」「Shopを見る」など、QRの下に表示"
                  >
                    <TextInput
                      value={data.qr2?.caption ?? ""}
                      onChange={(v) =>
                        update({
                          qr2: {
                            ...(data.qr2 ?? { enabled: true, mode: "url" }),
                            enabled: true,
                            caption: v,
                          },
                        })
                      }
                      placeholder="LINE / Web / Shop など"
                    />
                  </Field>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </StepShell>
  );
}
