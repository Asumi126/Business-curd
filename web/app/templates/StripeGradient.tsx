import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function StripeGradient({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        background:
          "linear-gradient(135deg, var(--c-accent, #635bff) 0%, color-mix(in srgb, var(--c-accent, #635bff) 50%, var(--c-bg, #ffffff) 50%) 35%, color-mix(in srgb, var(--c-bg, #ffffff) 80%, var(--c-accent, #635bff) 20%) 65%, var(--c-bg, #ffffff) 100%)",
        color: "var(--c-fg, #0a2540)",
        fontFamily: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: "color-mix(in srgb, var(--c-bg, #ffffff) 35%, transparent)" }} />
      <div className="relative flex-1 flex flex-col justify-between p-[8mm] min-w-0">
        <div className="flex items-start justify-between gap-[3mm]">
          <div className="min-w-0 flex-1">
            <div data-role="company" className="text-[7pt] tracking-[0.25em] uppercase font-medium min-w-0" style={{ opacity: 0.7 }}>
              {d.company}
            </div>
            {d.tagline && (
              <div data-role="tagline" className="text-[6.5pt] mt-[0.5mm] italic" style={{ opacity: 0.55 }}>
                {d.tagline}
              </div>
            )}
          </div>
          <div className="shrink-0">
            <Monogram data={d} size="11mm" bgColor="var(--c-fg, #0a2540)" fgColor="var(--c-bg, #ffffff)" />
          </div>
        </div>
        <div className="min-w-0">
          <div data-role="name" className="text-[20pt] font-semibold tracking-[-0.025em] leading-[0.95]">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[7.5pt] tracking-[0.18em] mt-[0.8mm] uppercase min-w-0" style={{ opacity: 0.65 }}>
            {d.nameEn}
          </div>
          <div data-role="title" className="text-[8pt] mt-[1mm]" style={{ opacity: 0.85 }}>{d.title}</div>
        </div>
        <div data-role="contact" className="text-[7pt] leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.3mm] min-w-0" style={{ opacity: 0.85 }}>
          {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
          {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
          {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
          {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
        </div>
      </div>
    </div>
  );
}
