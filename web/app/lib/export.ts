"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const CARD_W_MM = 91;
const CARD_H_MM = 55;
const BLEED_MM = 3;
const FULL_W_MM = CARD_W_MM + BLEED_MM * 2;
const FULL_H_MM = CARD_H_MM + BLEED_MM * 2;

const HIGH_DPI_PIXEL_RATIO = 6;
const STANDARD_PIXEL_RATIO = 4;

export type ExportTarget = HTMLElement;

export type PdfQuality = "print" | "standard";

async function captureAsPng(node: ExportTarget, pixelRatio: number): Promise<string> {
  return toPng(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: undefined,
    style: {
      transform: "none",
      margin: "0",
    },
  });
}

export async function downloadPng(
  node: ExportTarget,
  filename = "card.png",
  quality: PdfQuality = "print",
): Promise<void> {
  const dataUrl = await captureAsPng(
    node,
    quality === "print" ? HIGH_DPI_PIXEL_RATIO : STANDARD_PIXEL_RATIO,
  );
  triggerDownload(dataUrl, filename);
}

export async function downloadPdf(
  frontNode: ExportTarget,
  options: {
    backNode?: ExportTarget | null;
    withBleed?: boolean;
    filename?: string;
    quality?: PdfQuality;
    /** Card trim size (mm). Defaults to standard 91×55. Front/back use the
     *  same exact values to ensure pixel-perfect alignment when printed. */
    cardWidthMm?: number;
    cardHeightMm?: number;
  } = {},
): Promise<void> {
  const {
    backNode,
    withBleed = true,
    filename = "card.pdf",
    quality = "print",
    cardWidthMm = CARD_W_MM,
    cardHeightMm = CARD_H_MM,
  } = options;
  // 表面と裏面で完全に同じページサイズを使用 — 印刷会社のトリム位置がズレないようにするため
  const trimW = cardWidthMm;
  const trimH = cardHeightMm;
  const pageW = withBleed ? trimW + BLEED_MM * 2 : trimW;
  const pageH = withBleed ? trimH + BLEED_MM * 2 : trimH;
  const pixelRatio = quality === "print" ? HIGH_DPI_PIXEL_RATIO : STANDARD_PIXEL_RATIO;

  // Orientation 自動判定 — 横長は landscape、縦長は portrait
  const orientation = pageW >= pageH ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: [pageW, pageH],
    compress: true,
  });

  pdf.setProperties({
    title: "Business Card",
    subject: `Print-ready business card ${trimW}x${trimH}mm${withBleed ? ` + ${BLEED_MM}mm bleed` : ""}`,
    creator: "My Card Maker",
    author: "My Card Maker",
  });

  // 表面と裏面で完全に同じピクセル比・ページサイズで出力 — ミリ単位で1px もズレないように
  const frontPng = await captureAsPng(frontNode, pixelRatio);
  pdf.addImage(frontPng, "PNG", 0, 0, pageW, pageH, undefined, "FAST");

  if (backNode) {
    pdf.addPage([pageW, pageH], orientation);
    const backPng = await captureAsPng(backNode, pixelRatio);
    pdf.addImage(backPng, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  }

  pdf.save(filename);
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function calculateDpi(pixelRatio: number, mmSize: number): number {
  const px = mmSize * 3.7795275591 * pixelRatio;
  const inches = mmSize / 25.4;
  return Math.round(px / inches);
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_PRINTABLE_MARGIN_MM = 5;

export type MultiUpLayout = {
  columns: number;
  rows: number;
  cardsPerSheet: number;
  marginX: number;
  marginY: number;
  cardWidthMm: number;
  cardHeightMm: number;
};

/**
 * Compute optimal A4 multi-up layout for given card size.
 * Maximizes cards-per-sheet while keeping a printable margin
 * that home printers can handle. `gapMm` adds a gutter between
 * adjacent cards (matches a typical "名刺用紙テンプレート" look).
 */
export function computeA4MultiUpLayout(
  cardWidthMm: number,
  cardHeightMm: number,
  gapMm: number = 0,
): MultiUpLayout & { gapMm: number } {
  const usableW = A4_WIDTH_MM - A4_PRINTABLE_MARGIN_MM * 2;
  const usableH = A4_HEIGHT_MM - A4_PRINTABLE_MARGIN_MM * 2;
  // n cards + (n-1) gaps must fit in usable space
  const columns = Math.max(
    1,
    Math.floor((usableW + gapMm) / (cardWidthMm + gapMm)),
  );
  const rows = Math.max(
    1,
    Math.floor((usableH + gapMm) / (cardHeightMm + gapMm)),
  );
  const totalW = columns * cardWidthMm + (columns - 1) * gapMm;
  const totalH = rows * cardHeightMm + (rows - 1) * gapMm;
  const marginX = (A4_WIDTH_MM - totalW) / 2;
  const marginY = (A4_HEIGHT_MM - totalH) / 2;
  return {
    columns,
    rows,
    cardsPerSheet: columns * rows,
    marginX,
    marginY,
    cardWidthMm,
    cardHeightMm,
    gapMm,
  };
}

/**
 * Multi-up PDF for home printers. Tiles the card across A4 with
 * the optimal grid for the chosen card size:
 *   - 91×55 (standard)        → 2×5 = 10 cards
 *   - 85×55 (compact)         → 2×5 = 10 cards
 *   - 89×51 (international)   → 2×5 = 10 cards
 *   - 55×91 (vertical-std)    → 3×3 =  9 cards
 *   - 50×91 (vertical-tall)   → 4×3 = 12 cards
 *
 * Adds corner crop marks just outside each card to make cutting easier.
 * No bleed (home printers and pre-perforated paper assume trim-edge layout).
 */
/**
 * Duplex (back-side) flip mode.
 *
 * IMPORTANT: For horizontal business cards arranged 2×5 on A4-portrait, the
 * "natural" way to flip the paper varies, and printing wrong → flipped/upside-down
 * back. To make this foolproof we always rotate the back image so that no matter
 * how the user re-feeds the paper, the back lands the right way up.
 *
 *  - "single"     : front only (no back page)
 *  - "long-edge"  : duplex with long-edge flip (paper hinged on the long side
 *                    = horizontal flip). Back layout is column-mirrored. Card
 *                    image stays upright.
 *  - "short-edge" : duplex with short-edge flip (paper hinged on the short side
 *                    = vertical flip). Back layout is row-mirrored AND each
 *                    card is rotated 180° so it appears right-side up after
 *                    flipping the paper top-to-bottom.
 *  - "no-flip"    : manual re-feed without flipping → back placed in the same
 *                    grid as front (no rotation, no mirror).
 */
export type DuplexMode = "single" | "long-edge" | "short-edge" | "no-flip";

/**
 * Rotate a PNG data URL by 180 degrees using an offscreen canvas.
 * Used for short-edge duplex so backs land right-side up after the user
 * flips the paper top-to-bottom.
 */
async function rotatePng180(pngDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas-2d not available"));
        return;
      }
      ctx.translate(img.width / 2, img.height / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = pngDataUrl;
  });
}

/**
 * Cut mark style.
 *  - "none"     : 何も描かない。市販の名刺用紙（マイクロミシン目入り）に印刷する場合
 *  - "corners"  : 角だけにトンボマーク。プロっぽい見た目で、印刷会社の感覚で切れる
 *  - "dashed"   : カードの輪郭を点線で描く。無地A4で「ハサミやカッターで切る」場合に親切
 *  - "solid"    : 連続実線でグリッド全体を描く。カッターで一気に切る人向け
 */
export type CutMarkStyle = "none" | "corners" | "dashed" | "solid" | "template-grid";

function drawCornerMarks(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const m = 1.5;
  pdf.line(x - m, y, x, y);
  pdf.line(x, y - m, x, y);
  pdf.line(x + w, y, x + w + m, y);
  pdf.line(x + w, y - m, x + w, y);
  pdf.line(x - m, y + h, x, y + h);
  pdf.line(x, y + h, x, y + h + m);
  pdf.line(x + w, y + h, x + w + m, y + h);
  pdf.line(x + w, y + h, x + w, y + h + m);
}

function drawDashedRect(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const dash = 1.4;
  const gap = 0.9;
  for (let cur = 0; cur < w; cur += dash + gap) {
    const seg = Math.min(dash, w - cur);
    pdf.line(x + cur, y, x + cur + seg, y);
    pdf.line(x + cur, y + h, x + cur + seg, y + h);
  }
  for (let cur = 0; cur < h; cur += dash + gap) {
    const seg = Math.min(dash, h - cur);
    pdf.line(x, y + cur, x, y + cur + seg);
    pdf.line(x + w, y + cur, x + w, y + cur + seg);
  }
}

function drawCutMarks(
  pdf: jsPDF,
  style: CutMarkStyle,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (style === "none" || style === "template-grid") return;
  if (style === "corners") {
    drawCornerMarks(pdf, x, y, w, h);
  } else if (style === "dashed") {
    drawDashedRect(pdf, x, y, w, h);
  } else if (style === "solid") {
    pdf.rect(x, y, w, h);
  }
}

/**
 * Draws a full A4 trim grid: card-boundary lines extended toward the page edges,
 * matching the look of typical "名刺印刷A4テンプレート" sheets.
 */
function drawTemplateGrid(
  pdf: jsPDF,
  marginX: number,
  marginY: number,
  cardW: number,
  cardH: number,
  cols: number,
  rows: number,
  gap: number,
): void {
  const lineExtend = 3;
  const totalW = cols * cardW + (cols - 1) * gap;
  const totalH = rows * cardH + (rows - 1) * gap;

  const xs: number[] = [];
  for (let c = 0; c <= cols; c++) {
    const baseX = marginX + c * cardW + Math.max(0, c - 1) * gap;
    if (c === 0 || c === cols || gap === 0) {
      xs.push(baseX);
    } else {
      xs.push(baseX);
      xs.push(baseX + gap);
    }
  }
  const ys: number[] = [];
  for (let r = 0; r <= rows; r++) {
    const baseY = marginY + r * cardH + Math.max(0, r - 1) * gap;
    if (r === 0 || r === rows || gap === 0) {
      ys.push(baseY);
    } else {
      ys.push(baseY);
      ys.push(baseY + gap);
    }
  }

  const yTop = marginY - lineExtend;
  const yBot = marginY + totalH + lineExtend;
  const xLeft = marginX - lineExtend;
  const xRight = marginX + totalW + lineExtend;

  for (const x of xs) pdf.line(x, yTop, x, yBot);
  for (const y of ys) pdf.line(xLeft, y, xRight, y);
}

export async function downloadA4MultiUpPdf(
  frontNode: ExportTarget,
  options: {
    quality?: PdfQuality;
    filename?: string;
    cardWidthMm?: number;
    cardHeightMm?: number;
    cutMarkStyle?: CutMarkStyle;
    backNode?: ExportTarget | null;
    duplexMode?: DuplexMode;
    gapMm?: number;
    /** 印刷塗り足し (mm)。家庭用プリンタの両面印刷ハードウェア精度(±1-3mm)を
     *  吸収するため、各カードに塗り足しを追加し、ユーザは内側のトリムラインで
     *  切り抜く。デフォルト 2mm。0 にすると従来通り塗り足しなし。 */
    bleedMm?: number;
    /** 表/裏アライメント確認用のレジストレーションマーク(コーナー十字)を
     *  ページ4隅に印字。両面印刷時に紙を透かして確認できる。デフォルト true。 */
    registrationMarks?: boolean;
  } = {},
): Promise<MultiUpLayout & { gapMm: number }> {
  const {
    quality = "print",
    filename = "mycard-a4.pdf",
    cardWidthMm = CARD_W_MM,
    cardHeightMm = CARD_H_MM,
    cutMarkStyle = "corners",
    backNode = null,
    duplexMode = "single",
    gapMm = 0,
    bleedMm = 3, // CardFrame BLEED_MM と一致 → bleed=true キャプチャをそのまま配置可能
    registrationMarks = true,
  } = options;
  const pixelRatio = quality === "print" ? HIGH_DPI_PIXEL_RATIO : STANDARD_PIXEL_RATIO;

  // 塗り足し込みのカード外寸 (例: 91+2*2 = 95mm, 55+2*2 = 59mm)
  const bleedW = cardWidthMm + bleedMm * 2;
  const bleedH = cardHeightMm + bleedMm * 2;
  // レイアウトは塗り足し込みサイズで計算 (gridに収まる枚数が減る場合あり)
  const layout = computeA4MultiUpLayout(bleedW, bleedH, gapMm);
  const frontPng = await captureAsPng(frontNode, pixelRatio);
  const includeBack = duplexMode !== "single" && !!backNode;
  let backPng = includeBack ? await captureAsPng(backNode!, pixelRatio) : null;
  // Short-edge flip: rotate the back image 180° so it shows up right-side up
  // after the user flips the paper top-to-bottom.
  if (backPng && duplexMode === "short-edge") {
    backPng = await rotatePng180(backPng);
  }

  // Lock A4 dimensions explicitly. Some viewers interpret format: "a4"
  // inconsistently — passing [width, height] in mm guarantees 210×297mm
  // (NOT B4 / Letter / etc.) regardless of viewer.
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [210, 297],
    compress: true,
    putOnlyUsedFonts: true,
  });

  pdf.setProperties({
    title: `My Card - A4 ${layout.cardsPerSheet}-up Print Sheet`,
    subject: `A4 (210x297mm) - ${layout.cardsPerSheet} cards per sheet, print at 100% scale`,
    creator: "My Card Maker",
    author: "My Card Maker",
    keywords: "business card, A4, 210x297, print-ready",
  });

  // 配置時のヘルパー: 各カードはレイアウト上 bleedW×bleedH の枠を占有する。
  // 画像(frontPng/backPng)は塗り足し込みのコンテンツが含まれている前提で、
  // bleed枠いっぱいに引き伸ばして配置する。トンボ(切り取り線)は内側の
  // 91×55mm(=cardWidthMm×cardHeightMm)のトリムラインに描画。
  const drawCardAt = (
    imgPng: string,
    bleedX: number,
    bleedY: number,
  ) => {
    pdf.addImage(imgPng, "PNG", bleedX, bleedY, bleedW, bleedH, undefined, "FAST");
    // トリムマーク = 内側のカット位置(塗り足し2mm内側)
    const trimX = bleedX + bleedMm;
    const trimY = bleedY + bleedMm;
    drawCutMarks(pdf, cutMarkStyle, trimX, trimY, cardWidthMm, cardHeightMm);
  };

  // A4 4隅のレジストレーションマーク(位置合わせ十字)を描画。
  // 両面印刷時に紙を透かして見ると、表/裏の十字が重なれば完全アライメント。
  const drawRegistrationMarks = () => {
    if (!registrationMarks) return;
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.2);
    const insetMm = 8; // A4端から内側 8mm の位置
    const crossR = 2.5; // 十字の腕の長さ
    const corners: [number, number][] = [
      [insetMm, insetMm],
      [A4_WIDTH_MM - insetMm, insetMm],
      [insetMm, A4_HEIGHT_MM - insetMm],
      [A4_WIDTH_MM - insetMm, A4_HEIGHT_MM - insetMm],
    ];
    for (const [cx, cy] of corners) {
      pdf.line(cx - crossR, cy, cx + crossR, cy);
      pdf.line(cx, cy - crossR, cx, cy + crossR);
      // 小さな円(センターポイント目印)
      pdf.circle(cx, cy, 0.6);
    }
  };

  // Page 1: Front
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.1);
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.columns; col++) {
      const x = layout.marginX + col * (bleedW + gapMm);
      const y = layout.marginY + row * (bleedH + gapMm);
      drawCardAt(frontPng, x, y);
    }
  }
  if (cutMarkStyle === "template-grid") {
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.15);
    drawTemplateGrid(
      pdf,
      layout.marginX + bleedMm,
      layout.marginY + bleedMm,
      cardWidthMm,
      cardHeightMm,
      layout.columns,
      layout.rows,
      bleedMm * 2 + gapMm,
    );
  }
  drawRegistrationMarks();

  // Page 2: Back, with grid mirrored according to duplex flip mode
  if (backPng) {
    pdf.addPage([210, 297], "portrait");
    pdf.setDrawColor(180);
    pdf.setLineWidth(0.1);
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        let placeCol = col;
        let placeRow = row;
        if (duplexMode === "long-edge") {
          placeCol = layout.columns - 1 - col;
        } else if (duplexMode === "short-edge") {
          placeRow = layout.rows - 1 - row;
        }
        const x = layout.marginX + placeCol * (bleedW + gapMm);
        const y = layout.marginY + placeRow * (bleedH + gapMm);
        drawCardAt(backPng, x, y);
      }
    }
    if (cutMarkStyle === "template-grid") {
      pdf.setDrawColor(150);
      pdf.setLineWidth(0.15);
      drawTemplateGrid(
        pdf,
        layout.marginX + bleedMm,
        layout.marginY + bleedMm,
        cardWidthMm,
        cardHeightMm,
        layout.columns,
        layout.rows,
        bleedMm * 2 + gapMm,
      );
    }
    drawRegistrationMarks();
  }

  pdf.save(filename);
  return layout;
}

/**
 * Build the A4 multi-up PDF in-memory and open it in a new tab so the user
 * can immediately hit ⌘P / Ctrl+P. We do NOT auto-trigger window.print()
 * because PDF viewers (Chrome, Safari, Firefox) all delay rendering, and
 * forcing print before render shows a blank dialog.
 *
 * Returns the layout description plus the URL so callers can revoke later
 * if they want.
 */
export async function openA4MultiUpPdfForPrint(
  frontNode: ExportTarget,
  options: {
    quality?: PdfQuality;
    cardWidthMm?: number;
    cardHeightMm?: number;
    cutMarkStyle?: CutMarkStyle;
    backNode?: ExportTarget | null;
    duplexMode?: DuplexMode;
    gapMm?: number;
    bleedMm?: number;
    registrationMarks?: boolean;
  } = {},
): Promise<{ layout: MultiUpLayout & { gapMm: number }; url: string }> {
  const {
    quality = "print",
    cardWidthMm = CARD_W_MM,
    cardHeightMm = CARD_H_MM,
    cutMarkStyle = "corners",
    backNode = null,
    duplexMode = "single",
    gapMm = 0,
    bleedMm = 3,
    registrationMarks = true,
  } = options;
  const pixelRatio = quality === "print" ? HIGH_DPI_PIXEL_RATIO : STANDARD_PIXEL_RATIO;

  const bleedW = cardWidthMm + bleedMm * 2;
  const bleedH = cardHeightMm + bleedMm * 2;
  const layout = computeA4MultiUpLayout(bleedW, bleedH, gapMm);
  const frontPng = await captureAsPng(frontNode, pixelRatio);
  const includeBack = duplexMode !== "single" && !!backNode;
  let backPng = includeBack ? await captureAsPng(backNode!, pixelRatio) : null;
  if (backPng && duplexMode === "short-edge") {
    backPng = await rotatePng180(backPng);
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [210, 297],
    compress: true,
    putOnlyUsedFonts: true,
  });

  pdf.setProperties({
    title: `My Card - A4 ${layout.cardsPerSheet}-up Print Sheet`,
    subject: `A4 (210x297mm) - ${layout.cardsPerSheet} cards per sheet, print at 100% scale`,
    creator: "My Card Maker",
    author: "My Card Maker",
    keywords: "business card, A4, 210x297, print-ready",
  });

  const drawCardAt = (imgPng: string, bx: number, by: number) => {
    pdf.addImage(imgPng, "PNG", bx, by, bleedW, bleedH, undefined, "FAST");
    drawCutMarks(pdf, cutMarkStyle, bx + bleedMm, by + bleedMm, cardWidthMm, cardHeightMm);
  };

  const drawRegistrationMarks = () => {
    if (!registrationMarks) return;
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.2);
    const insetMm = 8;
    const crossR = 2.5;
    const corners: [number, number][] = [
      [insetMm, insetMm],
      [A4_WIDTH_MM - insetMm, insetMm],
      [insetMm, A4_HEIGHT_MM - insetMm],
      [A4_WIDTH_MM - insetMm, A4_HEIGHT_MM - insetMm],
    ];
    for (const [cx, cy] of corners) {
      pdf.line(cx - crossR, cy, cx + crossR, cy);
      pdf.line(cx, cy - crossR, cx, cy + crossR);
      pdf.circle(cx, cy, 0.6);
    }
  };

  // Page 1: Front
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.1);
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.columns; col++) {
      const x = layout.marginX + col * (bleedW + gapMm);
      const y = layout.marginY + row * (bleedH + gapMm);
      drawCardAt(frontPng, x, y);
    }
  }
  if (cutMarkStyle === "template-grid") {
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.15);
    drawTemplateGrid(
      pdf,
      layout.marginX + bleedMm,
      layout.marginY + bleedMm,
      cardWidthMm,
      cardHeightMm,
      layout.columns,
      layout.rows,
      bleedMm * 2 + gapMm,
    );
  }
  drawRegistrationMarks();
  // Page 2: Back, mirrored according to duplex flip
  if (backPng) {
    pdf.addPage([210, 297], "portrait");
    pdf.setDrawColor(180);
    pdf.setLineWidth(0.1);
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        let placeCol = col;
        let placeRow = row;
        if (duplexMode === "long-edge") placeCol = layout.columns - 1 - col;
        else if (duplexMode === "short-edge") placeRow = layout.rows - 1 - row;
        const x = layout.marginX + placeCol * (bleedW + gapMm);
        const y = layout.marginY + placeRow * (bleedH + gapMm);
        drawCardAt(backPng, x, y);
      }
    }
    if (cutMarkStyle === "template-grid") {
      pdf.setDrawColor(150);
      pdf.setLineWidth(0.15);
      drawTemplateGrid(
        pdf,
        layout.marginX + bleedMm,
        layout.marginY + bleedMm,
        cardWidthMm,
        cardHeightMm,
        layout.columns,
        layout.rows,
        bleedMm * 2 + gapMm,
      );
    }
    drawRegistrationMarks();
  }

  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // Popup blocked → fall back to download
    const a = document.createElement("a");
    a.href = url;
    a.download = "mycard-a4-print.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  return { layout, url };
}

export const cardDimensions = {
  widthMm: CARD_W_MM,
  heightMm: CARD_H_MM,
  bleedMm: BLEED_MM,
  fullWidthMm: FULL_W_MM,
  fullHeightMm: FULL_H_MM,
  aspect: CARD_W_MM / CARD_H_MM,
  highDpiPixelRatio: HIGH_DPI_PIXEL_RATIO,
  standardPixelRatio: STANDARD_PIXEL_RATIO,
  effectiveDpi: calculateDpi(HIGH_DPI_PIXEL_RATIO, CARD_W_MM),
};
