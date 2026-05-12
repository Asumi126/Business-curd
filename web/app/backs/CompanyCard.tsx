import { CardData, CardTemplate } from "../lib/types";
import { Icon } from "../lib/icons";
import { resolveBackPalette } from "../lib/customization";

export function CompanyCard({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  const bc = data.backCard;
  const heading = bc.enabled && bc.heading ? bc.heading : data.company;
  const subheading = bc.enabled && bc.subheading ? bc.subheading : data.tagline;
  const description = bc.enabled ? bc.description : "";
  const url = bc.enabled && bc.url ? bc.url : data.website;
  const phone = bc.enabled && bc.contactPhone ? bc.contactPhone : data.phone;
  const email = bc.enabled && bc.contactEmail ? bc.contactEmail : data.email;

  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="flex-1 flex flex-col">
        <div className="text-[6.5pt] tracking-[0.4em] uppercase font-semibold mb-[1mm]" style={{ color: swatch.accent }}>
          COMPANY
        </div>
        {heading && (
          <div data-role="company" className="text-[14pt] font-bold leading-tight tracking-[-0.02em]">{heading}</div>
        )}
        {subheading && (
          <div data-role="tagline" className="text-[7pt] mt-[0.5mm] italic" style={{ color: swatch.muted }}>
            {subheading}
          </div>
        )}
        <div className="mt-[1.5mm] h-px w-[10mm]" style={{ backgroundColor: swatch.accent }} />
        {description && (
          <p data-role="description" className="text-[6.8pt] leading-[1.55] mt-[2mm] opacity-90" style={{ whiteSpace: "pre-line" }}>
            {description}
          </p>
        )}
      </div>
      <div data-role="contact" className="text-[6.5pt] leading-[1.5] flex flex-col gap-y-[0.3mm] pt-[2mm]" style={{ color: swatch.muted, borderTop: `1px solid ${swatch.fg}22` }}>
        {phone && (
          <div className="flex items-center gap-[1mm]">
            <Icon kind="phone" size="2.2mm" style={{ color: swatch.accent }} />
            {phone}
          </div>
        )}
        {email && (
          <div className="flex items-center gap-[1mm]">
            <Icon kind="mail" size="2.2mm" style={{ color: swatch.accent }} />
            {email}
          </div>
        )}
        {url && (
          <div className="flex items-center gap-[1mm]">
            <Icon kind="web" size="2.2mm" style={{ color: swatch.accent }} />
            {url}
          </div>
        )}
      </div>
    </div>
  );
}
