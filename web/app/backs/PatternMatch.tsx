import { CardData, CardTemplate } from "../lib/types";
import { Monogram } from "../components/Monogram";
import { resolveBackPalette } from "../lib/customization";

export function PatternMatch({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  const back = data.customization.fineAdjust.backHidden;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-[7mm] overflow-hidden"
      style={{ backgroundColor: swatch.accent, color: swatch.bg, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
    >
      {!back.ornaments && (
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 200 121" preserveAspectRatio="none">
          {Array.from({ length: 14 }).map((_, i) =>
            Array.from({ length: 9 }).map((__, j) => (
              <circle
                key={`${i}-${j}`}
                cx={i * 15 + 8}
                cy={j * 15 + 8}
                r={(i + j) % 3 === 0 ? 3 : 1.5}
                fill={swatch.bg}
                opacity={(i + j) % 2 === 0 ? 0.6 : 0.3}
              />
            )),
          )}
        </svg>
      )}
      <div className="relative flex flex-col items-center">
        {!back.monogram && (
          <Monogram data={data} size="14mm" bgColor={swatch.bg} fgColor={swatch.accent} />
        )}
        {data.company && <div data-role="company" className="text-[7pt] tracking-[0.45em] uppercase mt-[2mm]">{data.company}</div>}
        {data.nameJa && <div data-role="name" className="text-[8pt] font-semibold tracking-[-0.01em] mt-[1mm]">{data.nameJa}</div>}
      </div>
    </div>
  );
}
