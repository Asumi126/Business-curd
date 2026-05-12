import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

export function MemoGrid({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
        backgroundImage: `radial-gradient(${swatch.fg}33 1px, transparent 1.5px)`,
        backgroundSize: "4mm 4mm",
        backgroundPosition: "2mm 6mm",
      }}
    >
      <div className="flex items-center justify-between text-[6.5pt] tracking-[0.3em] uppercase">
        <span data-role="name" style={{ color: swatch.accent }}>
          {[data.backText, data.nameJa].filter(Boolean).join(" — ")}
        </span>
        {(data.backText || data.nameJa) && <span className="opacity-60">/ /</span>}
      </div>
      {data.memo && (
        <div className="text-[8pt] mt-[3mm] leading-[2.0]">
          {data.memo}
        </div>
      )}
    </div>
  );
}
