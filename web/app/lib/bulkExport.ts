"use client";

/**
 * 名刺の一括PDF出力ロジック — 旧 BulkBusinessCardMaker から切り出し、
 * 完成ページ (Step10) の一括生成モーダルから再利用できるよう汎用化。
 *
 * 提供する2つの出力モード:
 *  1. downloadBulkPrintShopPdf  — 印刷会社向け。1人1ページ・塗り足し付 (97×61mm)
 *  2. downloadBulkA4Pdf         — 自宅A4印刷。A4縦に2列×5段=10枚面付け
 *
 * 両関数とも、人ごとに `setCaptureTarget(p)` で React 側のキャプチャ対象を
 * 切り替え、レンダ完了を待ってから toPng → PDF に貼り込む。
 */

import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

export type BulkPerson = {
  id: string;
  name: string;
  nameEn?: string;
  /** ふりがな (姓) */
  lastNameKana?: string;
  /** ふりがな (名) */
  firstNameKana?: string;
  company?: string;
  title?: string;
  department?: string;
  phone?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  website?: string;
};

export const CARD_W_MM = 91;
export const CARD_H_MM = 55;
export const BLEED_MM = 3;
export const A4_W_MM = 210;
export const A4_H_MM = 297;
/** 1枚のA4に何枚のカードを面付けするか (2列×5段=10枚) */
export const A4_COLS = 2;
export const A4_ROWS = 5;
export const PER_A4 = A4_COLS * A4_ROWS;

export type BulkProgress = {
  current: number;
  total: number;
  phase: "front" | "back";
};

export type BulkExportOpts = {
  people: BulkPerson[];
  /** 各人ごとに先に呼ばれる: React 側で captureTarget を切り替える */
  setCaptureTarget: (p: BulkPerson) => void;
  /** 状態反映を待つ ms (デフォルト 50) */
  settleMs?: number;
  /** 表面のキャプチャ対象 DOM */
  frontNode: () => HTMLElement | null;
  /** 裏面のキャプチャ対象 DOM (両面印刷時のみ) */
  backNode?: () => HTMLElement | null;
  withBack?: boolean;
  onProgress?: (p: BulkProgress) => void;
  filenamePrefix?: string;
};

async function captureNode(node: HTMLElement): Promise<string> {
  return await toPng(node, { cacheBust: true, pixelRatio: 6 });
}

/** 印刷会社向け: 1人1ページ・97×61mm 塗り足し付 PDF */
export async function downloadBulkPrintShopPdf(opts: BulkExportOpts): Promise<void> {
  const {
    people, setCaptureTarget, settleMs = 50, frontNode, backNode,
    withBack = false, onProgress, filenamePrefix = "bulk-cards",
  } = opts;
  if (people.length === 0) throw new Error("名簿が空です");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [CARD_W_MM + BLEED_MM * 2, CARD_H_MM + BLEED_MM * 2],
    compress: true,
  });
  pdf.setProperties({
    title: `Bulk Business Cards - ${people.length} people`,
    creator: "My Card Maker",
  });

  const totalSides = withBack ? people.length * 2 : people.length;
  let done = 0;

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    setCaptureTarget(p);
    await new Promise((r) => setTimeout(r, settleMs));
    if (i > 0) {
      pdf.addPage([CARD_W_MM + BLEED_MM * 2, CARD_H_MM + BLEED_MM * 2], "landscape");
    }
    const fn = frontNode();
    if (fn) {
      const png = await captureNode(fn);
      pdf.addImage(png, "PNG", 0, 0, CARD_W_MM + BLEED_MM * 2, CARD_H_MM + BLEED_MM * 2, undefined, "FAST");
    }
    done++;
    onProgress?.({ current: done, total: totalSides, phase: "front" });

    if (withBack) {
      pdf.addPage([CARD_W_MM + BLEED_MM * 2, CARD_H_MM + BLEED_MM * 2], "landscape");
      const bn = backNode?.();
      if (bn) {
        const backPng = await captureNode(bn);
        pdf.addImage(backPng, "PNG", 0, 0, CARD_W_MM + BLEED_MM * 2, CARD_H_MM + BLEED_MM * 2, undefined, "FAST");
      }
      done++;
      onProgress?.({ current: done, total: totalSides, phase: "back" });
    }
  }

  pdf.save(`${filenamePrefix}-${people.length}名-印刷会社.pdf`);
}

/**
 * A4自宅印刷: 1名 = A4 1枚 (同じ人の名刺を10枚面付け)。
 * 50名 = 50ページのPDF。
 *
 * 1人のA4ページ (10枚同一カード):
 *   ┌───┬───┐
 *   │ A │ A │   row 0
 *   ├───┼───┤
 *   │ A │ A │   row 1
 *   ├───┼───┤
 *   │ A │ A │   row 2
 *   ├───┼───┤
 *   │ A │ A │   row 3
 *   ├───┼───┤
 *   │ A │ A │   row 4
 *   └───┴───┘
 *   = 1人分のA4 (Aさんの名刺10枚)
 *
 * 両面印刷時は表面ページ→裏面ページ の順に各人ごとに連続生成。
 *
 * 戻り値: 生成した jsPDF インスタンス (save / output 用)。
 * 通常は save するが、直接印刷時は output("dataurlnewwindow") で新タブで開く。
 */
export async function buildBulkA4Pdf(opts: BulkExportOpts): Promise<jsPDF> {
  const {
    people, setCaptureTarget, settleMs = 50, frontNode, backNode,
    withBack = false, onProgress,
  } = opts;
  if (people.length === 0) throw new Error("名簿が空です");

  const MARGIN_X = (A4_W_MM - A4_COLS * CARD_W_MM) / 2;
  const MARGIN_Y = (A4_H_MM - A4_ROWS * CARD_H_MM) / 2;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  pdf.setProperties({
    title: `Bulk Business Cards (A4) - ${people.length} people`,
    creator: "My Card Maker",
  });

  // 1人につき表面1ページ + (両面なら)裏面1ページ
  const totalSides = withBack ? people.length * 2 : people.length;
  let done = 0;
  let firstPage = true;

  const renderPersonPage = async (
    p: BulkPerson,
    sideMode: "front" | "back",
  ) => {
    setCaptureTarget(p);
    await new Promise((r) => setTimeout(r, settleMs));
    const node = sideMode === "back" ? backNode?.() : frontNode();
    if (!node) return;
    const png = await captureNode(node);
    if (!firstPage) pdf.addPage("a4", "portrait");
    firstPage = false;
    // PER_A4=10 (2×5) 同じ画像を並べる。裏面ページは列を左右反転して両面印刷一致。
    for (let slot = 0; slot < PER_A4; slot++) {
      const row = Math.floor(slot / A4_COLS);
      const col = slot % A4_COLS;
      const xCol = sideMode === "back" ? A4_COLS - 1 - col : col;
      const x = MARGIN_X + xCol * CARD_W_MM;
      const y = MARGIN_Y + row * CARD_H_MM;
      pdf.addImage(png, "PNG", x, y, CARD_W_MM, CARD_H_MM, undefined, "FAST");
      // 薄いトリムマーク (切り取り目安)
      pdf.setDrawColor(220);
      pdf.setLineWidth(0.1);
      pdf.line(x, y, x + CARD_W_MM, y);
      pdf.line(x, y + CARD_H_MM, x + CARD_W_MM, y + CARD_H_MM);
      pdf.line(x, y, x, y + CARD_H_MM);
      pdf.line(x + CARD_W_MM, y, x + CARD_W_MM, y + CARD_H_MM);
    }
    done++;
    onProgress?.({ current: done, total: totalSides, phase: sideMode });
  };

  // 各人ごとに表→裏の順で2ページ出力 (両面時)、片面時は表面1ページのみ
  for (const p of people) {
    await renderPersonPage(p, "front");
    if (withBack) {
      await renderPersonPage(p, "back");
    }
  }

  return pdf;
}

/** PDF をブラウザでダウンロード (従来動作) */
export async function downloadBulkA4Pdf(opts: BulkExportOpts): Promise<void> {
  const pdf = await buildBulkA4Pdf(opts);
  pdf.save(`${opts.filenamePrefix ?? "bulk-cards"}-${opts.people.length}名-A4面付け.pdf`);
}

/**
 * PDFを生成して新しいタブで開く (自宅プリンタ直接印刷用)。
 * 開いた直後に window.print() が走り、ブラウザの印刷ダイアログが表示される。
 */
export async function openBulkA4PdfForPrint(opts: BulkExportOpts): Promise<void> {
  const pdf = await buildBulkA4Pdf(opts);
  const blob = pdf.output("blob") as Blob;
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    // PDFビューア読み込み後に印刷ダイアログを呼び出す。
    // 一部のブラウザでは PDF コンテキストで print() が効かないので、
    // ユーザーに Cmd+P / Ctrl+P を促す案内も表示。
    setTimeout(() => {
      try { win.print(); } catch { /* PDFビューア依存 */ }
    }, 800);
  } else {
    alert("ポップアップがブロックされました。ブラウザの設定でこのサイトのポップアップを許可してください。");
  }
  // しばらくしてからURLを解放 (印刷ダイアログ表示中に破棄されないように)
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** プレビュー用: 1人目だけ生成して DataURL を返す (PDFを開かない) */
export async function previewFirstA4Page(
  opts: Omit<BulkExportOpts, "onProgress">,
): Promise<string> {
  if (opts.people.length === 0) throw new Error("名簿が空です");
  const previewOpts: BulkExportOpts = {
    ...opts,
    people: opts.people.slice(0, 1), // 1人目だけ
  };
  const pdf = await buildBulkA4Pdf(previewOpts);
  return pdf.output("datauristring");
}

/** 1人のBulkPersonから、ベースCardDataを差替してCardData(本物)を作るヘルパー。
 *  buildCardDataのテンプレ実装。各メーカー側で使う想定。 */
import { CardData } from "./types";

export function mergePersonIntoCardData(
  base: CardData,
  p: BulkPerson,
): CardData {
  // nameDisplay() は lastName/firstName が埋まっているとそちらを優先して描画する。
  // 一括差替時に base 側の分解名/ふりがなが残っていると CSV の nameJa が無視されるバグ
  // が出るため、CSV側で明示されていない場合は base の分解名フィールドを必ずクリアする。
  return {
    ...base,
    nameJa: p.name || base.nameJa,
    nameEn: p.nameEn ?? base.nameEn,
    // 分解名は CSV に列を持たせていないので、常にクリア (nameJa を一律使う)
    lastName: "",
    firstName: "",
    // ふりがな: CSV指定があればそれ、なければ完全クリア
    lastNameKana: p.lastNameKana ?? "",
    firstNameKana: p.firstNameKana ?? "",
    company: p.company ?? base.company,
    title: p.title ?? base.title,
    department: p.department ?? base.department,
    phone: p.phone ?? base.phone,
    email: p.email ?? base.email,
    address: p.address ?? base.address,
    postalCode: p.postalCode ?? base.postalCode,
    website: p.website ?? base.website,
  };
}

/** 写真テンプレ判定 — 写真前提のテンプレかどうか。
 *  全員に同じ写真が使われる旨を警告するために使う。 */
export function isPhotoTemplate(templateId: string): boolean {
  return /^photo-/.test(templateId) || /^vertical-photo/.test(templateId);
}

export const BULK_LIMIT = 50;
