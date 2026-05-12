import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function Geometric({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-white text-neutral-900 flex flex-col overflow-hidden">
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 121"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 60,0 0,40" fill="#6366f1" />
          <polygon points="60,0 110,0 60,30" fill="#a855f7" />
          <polygon points="0,40 0,121 50,121" fill="#0ea5e9" opacity="0.85" />
          <polygon points="200,121 140,121 200,80" fill="#ec4899" />
          <polygon points="200,80 200,40 160,40" fill="#f59e0b" />
        </svg>
      )}
      <div className="relative flex-1 flex flex-col justify-center p-[6mm] mt-[6mm] min-w-0">
        <div data-role="company" className="text-[8pt] tracking-[0.2em] text-[#6366f1] font-bold uppercase min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[17pt] font-bold leading-tight mt-[1mm] min-w-0">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[7.5pt] tracking-[0.12em] text-neutral-500 mt-[0.5mm] min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[8pt] mt-[1mm] text-neutral-700 min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative px-[6mm] pb-[5mm] text-[7pt] text-neutral-700 leading-relaxed space-y-[0.3mm] min-w-0">
        {d.phone && <div className="min-w-0">{d.phone}</div>}
        {d.email && <div className="min-w-0">{d.email}</div>}
        {d.website && <div className="min-w-0">{d.website}</div>}
        {d.addressLine && <div className="min-w-0">{d.addressLine}</div>}
      </div>
    </div>
  );
}
