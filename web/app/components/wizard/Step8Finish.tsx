"use client";

import { useMemo, useRef, useState } from "react";
import { CardData, getCardSize } from "../../lib/types";
import { CardRenderer } from "../CardRenderer";
import { CardBack } from "../CardBack";
import {
  cardDimensions,
  computeA4MultiUpLayout,
  CutMarkStyle,
  downloadA4MultiUpPdf,
  downloadPdf,
  downloadPng,
  DuplexMode,
  openA4MultiUpPdfForPrint,
  PdfQuality,
} from "../../lib/export";
import { DownloadIcon, FileTextIcon, ImageIcon } from "../../lib/icons";
import { PrintingGuide } from "../PrintingGuide";
import { StepShell } from "./StepShell";
import { checkRequirements } from "../../lib/requirements";
import { saveProfile } from "../../lib/profiles";
import { BulkGenerateModal } from "../BulkGenerateModal";

type Props = {
  data: CardData;
  templateId: string;
  backStyleId: string;
  onOpenProfileManager: () => void;
  currentProfileId: string | null;
  onJumpTo: (step: number) => void;
  /** 未訪問のステップ番号一覧。空配列なら全ステップ訪問済みで印刷/PDF可。 */
  missedSteps?: number[];
};

const DUPLEX_OPTIONS: {
  id: DuplexMode;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    id: "single",
    label: "片面のみ（表だけ印刷）",
    short: "片面",
    description: "裏面は印刷しません。表だけ使うシンプルな名刺に",
  },
  {
    id: "long-edge",
    label: "両面・長辺フリップ（一般的な両面印刷）",
    short: "長辺",
    description: "プリンタで「長辺とじ」を選ぶ場合。横向き名刺はこれが標準",
  },
  {
    id: "short-edge",
    label: "両面・短辺フリップ",
    short: "短辺",
    description: "プリンタで「短辺とじ」を選ぶ場合",
  },
  {
    id: "no-flip",
    label: "両面・手差し（紙を裏返さず再給紙）",
    short: "そのまま",
    description: "片面ずつ印刷して、紙の向きを変えずに再給紙する場合",
  },
];

function A4MiniPreview({
  columns,
  rows,
  side,
  flipMode,
  marginX,
  marginY,
  cardW,
  cardH,
  gap,
  cutStyle,
}: {
  columns: number;
  rows: number;
  side: "front" | "back";
  flipMode: DuplexMode;
  marginX: number;
  marginY: number;
  cardW: number;
  cardH: number;
  gap: number;
  cutStyle: CutMarkStyle;
}) {
  const A4W = 210;
  const A4H = 297;
  const cells = [];
  let n = 1;
  const totalW = columns * cardW + (columns - 1) * gap;
  const totalH = rows * cardH + (rows - 1) * gap;
  const lineColor = side === "front" ? "#3b82f6" : "#d97706";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      let placeC = c;
      let placeR = r;
      if (side === "back") {
        if (flipMode === "long-edge") placeC = columns - 1 - c;
        else if (flipMode === "short-edge") placeR = rows - 1 - r;
      }
      const x = marginX + placeC * (cardW + gap);
      const y = marginY + placeR * (cardH + gap);
      cells.push(
        <g key={`${r}-${c}`}>
          <rect
            x={x}
            y={y}
            width={cardW}
            height={cardH}
            fill={side === "front" ? "#dbeafe" : "#fef3c7"}
            stroke="transparent"
            rx="0.4"
          />
          <text
            x={x + cardW / 2}
            y={y + cardH / 2 + 2.5}
            textAnchor="middle"
            fontSize="6.5"
            fontWeight="800"
            fill={side === "front" ? "#1e3a8a" : "#78350f"}
          >
            {n}
          </text>
        </g>,
      );
      n++;
    }
  }

  // Template grid lines that run from edge to edge of the card area
  const gridLines: React.ReactElement[] = [];
  if (cutStyle === "template-grid") {
    const ext = 3;
    for (let c = 0; c <= columns; c++) {
      const x = marginX + c * cardW + Math.max(0, c - 1) * gap;
      const positions = c === 0 || c === columns || gap === 0 ? [x] : [x, x + gap];
      for (const xp of positions) {
        gridLines.push(
          <line
            key={`v-${c}-${xp}`}
            x1={xp}
            y1={marginY - ext}
            x2={xp}
            y2={marginY + totalH + ext}
            stroke={lineColor}
            strokeWidth="0.5"
          />,
        );
      }
    }
    for (let r = 0; r <= rows; r++) {
      const y = marginY + r * cardH + Math.max(0, r - 1) * gap;
      const positions = r === 0 || r === rows || gap === 0 ? [y] : [y, y + gap];
      for (const yp of positions) {
        gridLines.push(
          <line
            key={`h-${r}-${yp}`}
            x1={marginX - ext}
            y1={yp}
            x2={marginX + totalW + ext}
            y2={yp}
            stroke={lineColor}
            strokeWidth="0.5"
          />,
        );
      }
    }
  } else if (cutStyle === "dashed") {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const x = marginX + c * (cardW + gap);
        const y = marginY + r * (cardH + gap);
        gridLines.push(
          <rect
            key={`d-${r}-${c}`}
            x={x}
            y={y}
            width={cardW}
            height={cardH}
            fill="none"
            stroke={lineColor}
            strokeWidth="0.5"
            strokeDasharray="1.5 1"
          />,
        );
      }
    }
  } else if (cutStyle === "corners") {
    const m = 1.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const x = marginX + c * (cardW + gap);
        const y = marginY + r * (cardH + gap);
        const corners = [
          [x - m, y, x, y, x, y - m, x, y],
          [x + cardW, y, x + cardW + m, y, x + cardW, y - m, x + cardW, y],
          [x - m, y + cardH, x, y + cardH, x, y + cardH, x, y + cardH + m],
          [
            x + cardW,
            y + cardH,
            x + cardW + m,
            y + cardH,
            x + cardW,
            y + cardH,
            x + cardW,
            y + cardH + m,
          ],
        ];
        corners.forEach((pts, i) => {
          gridLines.push(
            <g key={`cm-${r}-${c}-${i}`}>
              <line x1={pts[0]} y1={pts[1]} x2={pts[2]} y2={pts[3]} stroke={lineColor} strokeWidth="0.4" />
              <line x1={pts[4]} y1={pts[5]} x2={pts[6]} y2={pts[7]} stroke={lineColor} strokeWidth="0.4" />
            </g>,
          );
        });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${A4W} ${A4H}`}
      width="98"
      height="139"
      className="bg-white border border-neutral-300 rounded shadow-sm"
      style={{ display: "block" }}
    >
      <rect x="0" y="0" width={A4W} height={A4H} fill="#fff" />
      <rect
        x="2"
        y="2"
        width={A4W - 4}
        height={A4H - 4}
        fill="none"
        stroke="#e5e5e5"
        strokeWidth="0.4"
      />
      {cells}
      {gridLines}
      <text
        x={A4W / 2}
        y={A4H - 6}
        textAnchor="middle"
        fontSize="6"
        fill="#9ca3af"
        fontWeight="600"
      >
        A4 / {columns}×{rows} = {columns * rows}枚
      </text>
    </svg>
  );
}

// ステップ番号は 10 ステップ構成に合わせる:
//   1=ようこそ / 2=情報入力 / 3=デザイン / 4=裏面 / 5=挿入画像 /
//   6=QR / 7=カラー / 8=テキスト / 9=微調整 / 10=完成
const JUMP_BUTTONS: { label: string; emoji: string; step: number; description: string }[] = [
  { emoji: "🪪", label: "情報入力", step: 2, description: "名前・仕事・連絡先・SNS" },
  { emoji: "✨", label: "テンプレ", step: 3, description: "デザイン・サイズを変える" },
  { emoji: "🔄", label: "裏面", step: 4, description: "裏面デザイン" },
  { emoji: "🖼", label: "ロゴ・写真", step: 5, description: "ロゴ／顔写真／背景画像" },
  { emoji: "📱", label: "QR設定", step: 6, description: "表面QR・裏面QRの内容と見出し" },
  { emoji: "🎨", label: "カラー", step: 7, description: "表面/裏面の色をカスタム" },
  { emoji: "✒️", label: "テキスト", step: 8, description: "書体・項目別フォント" },
  { emoji: "🎚", label: "微調整", step: 9, description: "表示項目・項目別効果" },
];

export function Step8Finish({
  data,
  templateId,
  backStyleId,
  onOpenProfileManager,
  currentProfileId,
  onJumpTo,
  missedSteps = [],
}: Props) {
  // 全ステップ完了済み判定。未訪問があれば印刷/PDF系のアクションを無効化する。
  const allStepsVisited = missedSteps.length === 0;
  const [showBleedPreview, setShowBleedPreview] = useState(false);
  const [includeBack, setIncludeBack] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [quality, setQuality] = useState<PdfQuality>("print");
  const [duplexMode, setDuplexMode] = useState<DuplexMode>("single");
  const [paperType, setPaperType] = useState<"perforated" | "plain-a4">("plain-a4");
  const cutMarkStyle: CutMarkStyle = paperType === "perforated" ? "none" : "template-grid";
  const gapMm = 0;
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // bleed=true (97×61mm) — for print-shop PDF (downloadPdf)
  const exportFrontRef = useRef<HTMLDivElement>(null);
  const exportBackRef = useRef<HTMLDivElement>(null);
  // bleed=false (91×55mm trim only) — for A4 multi-up home print.
  // Using bleed=true here would compress 97×61mm into 91×55mm = 93.8% scale,
  // which causes front/back misalignment and undersized cards.
  const a4FrontRef = useRef<HTMLDivElement>(null);
  const a4BackRef = useRef<HTMLDivElement>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // 裏面選択ステップ (Step 4 = 裏面選択) を訪問済みかで「裏面デザインが
  // 設計されている」と見なす。Wizard.tsx 側で missedSteps を渡しており、
  // 含まれていなければ user-configured とみなす。
  const hasBackDesign = !missedSteps.includes(4);

  /**
   * 印刷種類と裏面設計の整合性をチェック。
   *  - 両面印刷を選んだのに裏面デザイン未設定 → 裏面選択へジャンプ提案
   *  - 片面印刷だが裏面デザインが設計済み → 裏面が印刷されない旨を警告
   * 続行してよければ true、中断 (or ジャンプ) なら false を返す。
   */
  const assertPrintSettings = (): boolean => {
    if (duplexMode !== "single" && !hasBackDesign) {
      const go = window.confirm(
        "裏面デザインがまだ選択されていません。\n両面印刷をするには裏面のデザインを選んでください。\n\n「OK」で裏面選択ページにジャンプします。",
      );
      if (go) onJumpTo(4);
      return false;
    }
    if (duplexMode === "single" && hasBackDesign && includeBack) {
      const ok = window.confirm(
        "現在「片面印刷」が選択されていますが、裏面デザインが設計されています。\nこのまま進めると裏面は印刷されません。よろしいですか？",
      );
      if (!ok) return false;
    }
    return true;
  };

  const handlePdf = async () => {
    if (!exportFrontRef.current) return;
    if (!assertPrintSettings()) return;
    setBusy("pdf");
    try {
      await downloadPdf(exportFrontRef.current, {
        backNode: includeBack ? exportBackRef.current : null,
        withBleed: true,
        filename: `mycard-${templateId}.pdf`,
        quality,
        cardWidthMm: cardSize.widthMm,
        cardHeightMm: cardSize.heightMm,
      });
      showFeedback("✓ PDFを保存しました（ダウンロードフォルダ）");
    } finally {
      setBusy(null);
    }
  };

  const handlePngFront = async () => {
    if (!exportFrontRef.current) return;
    setBusy("png-front");
    try {
      await downloadPng(exportFrontRef.current, `mycard-${templateId}-front.png`, quality);
      showFeedback("✓ 表面PNGを保存しました");
    } finally {
      setBusy(null);
    }
  };

  const handlePngBack = async () => {
    if (!exportBackRef.current) return;
    setBusy("png-back");
    try {
      await downloadPng(exportBackRef.current, `mycard-${templateId}-back.png`, quality);
      showFeedback("✓ 裏面PNGを保存しました");
    } finally {
      setBusy(null);
    }
  };

  const [showPrintGuideModal, setShowPrintGuideModal] = useState(false);

  const cardSize = useMemo(
    () => getCardSize(data.customization.cardSize),
    [data.customization.cardSize],
  );
  const a4Layout = useMemo(
    () => computeA4MultiUpLayout(cardSize.widthMm, cardSize.heightMm, gapMm),
    [cardSize.widthMm, cardSize.heightMm, gapMm],
  );

  const handleA4MultiUp = async () => {
    // 塗り足し+トンボ付きの完全アライメント版を使うため、bleed=true のキャプチャ
     // (exportFrontRef/exportBackRef = 97×61mm) を渡す。aspect ratio 完全一致で
     // アスペクト崩れを防止。家庭用プリンタの±1-3mmドリフトを吸収。
    if (!exportFrontRef.current) return;
    if (!assertPrintSettings()) return;
    setBusy("a4");
    try {
      const layout = await downloadA4MultiUpPdf(exportFrontRef.current, {
        quality,
        filename: `mycard-a4-x${a4Layout.cardsPerSheet}-${templateId}.pdf`,
        cardWidthMm: cardSize.widthMm,
        cardHeightMm: cardSize.heightMm,
        backNode: duplexMode !== "single" ? exportBackRef.current : null,
        duplexMode,
        cutMarkStyle,
        gapMm,
      });
      const pages = duplexMode === "single" ? "片面" : "両面";
      showFeedback(
        `✓ A4 ${layout.cardsPerSheet}面付け（${pages}）PDFを保存しました`,
      );
    } finally {
      setBusy(null);
    }
  };

  const handleA4Print = async () => {
    // 同上: bleed=true キャプチャで完全アライメント版を使用
    if (!exportFrontRef.current) return;
    if (!assertPrintSettings()) return;
    setBusy("a4-print");
    try {
      await openA4MultiUpPdfForPrint(exportFrontRef.current, {
        quality,
        cardWidthMm: cardSize.widthMm,
        cardHeightMm: cardSize.heightMm,
        backNode: duplexMode !== "single" ? exportBackRef.current : null,
        duplexMode,
        cutMarkStyle,
        gapMm,
      });
      showFeedback(
        "✓ 新しいタブでPDFを開きました。⌘P（Mac）または Ctrl+P（Win）で印刷",
      );
    } finally {
      setBusy(null);
    }
  };

  const dpi =
    quality === "print" ? cardDimensions.effectiveDpi : Math.round((cardDimensions.effectiveDpi / 6) * 4);

  const issues = checkRequirements(data, templateId);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  return (
    <StepShell
      title="完成！ 印刷発注できる本格データ"
      subtitle="プレビューが印刷後の見た目です。塗り足し3mmはダウンロードPDF/PNGに自動付加されます。"
    >
      {/* Pre-flight check: missing required info → one-click jump back to fix */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div
          className={`rounded-2xl border-2 p-4 ${
            errors.length > 0
              ? "border-red-300 bg-red-50/40"
              : "border-amber-300 bg-amber-50/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{errors.length > 0 ? "⚠️" : "ℹ️"}</span>
            <div className={`text-sm font-bold ${errors.length > 0 ? "text-red-900" : "text-amber-900"}`}>
              {errors.length > 0
                ? `必須項目が ${errors.length} 件 足りません`
                : `推奨項目が ${warnings.length} 件 未入力です`}
            </div>
          </div>
          <div
            className={`text-[11px] mb-3 leading-relaxed ${
              errors.length > 0 ? "text-red-800" : "text-amber-800"
            }`}
          >
            {errors.length > 0
              ? "印刷前に下の項目を埋めてください。クリックでそのページに直接ジャンプします。"
              : "完成前に確認をおすすめします。クリックで該当ページに飛べます。"}
          </div>
          <div className="space-y-1.5">
            {issues.map((iss, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onJumpTo(iss.step)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:shadow-sm active:scale-[0.99] transition text-left ${
                  iss.level === "error"
                    ? "border-red-300 hover:border-red-500"
                    : "border-amber-300 hover:border-amber-500"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                    iss.level === "error"
                      ? "bg-red-600 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {iss.step}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm font-bold ${
                      iss.level === "error" ? "text-red-900" : "text-amber-900"
                    }`}
                  >
                    {iss.label}
                  </span>
                  <span className="block text-[11px] text-neutral-600 mt-0.5">
                    {iss.detail}
                  </span>
                </span>
                <span
                  className={`text-base ${
                    iss.level === "error" ? "text-red-700" : "text-amber-700"
                  }`}
                >
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-[10px] font-semibold text-blue-700 tracking-[0.25em] uppercase">
              編集に戻る
            </div>
            <div className="text-sm font-bold text-neutral-900 mt-0.5">
              特定の項目だけ修正したい時はここから直接ジャンプ
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {JUMP_BUTTONS.map((b) => (
            <button
              key={b.step}
              type="button"
              onClick={() => onJumpTo(b.step)}
              className="group flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-sm active:scale-[0.99] transition text-left"
            >
              <span className="w-8 h-8 rounded-md bg-neutral-100 group-hover:bg-blue-100 flex items-center justify-center text-base shrink-0 transition">
                {b.emoji}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-neutral-900 truncate">
                  {b.label}
                </span>
                <span className="block text-[9px] text-neutral-500 truncate">
                  {b.description}
                </span>
              </span>
              <span className="text-neutral-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0">
                ↩
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✓</span>
          <div className="font-semibold text-emerald-900">印刷品質チェック（プリフライト）</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-5 text-emerald-600">✓</span>
            <span><strong>サイズ:</strong> 91×55mm（日本標準）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-emerald-600">✓</span>
            <span><strong>塗り足し:</strong> PDF出力時に自動で3mm追加</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-emerald-600">✓</span>
            <span><strong>解像度:</strong> 約 {dpi} dpi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-emerald-600">✓</span>
            <span><strong>形式:</strong> PDF (PNG埋め込み)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-emerald-600">✓</span>
            <span><strong>カラー:</strong> RGB（主要印刷会社で受付可）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-emerald-600">✓</span>
            <span><strong>フォント:</strong> 画像化済み</span>
          </div>
        </div>
      </div>

      {/*
        完成ページの左側 大プレビュー（表面・裏面）はユーザー要望により削除。
        右サイドの「仕上がり」プレビュー（Wizard aside）でカード現状を確認できる。
      */}

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col gap-3">
        <div className="font-semibold text-neutral-800 text-sm">⚙️ 出力オプション</div>

        {/* 確認用プレビュー — 塗り足し/セーフゾーンのトグルを実際に反映する */}
        {(showBleedPreview || showSafeZone) && (
          <div className="rounded-lg bg-white border border-neutral-200 p-3">
            <div className="text-[11px] font-bold text-neutral-700 mb-2 tracking-wider uppercase">
              確認用プレビュー
              <span className="ml-2 text-[10px] font-normal text-neutral-500">
                {showBleedPreview && "塗り足し領域"}
                {showBleedPreview && showSafeZone && " / "}
                {showSafeZone && "セーフゾーン"}
                を表示中
              </span>
            </div>
            <div className="flex flex-wrap gap-4 items-start">
              <div>
                <div className="text-[10px] text-neutral-500 mb-1">表面</div>
                <CardRenderer
                  data={data}
                  templateId={templateId}
                  bleed={showBleedPreview}
                  showSafeZone={showSafeZone}
                />
              </div>
              {includeBack && (
                <div>
                  <div className="text-[10px] text-neutral-500 mb-1">裏面</div>
                  <CardBack
                    data={data}
                    templateId={templateId}
                    backStyleId={backStyleId}
                    bleed={showBleedPreview}
                    showSafeZone={showSafeZone}
                  />
                </div>
              )}
            </div>
            <div className="text-[10px] text-neutral-500 mt-2 leading-relaxed space-y-0.5">
              {showBleedPreview && (
                <div>
                  <span className="inline-block w-3 h-0 align-middle border-t border-dashed border-red-400" />{" "}
                  赤の破線 = 実際の切り取り位置（91×55mm）
                </div>
              )}
              {showSafeZone && (
                <div>
                  <span className="inline-block w-3 h-0 align-middle border-t border-dashed border-emerald-500" />{" "}
                  緑の破線 = セーフゾーン（重要な要素はこの内側に収める）
                </div>
              )}
            </div>
          </div>
        )}

        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeBack}
            onChange={(e) => setIncludeBack(e.target.checked)}
            className="w-4 h-4 mt-0.5"
          />
          <span>
            <strong>裏面をPDFに含める（両面印刷用）</strong>
            <span className="block text-xs text-neutral-500 mt-0.5">
              片面印刷の場合はOFFに
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showBleedPreview}
            onChange={(e) => setShowBleedPreview(e.target.checked)}
            className="w-4 h-4 mt-0.5"
          />
          <span>
            <strong>プレビューに塗り足し領域を表示する（確認用）</strong>
            <span className="block text-xs text-neutral-500 mt-0.5">
              ON にすると上の確認用プレビューが 97×61mm 表示になり、赤い破線で実際の切り取り位置を表示
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showSafeZone}
            onChange={(e) => setShowSafeZone(e.target.checked)}
            className="w-4 h-4 mt-0.5"
          />
          <span>
            <strong>セーフゾーンを表示（確認用）</strong>
            <span className="block text-xs text-neutral-500 mt-0.5">
              重要な要素はこの緑線の中に収まっていればOK
            </span>
          </span>
        </label>
        <div className="flex items-start gap-3 text-sm">
          <span className="font-medium text-neutral-700 mt-1.5 w-20 shrink-0">品質</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setQuality("print")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                quality === "print"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-neutral-700 border-neutral-300"
              }`}
            >
              印刷品質（{cardDimensions.effectiveDpi}dpi）
            </button>
            <button
              type="button"
              onClick={() => setQuality("standard")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                quality === "standard"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-neutral-700 border-neutral-300"
              }`}
            >
              通常（{Math.round((cardDimensions.effectiveDpi / 6) * 4)}dpi）
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <DownloadIcon size="22" className="text-blue-600" />
          <div className="text-base font-bold text-neutral-900">ここからダウンロード</div>
        </div>
        <p className="text-xs text-neutral-600 mb-4">
          ボタンをクリックすると、ご自分のPCに名刺データが保存されます。保存先は通常「ダウンロードフォルダ」です。
        </p>

        <button
          type="button"
          onClick={handlePdf}
          disabled={!!busy}
          className="group w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait text-white shadow-lg transition mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <FileTextIcon size="22" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">
                {busy === "pdf" ? "保存中..." : "PDFをダウンロード"}
              </div>
              <div className="text-[11px] text-blue-100">
                印刷会社に発注するならコレ。塗り足し3mm込みで保存されます
              </div>
            </div>
          </div>
          <DownloadIcon size="20" className="opacity-90 group-hover:translate-y-0.5 transition" />
        </button>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handlePngFront}
            disabled={!!busy}
            className="group flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-neutral-300 hover:border-blue-400 hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait transition"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
              <ImageIcon size="18" className="text-neutral-700" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-neutral-900">
                {busy === "png-front" ? "保存中..." : "表面 PNG"}
              </div>
              <div className="text-[11px] text-neutral-500">SNSアイコン用</div>
            </div>
            <DownloadIcon size="16" className="text-neutral-400 group-hover:text-blue-600 group-hover:translate-y-0.5 transition" />
          </button>

          <button
            type="button"
            onClick={handlePngBack}
            disabled={!!busy}
            className="group flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-neutral-300 hover:border-blue-400 hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait transition"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
              <ImageIcon size="18" className="text-neutral-700" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-neutral-900">
                {busy === "png-back" ? "保存中..." : "裏面 PNG"}
              </div>
              <div className="text-[11px] text-neutral-500">QR画像が欲しいとき</div>
            </div>
            <DownloadIcon size="16" className="text-neutral-400 group-hover:text-blue-600 group-hover:translate-y-0.5 transition" />
          </button>
        </div>

        {feedback && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-100 border border-emerald-300 text-sm text-emerald-900 font-medium">
            {feedback}
          </div>
        )}
      </div>

      {/* ワンクリック保存: ボタンを押した時点で名刺帳に保存 (toast 表示・ページ遷移なし)。
          詳細な管理は隣の「管理…」ボタンから ProfileManager を開ける。 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const autoLabel =
              data.nameJa?.trim() ||
              data.lastName?.trim() ||
              data.company?.trim() ||
              `名刺 ${new Date().toLocaleDateString("ja-JP")}`;
            const result = saveProfile({
              label: autoLabel,
              kind: "card",
              data,
              templateId,
              backStyleId,
              existingId: currentProfileId ?? undefined,
            });
            if (result.ok) {
              showFeedback(
                currentProfileId
                  ? `✓ 名刺帳に上書き保存しました（${autoLabel}）`
                  : `✓ 名刺帳に保存しました（${autoLabel}）`,
              );
            } else {
              showFeedback(`✗ 保存に失敗: ${result.message}`);
            }
          }}
          className="flex-1 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 p-4 text-left transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💾</span>
            <div>
              <div className="font-semibold text-sm text-neutral-900">
                {currentProfileId
                  ? "名刺帳に上書き保存（ワンクリック）"
                  : "この名刺を「名刺帳」に保存（ワンクリック）"}
              </div>
              <div className="text-xs text-neutral-600 mt-0.5">
                クリックでそのまま保存します（最大10件・ページ遷移なし）
              </div>
            </div>
          </div>
          <span className="text-amber-700">↻</span>
        </button>
        <button
          type="button"
          onClick={onOpenProfileManager}
          className="rounded-xl border border-amber-300 bg-white hover:bg-amber-50 px-3 text-[11px] font-semibold text-amber-800 transition"
          title="名刺帳の一覧/管理を開く"
        >
          管理
        </button>
      </div>

      {/* 💼 一括生成 — 同じデザインで名簿の全員分を一気にPDF化 (#214) */}
      <button
        type="button"
        onClick={() => setBulkModalOpen(true)}
        className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 hover:from-purple-50 hover:to-indigo-50 p-4 text-left transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💼</span>
          <div>
            <div className="font-semibold text-sm text-neutral-900">
              同じデザインで名簿から一括生成（最大50名）
            </div>
            <div className="text-xs text-neutral-600 mt-0.5">
              現在のデザインそのままに、CSV・連絡帳・連携シートから複数人分の名刺をまとめてPDF化
            </div>
          </div>
        </div>
        <span className="text-purple-700">→</span>
      </button>

      <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🏠</span>
          <div className="text-base font-bold text-neutral-900">自宅のプリンタで印刷する</div>
        </div>
        <div className="text-[11px] text-neutral-600 mb-3 leading-relaxed">
          A4用紙1枚に名刺を並べた、ご家庭のプリンター用PDFを生成します。
          市販の名刺用紙（A4 マイクロミシン目入り）にそのまま印刷でき、カットも簡単。
        </div>

        {/* 用紙タイプ選択 */}
        <div className="rounded-lg bg-white/70 border border-emerald-200 p-3 mb-3">
          <div className="text-[10px] font-semibold text-emerald-800 tracking-[0.2em] uppercase mb-2">
            使う用紙の種類
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaperType("plain-a4")}
              className={`text-left p-3 rounded-lg border-2 transition ${
                paperType === "plain-a4"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-emerald-400"
              }`}
            >
              <div className="text-base mb-0.5">📄</div>
              <div className="text-[12px] font-bold">無地のA4用紙</div>
              <div
                className={`text-[10px] leading-tight mt-0.5 ${
                  paperType === "plain-a4" ? "text-emerald-50" : "text-neutral-500"
                }`}
              >
                家にある普通のコピー用紙。ハサミ・カッターで切る用に点線（ミシン線）が入ります
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaperType("perforated")}
              className={`text-left p-3 rounded-lg border-2 transition ${
                paperType === "perforated"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-emerald-400"
              }`}
            >
              <div className="text-base mb-0.5">🧷</div>
              <div className="text-[12px] font-bold">名刺用紙（ミシン目入り）</div>
              <div
                className={`text-[10px] leading-tight mt-0.5 ${
                  paperType === "perforated" ? "text-emerald-50" : "text-neutral-500"
                }`}
              >
                市販の名刺用専用用紙（エレコム・サンワ・ダイソー等）。線は不要なので入りません
              </div>
            </button>
          </div>
          {paperType === "perforated" && (
            <div className="mt-2 text-[10px] text-neutral-600 leading-relaxed bg-amber-50 border border-amber-200 rounded p-2">
              💡 <strong>{a4Layout.cardsPerSheet}面付け対応</strong>の名刺用紙をご用意ください。
              代表例：エレコム MT-MN1WN（10面）、サンワサプライ JP-MC10、ダイソー名刺カード（10面）など
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white/70 border border-emerald-200 p-3 mb-3">
          <div className="text-[10px] font-semibold text-emerald-800 tracking-[0.2em] uppercase mb-1">
            選択中のサイズに合わせた配置
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-2xl font-black text-emerald-700">
              {a4Layout.cardsPerSheet}<span className="text-base">枚 / A4</span>
            </div>
            <div className="text-[11px] text-neutral-600">
              （{cardSize.label} / {a4Layout.columns}列 × {a4Layout.rows}行）
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            余白：左右 {a4Layout.marginX.toFixed(1)}mm ／ 上下 {a4Layout.marginY.toFixed(1)}mm（角に切り取りガイド線つき）
          </div>
        </div>

        {/* 表裏の向き選択 */}
        <div className="rounded-lg bg-white/70 border border-emerald-200 p-3 mb-3">
          <div className="text-[10px] font-semibold text-emerald-800 tracking-[0.2em] uppercase mb-2">
            印刷の種類
          </div>

          {/* Step1: 片面 / 両面 の大ボタン2枚 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (hasBackDesign && includeBack) {
                  const ok = window.confirm(
                    "片面印刷を選ぶと、設計済みの裏面デザインは印刷されません。\nよろしいですか？",
                  );
                  if (!ok) return;
                }
                setDuplexMode("single");
              }}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition ${
                duplexMode === "single"
                  ? "bg-blue-600 text-white border-blue-700 shadow-md"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-blue-400"
              }`}
            >
              <div className="text-2xl leading-none">📄</div>
              <div className="text-sm font-bold">片面印刷</div>
              <div
                className={`text-[10px] leading-tight ${
                  duplexMode === "single" ? "text-blue-50" : "text-neutral-500"
                }`}
              >
                表面のみ印刷
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!hasBackDesign) {
                  const go = window.confirm(
                    "裏面デザインがまだ選択されていません。\n両面印刷をするには裏面のデザインを選んでください。\n\n「OK」で裏面選択ページにジャンプします。",
                  );
                  if (go) onJumpTo(4);
                  return;
                }
                setDuplexMode(duplexMode === "single" ? "long-edge" : duplexMode);
              }}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition ${
                duplexMode !== "single"
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-emerald-400"
              }`}
            >
              <div className="text-2xl leading-none">📑</div>
              <div className="text-sm font-bold">両面印刷</div>
              <div
                className={`text-[10px] leading-tight ${
                  duplexMode !== "single" ? "text-emerald-50" : "text-neutral-500"
                }`}
              >
                表面+裏面を印刷
              </div>
            </button>
          </div>

          {/* 注意書き（裏面ありデザインの場合に両面印刷を選んでもらうための丁寧な案内） */}
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-2.5">
            <div className="text-[11px] font-bold text-red-700 leading-snug mb-1">
              ⚠ 裏面ありのデザインを選んでいる場合のご注意
            </div>
            <div className="text-[10.5px] text-red-700 leading-relaxed">
              裏面ありのデザインを選んでいる場合は、必ず <strong>「両面印刷」</strong> を選び、
              <strong>「長辺フリップ」</strong> または <strong>「短辺フリップ」</strong> をお選びください。
              <br />
              また裏面の向き（上下逆さま／正立）につきましては、下の
              <strong>印刷プレビュー</strong>の見本で必ずご確認のうえ、
              実際の印刷結果が見本と同じ向きになるよう、プリンタ側の「とじ方」設定も
              アプリの選択（長辺とじ／短辺とじ）と一致させてください。
            </div>
          </div>

          {/* Step2: 両面印刷を選んだ場合の詳細（とじ方） */}
          {duplexMode !== "single" && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-emerald-800 tracking-[0.2em] uppercase mb-1.5">
                とじ方（裏面の向き）
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {DUPLEX_OPTIONS.filter((o) => o.id !== "single").map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDuplexMode(opt.id)}
                    className={`text-left p-2 rounded-md border transition ${
                      duplexMode === opt.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-neutral-800 border-neutral-200 hover:border-emerald-400"
                    }`}
                  >
                    <div className="text-[11px] font-bold">{opt.short}</div>
                    <div
                      className={`text-[9px] leading-tight mt-0.5 ${
                        duplexMode === opt.id ? "text-emerald-50" : "text-neutral-500"
                      }`}
                    >
                      {opt.label.split("（")[0]}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-neutral-600 leading-relaxed">
                {DUPLEX_OPTIONS.find((o) => o.id === duplexMode)?.description}
              </div>
            </div>
          )}

          {/* A4ミニプレビュー */}
          <div className="bg-neutral-50 rounded-md p-3">
            <div className="text-[9px] font-semibold text-neutral-500 mb-2 text-center">
              印刷プレビュー（番号は同じ名刺の表裏ペア）
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <A4MiniPreview
                  columns={a4Layout.columns}
                  rows={a4Layout.rows}
                  side="front"
                  flipMode={duplexMode}
                  marginX={a4Layout.marginX}
                  marginY={a4Layout.marginY}
                  cardW={cardSize.widthMm}
                  cardH={cardSize.heightMm}
                  gap={gapMm}
                  cutStyle={cutMarkStyle}
                />
                <div className="text-[9px] font-bold text-blue-700">表面（1ページ目）</div>
              </div>
              {duplexMode !== "single" && (
                <>
                  <div className="text-neutral-400 text-lg">→</div>
                  <div className="flex flex-col items-center gap-1">
                    <A4MiniPreview
                      columns={a4Layout.columns}
                      rows={a4Layout.rows}
                      side="back"
                      flipMode={duplexMode}
                      marginX={a4Layout.marginX}
                      marginY={a4Layout.marginY}
                      cardW={cardSize.widthMm}
                      cardH={cardSize.heightMm}
                      gap={gapMm}
                      cutStyle={cutMarkStyle}
                    />
                    <div className="text-[9px] font-bold text-amber-700">裏面（2ページ目）</div>
                  </div>
                </>
              )}
            </div>
            {duplexMode !== "single" && (
              <div className="text-[9px] text-neutral-500 mt-2 text-center leading-relaxed">
                同じ番号が表裏でちゃんと一致するように配置されます
              </div>
            )}
          </div>
        </div>

        {/* 全ステップ未完了の警告 — 印刷/PDFアクションが無効化される説明 */}
        {!allStepsVisited && (
          <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3 mb-3">
            <div className="flex items-start gap-2">
              <span className="text-xl shrink-0 leading-none mt-0.5">🔒</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-red-900 leading-tight">
                  印刷・PDF出力には全ステップの完了が必要です
                </div>
                <div className="text-[11px] text-red-800/85 mt-0.5 leading-relaxed">
                  未訪問のステップが {missedSteps.length} 件あります。
                  下のジャンプボタンで戻り、全ステップを通った後に印刷ボタンが押せるようになります。
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {missedSteps.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onJumpTo(n)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 active:scale-95 transition shadow-sm"
                    >
                      Step {n} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleA4Print}
          disabled={!!busy || !allStepsVisited}
          className="group w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-400 text-white shadow-md transition mb-2"
          title={
            !allStepsVisited
              ? "未訪問のステップがあるため印刷できません"
              : undefined
          }
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🖨
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">
                {busy === "a4-print" ? "PDFを生成中..." : "🚀 印刷ダイアログを開く（直接印刷）"}
              </div>
              <div className="text-[11px] text-emerald-100 mt-0.5">
                新しいタブでPDFを開きます。そのまま⌘P/Ctrl+Pで印刷へ進めます
              </div>
            </div>
          </div>
          <span className="text-white text-xl group-hover:translate-x-0.5 transition">→</span>
        </button>

        <button
          type="button"
          onClick={handleA4MultiUp}
          disabled={!!busy || !allStepsVisited}
          className="group w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white border-2 border-emerald-300 hover:border-emerald-500 hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:border-neutral-300 transition mb-2"
          title={
            !allStepsVisited
              ? "未訪問のステップがあるためPDF出力できません"
              : undefined
          }
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
              📄
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-neutral-900">
                {busy === "a4" ? "保存中..." : `PDFをファイルに保存（A4 ${a4Layout.cardsPerSheet}面付け）`}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                ダウンロードフォルダに保存。後から印刷したい時に
              </div>
            </div>
          </div>
          <DownloadIcon size="16" className="text-emerald-600" />
        </button>

        <button
          type="button"
          onClick={() => setShowPrintGuideModal(true)}
          className="group w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white border-2 border-amber-400 hover:border-amber-500 hover:shadow active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-base">
              📖
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-neutral-900">印刷の手順を見る（必読）</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                サイズずれ／向きずれを防ぐ、確実な印刷設定の手順
              </div>
            </div>
          </div>
          <span className="text-amber-700 group-hover:translate-x-1 transition">→</span>
        </button>

        <div className="mt-3 text-[10px] text-emerald-800 leading-relaxed bg-emerald-100/60 rounded-md p-2 border border-emerald-200">
          ⚠️ <strong>必ず守ってほしい3つの設定</strong>
          <ul className="mt-1 space-y-0.5 list-disc list-inside ml-1">
            <li><strong>用紙サイズ：A4</strong>（自動選択でない場合は手動でA4に）</li>
            <li><strong>拡大縮小：実寸 100%</strong>（「ページに合わせる」ではNG）</li>
            <li><strong>両面印刷：長辺とじ</strong>（短辺とじを選んだ場合は当アプリで「短辺フリップ」を選んでください）</li>
          </ul>
        </div>
      </div>

      <PrintingGuide />

      <BulkGenerateModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        data={data}
        templateId={templateId}
        backStyleId={backStyleId}
      />

      {/* Hidden export-only renders (off-screen, used as input to PDF export).
        * Two variants are kept so each PDF mode uses dimensionally-correct
        * source images (no scaling = no front/back misalignment):
        *  - bleed=true  (97×61mm)  → print-shop PDF
        *  - bleed=false (91×55mm)  → A4 home-print multi-up
        * Browser direct print is disabled at the @media print level. */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <CardRenderer ref={exportFrontRef} data={data} templateId={templateId} bleed={true} hideBleedGuide={true} />
        <CardBack ref={exportBackRef} data={data} templateId={templateId} backStyleId={backStyleId} bleed={true} hideBleedGuide={true} />
        <CardRenderer ref={a4FrontRef} data={data} templateId={templateId} bleed={false} />
        <CardBack ref={a4BackRef} data={data} templateId={templateId} backStyleId={backStyleId} bleed={false} />
      </div>

      {showPrintGuideModal && (
        <PrintGuideModal
          cardsPerSheet={a4Layout.cardsPerSheet}
          columns={a4Layout.columns}
          rows={a4Layout.rows}
          onClose={() => setShowPrintGuideModal(false)}
        />
      )}
    </StepShell>
  );
}

function PrintGuideModal({
  cardsPerSheet,
  columns,
  rows,
  onClose,
}: {
  cardsPerSheet: number;
  columns: number;
  rows: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h2 className="text-base font-bold">印刷の手順マニュアル（サイズずれ防止）</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xl"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div className="rounded-xl bg-red-50 border-2 border-red-300 p-4">
            <div className="font-bold text-red-900 mb-2">⚠️ よくある失敗</div>
            <ul className="text-[12px] text-red-900 space-y-1 list-disc list-inside">
              <li><strong>サイズが小さくなる</strong>：印刷ダイアログで「ページに合わせる」が選択されている → <strong>「実寸 100%」</strong>に変更</li>
              <li><strong>裏面が逆さまになる</strong>：両面印刷の「とじ方」設定がアプリの設定と合っていない → 当アプリの「表裏の向き」と一致させる</li>
              <li><strong>余白が大きい</strong>：プリンタが「フチあり」設定 → 「フチなし印刷」を選択（できない場合はそのまま、A4のミシン目用紙を推奨）</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-neutral-900 mb-2">手順 1: PDFをダウンロードして開く</div>
            <ol className="text-[12px] text-neutral-700 space-y-1 list-decimal list-inside ml-2">
              <li>「A4 {cardsPerSheet}面付けPDFを保存」ボタンを押す</li>
              <li>ダウンロードされたPDFを <strong>Adobe Acrobat Reader</strong>（Win/Mac）または <strong>プレビュー.app</strong>（Mac）で開く</li>
              <li>※ ブラウザ内で開いたPDFから直接印刷すると失敗しやすいので、専用アプリで開くのがおすすめ</li>
            </ol>
          </div>

          <div>
            <div className="font-bold text-neutral-900 mb-2">手順 2: 印刷ダイアログを開く</div>
            <div className="text-[12px] text-neutral-700">⌘P（Mac）または Ctrl+P（Win）</div>
          </div>

          <div>
            <div className="font-bold text-neutral-900 mb-2">手順 3: 必須の設定 ✓</div>
            <div className="rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full text-[12px]">
                <tbody>
                  <tr className="border-b border-neutral-200">
                    <td className="bg-neutral-50 px-3 py-2 font-semibold w-[40%]">用紙サイズ</td>
                    <td className="px-3 py-2"><strong>A4</strong>（210×297mm）</td>
                  </tr>
                  <tr className="border-b border-neutral-200">
                    <td className="bg-neutral-50 px-3 py-2 font-semibold">向き</td>
                    <td className="px-3 py-2"><strong>縦（ポートレート）</strong></td>
                  </tr>
                  <tr className="border-b border-neutral-200">
                    <td className="bg-neutral-50 px-3 py-2 font-semibold">拡大縮小</td>
                    <td className="px-3 py-2 bg-yellow-50">
                      <strong className="text-red-700">実寸 / 100% / 等倍</strong> 必須<br />
                      <span className="text-[10px] text-neutral-500">（「ページに合わせる」「縮小」を選ぶとサイズが狂います）</span>
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-200">
                    <td className="bg-neutral-50 px-3 py-2 font-semibold">両面印刷</td>
                    <td className="px-3 py-2">
                      自動両面なら <strong>長辺とじ</strong> がデフォルト。<br />
                      <span className="text-[10px]">手動で裏返すなら、紙の <strong>左右（長辺軸）</strong> をめくる</span>
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-200">
                    <td className="bg-neutral-50 px-3 py-2 font-semibold">カラー</td>
                    <td className="px-3 py-2">カラー</td>
                  </tr>
                  <tr>
                    <td className="bg-neutral-50 px-3 py-2 font-semibold">用紙の種類</td>
                    <td className="px-3 py-2">
                      <strong>普通紙</strong>（試し刷り）または<br />
                      <strong>マット紙 / インクジェット用名刺用紙</strong>（本番）
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="font-bold text-neutral-900 mb-2">手順 4: 試し刷り → 本番</div>
            <ol className="text-[12px] text-neutral-700 space-y-1 list-decimal list-inside ml-2">
              <li>まず <strong>普通紙でA4 1枚だけ</strong> 試し刷り（部数：1）</li>
              <li>印刷物を <strong>定規で測る</strong>（カードが91×55mmになっているか）</li>
              <li>サイズOKなら、本番用紙に必要な枚数だけ印刷</li>
            </ol>
            <div className="mt-2 text-[11px] text-neutral-600 bg-blue-50 border border-blue-200 rounded p-2">
              💡 試し刷りで <strong>カード1枚が91×55mm</strong> になっていれば全配置が正しく印刷されます。
              {cardsPerSheet}枚 / A4 1枚 = ちょうどA4のサイズに収まる設計です。
            </div>
          </div>

          <div>
            <div className="font-bold text-neutral-900 mb-2">手順 5: カット</div>
            <ul className="text-[12px] text-neutral-700 space-y-1 list-disc list-inside ml-2">
              <li><strong>無地A4の場合</strong>：印刷されたグリッド線（縦{columns + 1}本・横{rows + 1}本）に沿ってカッターで切る。<strong>カッターマット</strong>と<strong>金属定規</strong>推奨</li>
              <li><strong>名刺用紙の場合</strong>：ミシン目に沿って手で折って分離（カッター不要）</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-neutral-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm"
            >
              ✓ 閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
