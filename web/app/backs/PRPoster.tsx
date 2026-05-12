import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function PRPoster({
  data,
  template,
  qrDataUrl,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  const bc = data.backCard;
  const heading = bc.enabled && bc.heading ? bc.heading : data.company || "PR HEADLINE";
  const subheading = bc.enabled && bc.subheading ? bc.subheading : data.tagline;
  const url = bc.enabled && bc.url ? bc.url : data.website;
  // 「PR」ラベルと「詳しくはこちら」CTA はカスタマイズ可。空ならデフォルト値。
  const prLabel = (bc.enabled && bc.prLabel?.trim()) || "PR";
  const cta =
    (bc.enabled && bc.prCta?.trim()) ||
    data.qrCaption ||
    (bc.enabled ? "詳しくはこちら" : "WEB SITE");

  return (
    <div
      className="absolute inset-0 flex flex-col p-[5mm] overflow-hidden"
      style={{
        backgroundColor: swatch.fg,
        color: swatch.bg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div
        className="absolute -top-[10mm] -right-[10mm] w-[40mm] h-[40mm] rounded-full pointer-events-none"
        style={{ backgroundColor: swatch.accent, opacity: 0.25 }}
      />
      <div className="relative flex-1 flex flex-col justify-center">
        <div
          className="text-[7pt] tracking-[0.4em] uppercase font-semibold"
          style={{ color: swatch.accent }}
        >
          {prLabel}
        </div>
        <div data-role="company" className="text-[20pt] font-bold leading-[0.95] tracking-[-0.03em] mt-[1mm]">
          {heading}
        </div>
        {subheading && (
          <div data-role="tagline" className="text-[7.5pt] mt-[1mm] italic opacity-85">{subheading}</div>
        )}
      </div>

      <div className="relative flex items-center justify-between gap-[3mm] pt-[2mm]" style={{ borderTop: `1px solid ${swatch.bg}33` }}>
        <div className="flex-1 min-w-0">
          <div
            className="text-[6pt] tracking-[0.3em] uppercase font-semibold"
            style={{ color: swatch.accent }}
          >
            {cta}
          </div>
          {url && (
            <div className="text-[8pt] font-bold mt-[0.3mm] truncate">{url}</div>
          )}
        </div>
        {qrDataUrl && (
          <div
            className="w-[14mm] h-[14mm] rounded-[0.8mm] p-[0.5mm] flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#fff" }}
          >
            <img src={qrDataUrl} alt="QR" className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
}
