import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function PhotoHero({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #0a0a0a)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="h-[55%] w-full overflow-hidden shrink-0 bg-neutral-300 relative">
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
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "30%",
            background:
              "linear-gradient(to top, color-mix(in srgb, var(--c-bg, #ffffff) 95%, transparent), transparent)",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center px-[6mm] py-[3mm]">
        <div className="flex items-baseline justify-between gap-[3mm]">
          <div className="min-w-0">
            {d.company && (
              <div
                data-role="company"
                className="text-[7pt] tracking-[0.35em] uppercase font-semibold"
                style={{ color: "var(--c-accent, #0a0a0a)" }}
              >
                {d.company}
              </div>
            )}
            {d.nameJa && <div data-role="name" className="text-[15pt] font-bold leading-tight tracking-[-0.02em] mt-[0.3mm]">{nameDisplay(d)}</div>}
          </div>
          {d.title && (
            <div
              data-role="title"
              className="text-[7pt] italic shrink-0 text-right"
              style={{ color: "var(--c-muted, #737373)" }}
            >
              {d.title}
            </div>
          )}
        </div>

        <div
          data-role="contact"
          className="mt-[1.5mm] text-[6.5pt] leading-[1.5] flex flex-wrap gap-x-[3mm] gap-y-[0.3mm]"
          style={{ color: "var(--c-muted, #737373)" }}
        >
          {d.phone && (
            <span data-role="phone" className="flex items-center gap-[1mm]">
              <Icon kind="phone" size="2.2mm" />
              {d.phone}
            </span>
          )}
          {d.email && (
            <span data-role="email" className="flex items-center gap-[1mm]">
              <Icon kind="mail" size="2.2mm" />
              {d.email}
            </span>
          )}
          {d.website && (
            <span data-role="website" className="flex items-center gap-[1mm]">
              <Icon kind="web" size="2.2mm" />
              {d.website}
            </span>
          )}
          {d.addressLine && (
            <span data-role="address" className="flex items-center gap-[1mm]">
              <Icon kind="pin" size="2.2mm" />
              {d.addressLine}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
