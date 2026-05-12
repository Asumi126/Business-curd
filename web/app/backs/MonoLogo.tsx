import { CardData, CardTemplate } from "../lib/types";
import { Monogram } from "../components/Monogram";
import { resolveBackPalette } from "../lib/customization";

export function MonoLogo({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-[7mm]"
      style={{ backgroundColor: swatch.fg, color: swatch.bg, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
    >
      <Monogram data={data} size="22mm" bgColor={swatch.bg} fgColor={swatch.fg} />
      <div data-role="company" className="text-[7pt] tracking-[0.55em] uppercase mt-[3mm] opacity-85">
        {data.company}
      </div>
      {data.tagline && (
        <div data-role="tagline" className="text-[6pt] tracking-[0.3em] uppercase mt-[1mm] opacity-60">
          {data.tagline}
        </div>
      )}
    </div>
  );
}
