import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

/**
 * SplitDiagonal — refined diagonal-split layout.
 * Left: dark wedge with company + an accent color stripe (decorative only).
 * Right: clean white area with prominent name + contacts in a tidy grid.
 * The split is now ~30% so the name has clear breathing room and the
 * left area shows just the brand-level info, not crammed info.
 */
export function SplitDiagonal({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #0f172a)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {/* Dark wedge */}
      <div
        className="absolute inset-0"
        style={{
          background: "var(--c-fg, #0f172a)",
          clipPath: "polygon(0 0, 42% 0, 28% 100%, 0 100%)",
        }}
      />
      {/* Accent diagonal stripe along the wedge edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "var(--c-accent, #22d3ee)",
          clipPath: "polygon(42% 0, 43.5% 0, 29.5% 100%, 28% 100%)",
          opacity: 0.9,
        }}
      />

      <div className="relative flex-1 flex min-w-0">
        {/* LEFT: brand-level info. Vertically centered against the
            right-side name block (which itself is centered) so the two
            sit on the same optical baseline. A small upward bias
            (translateY -2mm) keeps it just above mathematical center —
            this feels more balanced for editorial layouts. */}
        <div
          className="w-[34%] flex flex-col justify-center items-start px-[5mm] min-w-0"
          style={{ color: "var(--c-bg, #ffffff)", transform: "translateY(-2mm)" }}
        >
          <div
            className="h-[1mm] w-[5mm] mb-[2mm]"
            style={{ backgroundColor: "var(--c-accent, #22d3ee)" }}
            aria-hidden
          />
          <div
            data-role="company"
            className="text-[6.5pt] tracking-[0.3em] uppercase font-bold leading-tight min-w-0 max-w-full"
          >
            {d.company}
          </div>
          {d.title && (
            <div
              data-role="title"
              className="text-[6pt] mt-[1.5mm] leading-snug min-w-0 max-w-full"
              style={{ color: "var(--c-accent, #22d3ee)", opacity: 0.95 }}
            >
              {d.title}
            </div>
          )}
        </div>

        {/* RIGHT: name + contact, clean and balanced */}
        <div className="flex-1 flex flex-col justify-center p-[6mm] pl-[8mm] min-w-0">
          <div data-role="name" className="text-[17pt] font-bold leading-[1.05] tracking-[-0.01em] min-w-0">
            {nameDisplay(d)}
          </div>
          {d.nameEn && (
            <div
              data-role="nameEn"
              className="text-[6.5pt] tracking-[0.18em] uppercase mt-[0.8mm] min-w-0"
              style={{ color: "var(--c-muted, #737373)" }}
            >
              {d.nameEn}
            </div>
          )}
          <div
            className="mt-[2.5mm] h-px w-[8mm] shrink-0"
            style={{ backgroundColor: "var(--c-accent, #22d3ee)" }}
          />
          <div
            data-role="contact"
            className="mt-[1.8mm] text-[6.5pt] leading-[1.55] grid gap-y-[0.25mm] min-w-0"
            style={{ color: "var(--c-muted, #525252)" }}
          >
            {d.phone && (
              <div data-role="phone" className="flex items-center gap-[1mm] min-w-0">
                <Icon kind="phone" size="2.1mm" className="shrink-0" />
                <span className="truncate">{d.phone}</span>
              </div>
            )}
            {d.email && (
              <div data-role="email" className="flex items-center gap-[1mm] min-w-0">
                <Icon kind="mail" size="2.1mm" className="shrink-0" />
                <span className="truncate">{d.email}</span>
              </div>
            )}
            {d.website && (
              <div data-role="website" className="flex items-center gap-[1mm] min-w-0">
                <Icon kind="web" size="2.1mm" className="shrink-0" />
                <span className="truncate">{d.website}</span>
              </div>
            )}
            {d.addressLine && (
              <div data-role="address" className="flex items-start gap-[1mm] min-w-0">
                <Icon kind="pin" size="2.1mm" className="shrink-0 mt-[0.3mm]" />
                <span>{d.addressLine}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
