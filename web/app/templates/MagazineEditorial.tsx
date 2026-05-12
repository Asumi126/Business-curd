import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function MagazineEditorial({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-white text-neutral-900 flex p-[6mm]" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="w-[3mm] shrink-0 bg-black mr-[5mm]" />
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="min-w-0">
          <div className="text-[6pt] tracking-[0.3em] uppercase min-w-0">— No.001 —</div>
          <div data-role="company" className="text-[8pt] tracking-[0.2em] uppercase mt-[1mm] font-bold min-w-0">
            {d.company}
          </div>
        </div>
        <div className="min-w-0">
          <div data-role="name" className="text-[20pt] font-bold leading-[0.9] tracking-tight min-w-0">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[7.5pt] tracking-[0.25em] uppercase mt-[1mm] text-neutral-500 min-w-0">
            {d.nameEn}
          </div>
          <div className="mt-[1mm] flex items-center gap-[2mm] min-w-0 flex-wrap">
            <span className="h-px w-[8mm] bg-black shrink-0" />
            <span data-role="title" className="text-[7pt] italic min-w-0">{d.title}</span>
          </div>
        </div>
        <div data-role="contact" className="text-[6.8pt] leading-relaxed space-y-[0.3mm] min-w-0">
          {d.phone && <div className="min-w-0">{d.phone}</div>}
          {d.email && <div className="min-w-0">{d.email}</div>}
          {d.website && <div className="min-w-0">{d.website}</div>}
          {d.addressLine && <div className="min-w-0">{d.addressLine}</div>}
        </div>
      </div>
    </div>
  );
}
