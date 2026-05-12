import { CardData, CardTemplate } from "../lib/types";
import { Icon } from "../lib/icons";
import { resolveBackPalette } from "../lib/customization";

export function QRSplit({
  data,
  template,
  qrDataUrl,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  // Left and right halves use the same base palette by default. Use
  // backColors.bgRight to make the right half a different color (e.g. white
  // for memo writing). Both halves track the same `bg`/`fg` so changing
  // "文字" only affects text — never the background.
  const leftBg = swatch.bg;
  const leftFg = swatch.fg;
  const rightBg = swatch.bgRight ?? swatch.bg;
  const rightFg = swatch.fgRight ?? swatch.fg;
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        backgroundColor: leftBg,
        color: leftFg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
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
        {data.backText && (
          <div
            className="text-[6pt] tracking-[0.4em] uppercase mt-[1.5mm]"
            style={{ color: swatch.accent }}
          >
            {data.backText}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center px-[5mm] py-[5mm] gap-[1mm]" style={{ backgroundColor: rightBg, color: rightFg }}>
        <div data-role="company" className="text-[7pt] tracking-[0.3em] uppercase opacity-70" style={{ color: swatch.accent }}>
          {data.company}
        </div>
        <div data-role="name" className="text-[14pt] font-bold tracking-[-0.02em] leading-tight">{data.nameJa}</div>
        <div data-role="title" className="text-[7pt] opacity-80">{data.title}</div>
        <div data-role="contact" className="mt-[1.5mm] text-[6.5pt] leading-relaxed grid gap-y-[0.4mm]">
          {data.phone && <div className="flex items-center gap-[1mm]"><Icon kind="phone" size="2.3mm" />{data.phone}</div>}
          {data.email && <div className="flex items-center gap-[1mm]"><Icon kind="mail" size="2.3mm" />{data.email}</div>}
          {data.website && <div className="flex items-center gap-[1mm]"><Icon kind="web" size="2.3mm" />{data.website}</div>}
        </div>
        {data.backMessage && (
          <div className="text-[6.5pt] mt-[1mm] italic opacity-80">{data.backMessage}</div>
        )}
      </div>
    </div>
  );
}
