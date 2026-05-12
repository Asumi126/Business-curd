import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function DualQRWithMemo({
  data,
  template,
  qrDataUrl,
  qrDataUrl2,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
  qrDataUrl2?: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  const cap1 = data.qrCaption || "vCard";
  const cap2 = data.qr2?.caption || "Web";
  // Right half always white for memo writing
  const memoBg = swatch.bgRight ?? "#ffffff";
  const memoFg = swatch.fgRight ?? "#1a1a1a";
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {/* LEFT: Two stacked QRs */}
      <div
        className="flex-1 flex flex-col justify-around items-center py-[3mm] px-[3mm]"
        style={{ borderRight: `1px solid ${swatch.accent}33` }}
      >
        <div className="flex flex-col items-center gap-[0.8mm]">
          <div
            className="w-[18mm] h-[18mm] rounded-[1mm] p-[0.8mm] flex items-center justify-center"
            style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}55` }}
          >
            {qrDataUrl && <img src={qrDataUrl} alt="QR1" className="w-full h-full" />}
          </div>
          <div className="text-[5.5pt] tracking-[0.25em] uppercase font-semibold" style={{ color: swatch.accent }}>
            {cap1}
          </div>
        </div>
        <div className="flex flex-col items-center gap-[0.8mm]">
          <div
            className="w-[18mm] h-[18mm] rounded-[1mm] p-[0.8mm] flex items-center justify-center"
            style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}55` }}
          >
            {qrDataUrl2 && <img src={qrDataUrl2} alt="QR2" className="w-full h-full" />}
          </div>
          <div className="text-[5.5pt] tracking-[0.25em] uppercase font-semibold" style={{ color: swatch.accent }}>
            {cap2}
          </div>
        </div>
      </div>

      {/* RIGHT: Memo (always white by default) */}
      <div
        className="flex-1 flex flex-col px-[5mm] py-[5mm] gap-[1.5mm]"
        style={{ backgroundColor: memoBg, color: memoFg }}
      >
        <div
          className="text-[6pt] tracking-[0.35em] uppercase font-semibold pb-[1mm]"
          style={{ color: swatch.accent, borderBottom: `1px solid ${memoFg}25` }}
        >
          MEMO
        </div>
        {data.memo ? (
          <div className="text-[7.5pt] leading-[1.7] flex-1" style={{ whiteSpace: "pre-line" }}>
            {data.memo}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-around py-[1mm]">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-px w-full" style={{ backgroundColor: `${memoFg}25` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
