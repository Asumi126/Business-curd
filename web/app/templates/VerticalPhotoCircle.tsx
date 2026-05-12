import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function VerticalPhotoCircle({ data }: { data: CardData }) {
  const d = fallback(data);
  // Vertical 55×91mm card: photo + name + title + contacts must all fit.
  // Compact layout with smaller photo (24mm) and tighter spacing.
  const pf = d.customization.photoFrame ?? {};
  const sizeScale = pf.sizeScale ?? 1;
  const photoMm = 24 * sizeScale;
  const borderMm = pf.borderWidthMm ?? 0.8;
  const borderColor = pf.borderColor ?? "var(--c-accent, #171717)";
  return (
    <div
      className="absolute inset-0 flex flex-col items-center px-[4mm] py-[4mm]"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #171717)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {d.company && (
        <div
          data-role="company"
          className="text-[5.5pt] tracking-[0.35em] uppercase font-semibold text-center min-w-0 max-w-full truncate"
          style={{ color: "var(--c-accent, #171717)" }}
        >
          {d.company}
        </div>
      )}
      <div
        className="mt-[1.5mm] rounded-full overflow-hidden shrink-0"
        style={{
          width: `${photoMm}mm`,
          height: `${photoMm}mm`,
          borderStyle: "solid",
          borderWidth: `${borderMm}mm`,
          borderColor,
          boxShadow: "0 0.5mm 1mm rgba(0,0,0,0.1)",
        }}
      >
        {data.profilePhoto ? (
          <img src={data.profilePhoto} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[5.5pt] text-neutral-500"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #d4d4d4 0 6px, #e5e5e5 6px 12px)" }}
          >
            画像
          </div>
        )}
      </div>

      <div className="mt-[2mm] text-center w-full min-w-0">
        {d.nameJa && (
          <div data-role="name" className="text-[13pt] font-bold leading-tight min-w-0">
            {nameDisplay(d)}
          </div>
        )}
        {d.nameEn && (
          <div
            data-role="nameEn"
            className="text-[6pt] tracking-[0.18em] uppercase mt-[0.3mm] min-w-0"
            style={{ color: "var(--c-muted, #737373)" }}
          >
            {d.nameEn}
          </div>
        )}
        {d.title && (
          <div data-role="title" className="text-[6.5pt] mt-[0.5mm] min-w-0" style={{ opacity: 0.85 }}>
            {d.title}
          </div>
        )}
      </div>

      <div className="my-[1.5mm] h-px w-[10mm] shrink-0" style={{ backgroundColor: "var(--c-accent, #171717)" }} />

      <div
        data-role="contact"
        className="text-[5.8pt] leading-[1.4] text-center flex flex-col gap-y-[0.3mm] w-full min-w-0 flex-1"
        style={{ color: "var(--c-muted, #737373)" }}
      >
        {d.phone && (
          <div data-role="phone" className="flex items-center gap-[1mm] justify-center min-w-0">
            <Icon kind="phone" size="1.9mm" className="shrink-0" />
            <span className="truncate">{d.phone}</span>
          </div>
        )}
        {d.email && (
          <div data-role="email" className="flex items-center gap-[1mm] justify-center min-w-0">
            <Icon kind="mail" size="1.9mm" className="shrink-0" />
            <span className="truncate">{d.email}</span>
          </div>
        )}
        {d.website && (
          <div data-role="website" className="flex items-center gap-[1mm] justify-center min-w-0">
            <Icon kind="web" size="1.9mm" className="shrink-0" />
            <span className="truncate">{d.website}</span>
          </div>
        )}
        {d.addressLine && (
          <div data-role="address" className="flex items-start gap-[1mm] justify-center min-w-0 px-[1mm]">
            <Icon kind="pin" size="1.9mm" className="shrink-0 mt-[0.2mm]" />
            <span className="text-left">{d.addressLine}</span>
          </div>
        )}
      </div>
    </div>
  );
}
