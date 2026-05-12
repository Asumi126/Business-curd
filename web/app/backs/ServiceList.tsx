import { CardData, CardTemplate } from "../lib/types";
import { Icon } from "../lib/icons";
import { resolveBackPalette } from "../lib/customization";

export function ServiceList({
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
  const heading = bc.enabled && bc.heading ? bc.heading : data.company;
  const services = bc.enabled && bc.services.length > 0 ? bc.services : [];
  const url = bc.enabled && bc.url ? bc.url : data.website;

  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="flex items-baseline justify-between gap-[2mm] mb-[2mm]">
        <div className="min-w-0">
          <div className="text-[6pt] tracking-[0.4em] uppercase" style={{ color: swatch.accent }}>SERVICES</div>
          {heading && <div data-role="company" className="text-[10pt] font-bold leading-tight mt-[0.3mm]">{heading}</div>}
        </div>
        {qrDataUrl && bc.enabled && bc.url && (
          <div className="w-[14mm] h-[14mm] rounded-[0.8mm] p-[0.5mm] flex items-center justify-center shrink-0" style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}` }}>
            <img src={qrDataUrl} alt="QR" className="w-full h-full" />
          </div>
        )}
      </div>

      <ul data-role="description" className="flex-1 grid gap-y-[0.5mm] text-[7pt] leading-[1.5]">
        {services.length > 0 ? (
          services.slice(0, 6).map((s: string, i: number) => (
            <li key={i} className="flex items-start gap-[1.5mm]">
              <span className="shrink-0 w-[2mm] h-[2mm] rounded-full mt-[1mm]" style={{ backgroundColor: swatch.accent }} />
              <span>{s}</span>
            </li>
          ))
        ) : (
          <li className="text-[6.5pt] opacity-40 italic">
            裏面のサービス一覧を入力してください
          </li>
        )}
      </ul>

      {url && (
        <div
          data-role="contact"
          className="text-[6.5pt] tracking-[0.1em] pt-[2mm] flex items-center gap-[1mm]"
          style={{ borderTop: `1px solid ${swatch.fg}22`, color: swatch.muted }}
        >
          <Icon kind="web" size="2.2mm" style={{ color: swatch.accent }} />
          {url}
        </div>
      )}
    </div>
  );
}
