import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

/**
 * BigQR — 裏面中央に大きな QR コードを配置し、その下に見出し・氏名・メッセージを
 * 縦に並べる構成。旧版は QR が 36mm と大きすぎ、下のテキストが収まらず文字が
 * カードからはみ出るケースがあったため:
 *   - QR を 28mm へ縮小して余白を確保
 *   - 重複していた qrCaption / backText を統合表示（backText を優先）
 *   - 各テキストにサイズ・max-width・line-clamp を指定し、レイアウトが
 *     カード内に必ず収まるよう改善
 */
export function BigQR({
  data,
  template,
  qrDataUrl,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  // 旧 qrCaption と backText の UI が統合されたので、表示も片方に揃える。
  // 既存データで両方入っている場合は backText を優先。
  const caption = (data.backText || data.qrCaption || "").trim();
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5mm] py-[4mm] gap-[1mm] text-center"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {/* QR — 28mm 角に縮小。中央配置でカードに収まる前提。 */}
      <div
        className="w-[28mm] h-[28mm] rounded-[1.2mm] p-[1mm] flex items-center justify-center shrink-0"
        style={{
          backgroundColor: "#fff",
          border: data.customization.fineAdjust.backHidden.ornaments
            ? "none"
            : `1px solid ${swatch.accent}`,
        }}
      >
        {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-full h-full" /> : null}
      </div>

      {/* 見出し（QRの直下） — トラッキング控えめ、最大1行 */}
      {caption && (
        <div
          className="text-[7pt] font-semibold tracking-[0.18em] uppercase max-w-[78mm] truncate"
          style={{ color: swatch.accent }}
        >
          {caption}
        </div>
      )}

      {/* 氏名 — 強調表示 */}
      {data.nameJa && (
        <div
          data-role="name"
          className="text-[8.5pt] font-bold tracking-[-0.01em] max-w-[80mm] truncate"
        >
          {data.nameJa}
        </div>
      )}

      {/* 一言メッセージ — 最大2行で省略 */}
      {data.backMessage && (
        <div
          className="text-[6.5pt] leading-[1.35] opacity-75 max-w-[80mm] line-clamp-2"
        >
          {data.backMessage}
        </div>
      )}
    </div>
  );
}
