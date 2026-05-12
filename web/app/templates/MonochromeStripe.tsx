import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function MonochromeStripe({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-white text-neutral-900 flex flex-col">
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <div
          className="h-[5mm] w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, #000 0 4mm, #fff 4mm 8mm)",
          }}
        />
      )}
      <div className="flex-1 flex flex-col justify-between p-[6mm] min-w-0">
        <div>
          <div data-role="company" className="text-[10pt] font-mono tracking-[0.2em] uppercase">{d.company}</div>
          {d.department && <div className="text-[7pt] text-neutral-500 mt-[0.5mm] font-mono">{d.department}</div>}
        </div>
        <div className="min-w-0">
          <div data-role="name" className="text-[19pt] font-light leading-tight">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[8pt] tracking-[0.3em] text-neutral-500 font-mono mt-[0.5mm] uppercase">
            {d.nameEn}
          </div>
          <div data-role="title" className="text-[8pt] font-mono mt-[1mm] text-neutral-700">{d.title}</div>
        </div>
        <div data-role="contact" className="text-[6.8pt] font-mono text-neutral-700 leading-relaxed grid grid-cols-[auto_1fr] gap-x-[3mm] gap-y-[0.3mm] min-w-0">
          {d.phone && <div className="col-span-2 min-w-0">{d.phone}</div>}
          {d.email && <div className="col-span-2 min-w-0">{d.email}</div>}
          {d.website && <div className="col-span-2 min-w-0">{d.website}</div>}
          {d.addressLine && <div className="col-span-2 min-w-0">{d.addressLine}</div>}
        </div>
      </div>
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <div
          className="h-[2mm] w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, #000 0 4mm, #fff 4mm 8mm)",
          }}
        />
      )}
    </div>
  );
}
