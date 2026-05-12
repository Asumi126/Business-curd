import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function PhotoEditorial({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        backgroundColor: "var(--c-bg, #fbfaf6)",
        color: "var(--c-fg, #0a0a0a)",
        fontFamily: "'Hiragino Mincho ProN', 'Times New Roman', Georgia, serif",
      }}
    >
      <div className="w-[40%] h-full overflow-hidden shrink-0 relative bg-neutral-300">
        {data.profilePhoto ? (
          <img src={data.profilePhoto} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[7pt] text-neutral-500"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #d4d4d4 0 6px, #e5e5e5 6px 12px)" }}
          >
            画像
          </div>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 h-[5mm]"
          style={{
            background: "linear-gradient(to top, var(--c-bg, #fbfaf6), transparent)",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-between p-[6mm] min-w-0">
        <div className="min-w-0">
          {!d.customization.fineAdjust.hideTemplateExtras && (
            <div
              className="text-[6pt] tracking-[0.5em] uppercase mb-[1mm]"
              style={{ color: "var(--c-accent, #0a0a0a)" }}
            >
              — VOL.01 —
            </div>
          )}
          {d.company && (
            <div data-role="company" className="text-[8pt] tracking-[0.3em] uppercase font-bold min-w-0">{d.company}</div>
          )}
        </div>

        <div className="min-w-0">
          {d.nameJa && <div data-role="name" className="text-[20pt] font-bold leading-[0.95] tracking-[-0.02em] min-w-0">{nameDisplay(d)}</div>}
          {d.nameEn && (
            <div
              data-role="nameEn"
              className="text-[7pt] tracking-[0.4em] uppercase mt-[0.5mm] min-w-0"
              style={{ color: "var(--c-muted, #737373)" }}
            >
              {d.nameEn}
            </div>
          )}
          <div data-role="title" className="mt-[1.5mm] flex items-center gap-[1.5mm] min-w-0">
            {!d.customization.fineAdjust.hideTemplateExtras && (
              <span className="h-px w-[6mm] shrink-0" style={{ backgroundColor: "var(--c-accent, #0a0a0a)" }} />
            )}
            <span className="text-[7pt] italic min-w-0">{d.title}</span>
          </div>
        </div>

        <div
          data-role="contact"
          className="text-[6.5pt] leading-[1.5] grid gap-y-[0.3mm] min-w-0"
          style={{ color: "var(--c-muted, #737373)", fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
        >
          {d.phone && (
            <div data-role="phone" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="phone" size="2.2mm" className="shrink-0" />
              {d.phone}
            </div>
          )}
          {d.email && (
            <div data-role="email" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="mail" size="2.2mm" className="shrink-0" />
              {d.email}
            </div>
          )}
          {d.website && (
            <div data-role="website" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="web" size="2.2mm" className="shrink-0" />
              {d.website}
            </div>
          )}
          {d.addressLine && (
            <div data-role="address" className="flex items-start gap-[1mm] min-w-0">
              <Icon kind="pin" size="2.2mm" className="mt-[0.3mm] shrink-0" />
              {d.addressLine}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
