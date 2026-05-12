import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function Minimal({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-[7mm]"
      style={{ backgroundColor: swatch.bg, color: swatch.fg, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
    >
      <div data-role="company" className="text-[8pt] tracking-[0.5em] uppercase opacity-70" style={{ color: swatch.accent }}>
        {data.company}
      </div>
      <div className="my-[2mm] h-px w-[10mm]" style={{ backgroundColor: swatch.accent }} />
      {data.backText && (
        <div className="text-[7pt] tracking-[0.3em] uppercase opacity-60">
          {data.backText}
        </div>
      )}
    </div>
  );
}
