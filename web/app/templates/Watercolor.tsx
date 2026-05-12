import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Watercolor({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-[#fdfbf6] text-neutral-900 flex flex-col p-[7mm] overflow-hidden" style={{ fontFamily: "'Hiragino Mincho ProN', 'Helvetica Neue', system-ui, sans-serif" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <defs>
          <radialGradient id="water1" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#fda4af" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="water2" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.7" />
            <stop offset="65%" stopColor="#7dd3fc" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="water3" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#fcd34d" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="170" cy="20" rx="50" ry="35" fill="url(#water1)" />
        <ellipse cx="20" cy="100" rx="55" ry="32" fill="url(#water2)" />
        <ellipse cx="110" cy="60" rx="45" ry="38" fill="url(#water3)" />
      </svg>
      <div className="absolute right-[5mm] top-[5mm] z-10">
        <Monogram data={d} size="11mm" bgColor="#7c3aed" fgColor="#fff" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center mt-[6mm] pr-[14mm] min-w-0">
        <div data-role="company" className="text-[7.5pt] tracking-[0.22em] text-[#7c3aed] uppercase font-medium min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[20pt] font-medium tracking-[0.01em] leading-tight mt-[1mm] min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7.5pt] tracking-[0.16em] text-neutral-500 italic mt-[0.5mm] min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] mt-[1mm] text-neutral-700 min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] text-neutral-700 leading-relaxed flex flex-wrap gap-x-[3mm] gap-y-[0.4mm] min-w-0">
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="flex items-center gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
