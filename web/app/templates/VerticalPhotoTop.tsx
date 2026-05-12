import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function VerticalPhotoTop({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #171717)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="h-[55%] w-full overflow-hidden bg-neutral-300 shrink-0">
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
      </div>
      <div className="flex-1 flex flex-col justify-center p-[5mm] min-w-0">
        {d.company && (
          <div data-role="company" className="text-[7pt] tracking-[0.35em] uppercase font-semibold min-w-0" style={{ color: "var(--c-accent, #171717)" }}>
            {d.company}
          </div>
        )}
        {d.nameJa && <div data-role="name" className="text-[16pt] font-bold leading-tight tracking-[-0.02em] mt-[0.5mm] min-w-0">{nameDisplay(d)}</div>}
        {d.nameEn && (
          <div data-role="nameEn" className="text-[6.5pt] tracking-[0.2em] uppercase mt-[0.3mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
            {d.nameEn}
          </div>
        )}
        {d.title && <div data-role="title" className="text-[7pt] mt-[1mm] min-w-0" style={{ opacity: 0.85 }}>{d.title}</div>}
        <div data-role="contact" className="mt-[2mm] text-[6pt] leading-[1.55] grid gap-y-[0.2mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
          {d.phone && <div data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.1mm" className="shrink-0" />{d.phone}</div>}
          {d.email && <div data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.1mm" className="shrink-0" />{d.email}</div>}
          {d.website && <div data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.1mm" className="shrink-0" />{d.website}</div>}
          {d.addressLine && <div data-role="address" className="flex items-center gap-[1mm] min-w-0"><Icon kind="pin" size="2.1mm" className="shrink-0" />{d.addressLine}</div>}
        </div>
      </div>
    </div>
  );
}
