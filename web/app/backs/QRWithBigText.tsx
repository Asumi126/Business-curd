import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function QRWithBigText({
  data,
  template,
  qrDataUrl,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-[5mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="text-center mb-[2mm]">
        {data.qrCaption ? (
          <div className="text-[16pt] font-bold leading-tight tracking-[-0.02em]">{data.qrCaption}</div>
        ) : data.backText ? (
          <div className="text-[14pt] font-bold leading-tight tracking-[-0.02em]">{data.backText}</div>
        ) : (
          <div className="text-[14pt] font-bold leading-tight tracking-[-0.02em]" style={{ color: swatch.accent }}>
            SCAN ME
          </div>
        )}
        {data.backMessage && (
          <div className="text-[7pt] mt-[0.5mm] opacity-75">{data.backMessage}</div>
        )}
      </div>
      <div
        className="w-[26mm] h-[26mm] rounded-[1mm] p-[1mm] flex items-center justify-center"
        style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}` }}
      >
        {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full" />}
      </div>
      {data.nameJa && (
        <div data-role="name" className="text-[7pt] mt-[2mm] tracking-[0.2em] uppercase opacity-70">
          {data.nameJa}
        </div>
      )}
    </div>
  );
}
