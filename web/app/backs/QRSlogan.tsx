import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function QRSlogan({
  data,
  template,
  qrDataUrl,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  const slogan = data.tagline?.trim() || data.backMessage?.trim() || "";
  return (
    <div
      className="absolute inset-0 flex p-[5mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Hiragino Mincho ProN', Georgia, serif",
      }}
    >
      <div className="flex flex-col items-center justify-center gap-[1mm] shrink-0">
        <div
          className="w-[24mm] h-[24mm] rounded-[1mm] p-[1mm] flex items-center justify-center"
          style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}` }}
        >
          {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full" />}
        </div>
        {data.qrCaption && (
          <div className="text-[5.5pt] tracking-[0.25em] uppercase opacity-80 text-center max-w-[26mm] leading-tight" style={{ color: swatch.accent, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
            {data.qrCaption}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center pl-[5mm] min-w-0">
        {data.company && (
          <div data-role="company" className="text-[6pt] tracking-[0.4em] uppercase mb-[1mm]" style={{ color: swatch.accent, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
            {data.company}
          </div>
        )}
        <div data-role="tagline" className="text-[14pt] font-light leading-[1.25] tracking-[-0.005em] italic">
          {slogan || (
            <span className="opacity-30 text-[8pt] not-italic">
              スローガンを入力してください
            </span>
          )}
        </div>
        {data.nameJa && (
          <div data-role="name" className="text-[6pt] tracking-[0.3em] uppercase opacity-70 text-right mt-[2mm]" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
            — {data.nameJa}
          </div>
        )}
      </div>
    </div>
  );
}
