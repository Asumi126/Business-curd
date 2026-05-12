import { CardData, CardTemplate } from "../lib/types";
import { Icon } from "../lib/icons";
import { snsList } from "../templates/utils";
import { resolveBackPalette } from "../lib/customization";

export function ContactList({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  const sns = snsList(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm] gap-[1.5mm]"
      style={{ backgroundColor: swatch.bg, color: swatch.fg, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
    >
      {(data.backText || data.nameJa) && (
        <div data-role="name" className="text-[7pt] tracking-[0.4em] uppercase pb-[1.5mm]" style={{ color: swatch.accent, borderBottom: `1px solid ${swatch.fg}30` }}>
          {[data.backText, data.nameJa].filter(Boolean).join(" — ")}
        </div>
      )}
      <div data-role="contact" className="grid gap-y-[1.2mm] text-[8pt] leading-tight">
        {data.phone && (
          <div className="flex items-center gap-[2mm]">
            <Icon kind="phone" size="3mm" style={{ color: swatch.accent }} />
            <span>{data.phone}</span>
          </div>
        )}
        {data.email && (
          <div className="flex items-center gap-[2mm]">
            <Icon kind="mail" size="3mm" style={{ color: swatch.accent }} />
            <span>{data.email}</span>
          </div>
        )}
        {data.website && (
          <div className="flex items-center gap-[2mm]">
            <Icon kind="web" size="3mm" style={{ color: swatch.accent }} />
            <span>{data.website}</span>
          </div>
        )}
        {data.address && (
          <div className="flex items-center gap-[2mm]">
            <Icon kind="pin" size="3mm" style={{ color: swatch.accent }} />
            <span>{data.address}</span>
          </div>
        )}
        {sns.length > 0 && (
          <div className="flex flex-wrap gap-x-[3mm] gap-y-[0.5mm] mt-[1mm]">
            {sns.map((s) => (
              <span key={s.kind} className="flex items-center gap-[1mm] text-[7.5pt]">
                <Icon kind={s.kind} size="2.5mm" style={{ color: swatch.accent }} />
                {s.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
