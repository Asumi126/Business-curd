import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function CreativeSplash({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-white flex">
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <>
          <div className="w-[28mm] flex flex-col">
            <div className="flex-1 bg-[#f97316]" />
            <div className="h-[14mm] bg-[#a855f7]" />
          </div>
          <div className="w-[8mm] flex flex-col">
            <div className="h-[18mm] bg-[#22d3ee]" />
            <div className="flex-1 bg-[#ec4899]" />
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col justify-center p-[5mm] min-w-0">
        <div data-role="company" className="text-[8pt] tracking-[0.22em] text-[#a855f7] font-bold uppercase min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[18pt] font-black leading-tight mt-[1mm] text-neutral-900 min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7.5pt] tracking-[0.15em] text-[#f97316] font-bold mt-[0.5mm] min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[8pt] text-neutral-700 mt-[1mm] font-semibold min-w-0">{d.title}</div>
        <div data-role="contact" className="mt-[2mm] text-[7pt] text-neutral-700 leading-relaxed space-y-[0.3mm] min-w-0">
          {d.phone && <div className="min-w-0">{d.phone}</div>}
          {d.email && <div className="min-w-0">{d.email}</div>}
          {d.website && <div className="min-w-0">{d.website}</div>}
          {d.addressLine && <div className="min-w-0">{d.addressLine}</div>}
        </div>
      </div>
    </div>
  );
}
