import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function DualQRSideBySide({
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
  const cap2 = data.qr2?.caption || "URL";
  return (
    <div
      className="absolute inset-0 flex items-center justify-around p-[5mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="flex flex-col items-center gap-[1.5mm]">
        <div
          className="w-[26mm] h-[26mm] rounded-[1mm] p-[1mm] flex items-center justify-center"
          style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}55` }}
        >
          {qrDataUrl && <img src={qrDataUrl} alt="QR1" className="w-full h-full" />}
        </div>
        <div
          className="text-[6.5pt] tracking-[0.3em] uppercase font-semibold"
          style={{ color: swatch.accent }}
        >
          {cap1}
        </div>
      </div>
      <div className="h-[40mm] w-px" style={{ backgroundColor: `${swatch.fg}30` }} />
      <div className="flex flex-col items-center gap-[1.5mm]">
        <div
          className="w-[26mm] h-[26mm] rounded-[1mm] p-[1mm] flex items-center justify-center"
          style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}55` }}
        >
          {qrDataUrl2 && <img src={qrDataUrl2} alt="QR2" className="w-full h-full" />}
        </div>
        <div
          className="text-[6.5pt] tracking-[0.3em] uppercase font-semibold"
          style={{ color: swatch.accent }}
        >
          {cap2}
        </div>
      </div>
    </div>
  );
}
