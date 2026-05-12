import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Sumie({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex p-[7mm] text-neutral-900"
      style={{
        backgroundColor: "#f5f1e8",
        fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
      }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <path
          d="M5 40 Q 30 20 60 35 T 130 25 Q 145 20 150 18"
          fill="none"
          stroke="#1c1917"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.78"
        />
        <path
          d="M150 18 Q 165 15 180 25 Q 188 32 195 30"
          fill="none"
          stroke="#1c1917"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle cx="190" cy="85" r="6" fill="#9a1f2c" opacity="0.92" />
      </svg>
      <div className="absolute left-[5mm] top-[5mm] z-10">
        <Monogram data={d} size="10mm" bgColor="#1c1917" fgColor="#f5f1e8" forceStyle="stamp" />
      </div>
      <div className="relative flex-1 flex flex-col justify-end mt-[10mm] mb-[12mm] pr-[6mm] min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.35em] text-neutral-700 min-w-0">{d.company}</div>
        <div data-role="name" className="text-[22pt] tracking-[0.1em] leading-tight mt-[1mm] min-w-0">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.25em] text-neutral-500 mt-[0.5mm] min-w-0">{d.nameEn}</div>
        <div data-role="title" className="text-[7.5pt] tracking-wider text-neutral-700 mt-[1mm] min-w-0">— {d.title}</div>
      </div>
      <div data-role="contact" className="absolute bottom-[7mm] left-[7mm] right-[7mm] text-[6.5pt] tracking-wider leading-relaxed text-neutral-700 pt-[1mm] border-t border-neutral-300/60 grid grid-cols-2 gap-x-[3mm] gap-y-[0.2mm] min-w-0" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.3mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.3mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.3mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.3mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
