import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function QRMemoSplit({
  data,
  template,
  qrDataUrl,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  // Both halves use the same `bg`/`fg` by default — changing "文字" only
  // changes text, never the background. Right half defaults to white so
  // memos can be written, but the user can override via bgRight.
  const leftBg = swatch.bg;
  const leftFg = swatch.fg;
  const rightBg = swatch.bgRight ?? "#ffffff";
  const rightFg = swatch.fgRight ?? "#1a1a1a";
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        backgroundColor: leftBg,
        color: leftFg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {/* LEFT: QR side */}
      <div
        className="flex-1 flex flex-col justify-center items-center p-[5mm]"
        style={{
          backgroundColor: leftBg,
          color: leftFg,
          borderRight: `1px solid ${swatch.accent}33`,
        }}
      >
        <div
          className="w-[28mm] h-[28mm] rounded-[1mm] p-[1mm] flex items-center justify-center"
          style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}55` }}
        >
          {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full" />}
        </div>
        {/* 旧版は qrCaption と backText を別々に2行表示していたが、
            UI 統合後は両方に同じ値が入るため重複表示になる。
            ここでは片方だけを表示する(backText を優先、なければ qrCaption)。 */}
        {(() => {
          const caption = (data.backText || data.qrCaption || "").trim();
          if (!caption) return null;
          return (
            <div
              className="text-[6.5pt] tracking-[0.3em] uppercase font-semibold mt-[1.5mm]"
              style={{ color: swatch.accent }}
            >
              {caption}
            </div>
          );
        })()}
      </div>

      {/* RIGHT: Memo side (defaults to white so memos can be written) */}
      <div
        className="flex-1 flex flex-col px-[5mm] py-[5mm] gap-[1.5mm]"
        style={{ backgroundColor: rightBg, color: rightFg }}
      >
        <div
          className="text-[6pt] tracking-[0.35em] uppercase font-semibold pb-[1mm]"
          style={{ color: swatch.accent, borderBottom: `1px solid ${rightFg}25` }}
        >
          MEMO
        </div>
        {data.memo ? (
          <div
            className="text-[7.5pt] leading-[1.7] flex-1"
            style={{ whiteSpace: "pre-line" }}
          >
            {data.memo}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-around py-[1mm]">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-px w-full"
                style={{ backgroundColor: `${rightFg}25` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
