import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, snsList, nameDisplay } from "./utils";

export function MinimalWhite({ data }: { data: CardData }) {
  const d = fallback(data);
  const sns = snsList(d);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm]"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #171717)",
        fontFamily: "var(--c-body-font, 'Helvetica Neue', system-ui, sans-serif)",
      }}
    >
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div
          data-role="company"
          className="text-[7pt] tracking-[0.35em] uppercase mb-[2mm] min-w-0"
          style={{ color: "var(--c-muted, #a3a3a3)" }}
        >
          {d.company}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-[3mm] gap-y-[0.5mm] min-w-0">
          <div data-role="name" className="text-[22pt] font-light tracking-[-0.02em] leading-none min-w-0">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] uppercase min-w-0" style={{ color: "var(--c-muted, #a3a3a3)" }}>
            {d.nameEn}
          </div>
        </div>
        <div className="mt-[2.5mm] h-px w-[18mm]" style={{ backgroundColor: "var(--c-fg, #171717)" }} />
        <div data-role="title" className="text-[8pt] mt-[2mm] tracking-wide min-w-0" style={{ opacity: 0.85 }}>
          {d.title}
        </div>
      </div>
      <div data-role="contact" className="text-[7pt] leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
        {d.phone && <div data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</div>}
        {d.email && <div data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</div>}
        {d.website && <div data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</div>}
        {d.addressLine && <div data-role="address" className="flex items-start gap-[1mm] col-span-2 min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</div>}
        {sns.length > 0 && (
          <div className="col-span-2 flex flex-wrap gap-x-[2mm] gap-y-[0.3mm] mt-[0.5mm]">
            {sns.map((s) => (
              <span key={s.kind} className="flex items-center gap-[0.8mm]">
                <Icon kind={s.kind} size="2.4mm" />
                {s.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
