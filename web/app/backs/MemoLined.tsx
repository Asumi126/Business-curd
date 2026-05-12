import { CardData, CardTemplate } from "../lib/types";
import { Monogram } from "../components/Monogram";
import { resolveBackPalette } from "../lib/customization";

export function MemoLined({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  const back = data.customization.fineAdjust.backHidden;
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm]"
      style={{ backgroundColor: swatch.bg, color: swatch.fg, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[2mm]">
          {!back.monogram && (
            <Monogram data={data} size="8mm" bgColor={swatch.accent} fgColor={swatch.bg} />
          )}
          <div>
            {data.backText && (
              <div className="text-[6.5pt] tracking-[0.3em] uppercase opacity-60">{data.backText}</div>
            )}
            {data.nameJa && (
              <div data-role="name" className="text-[8pt] font-semibold leading-tight">{data.nameJa}</div>
            )}
          </div>
        </div>
        {!back.ornaments && (
          <div className="text-[6pt] tracking-[0.25em] uppercase opacity-50">
            DATE / /
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center mt-[3mm] gap-[3.2mm]">
        {data.memo ? (
          <div className="text-[8pt] leading-[2.6]" style={{ borderTop: `1px solid ${swatch.fg}33` }}>
            {data.memo}
          </div>
        ) : null}
        {!data.memo &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-px w-full" style={{ backgroundColor: `${swatch.fg}33` }} />
          ))}
      </div>
    </div>
  );
}
