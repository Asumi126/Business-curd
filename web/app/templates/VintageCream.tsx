import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function VintageCream({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm] text-[#3f2e1d]"
      style={{
        backgroundColor: "#f4e8d0",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(120,80,40,0.04) 0 1px, transparent 1px 6px)",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      <div className="border-2 border-[#8b5a2b] absolute inset-[2mm] pointer-events-none" />
      <div className="relative flex-1 flex flex-col justify-between text-center items-center min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.3em] uppercase min-w-0">— {d.company} —</div>
        <div className="w-full min-w-0">
          <div data-role="name" className="text-[19pt] italic font-semibold leading-tight min-w-0">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[8pt] tracking-[0.2em] mt-[0.5mm] uppercase min-w-0">{d.nameEn}</div>
          <div data-role="title" className="mt-[1mm] flex items-center gap-[1mm] justify-center min-w-0 flex-wrap">
            <span className="h-px w-[5mm] bg-[#8b5a2b] shrink-0" />
            <span className="text-[7pt] italic min-w-0 max-w-full">{d.title}</span>
            <span className="h-px w-[5mm] bg-[#8b5a2b] shrink-0" />
          </div>
        </div>
        <div data-role="contact" className="text-[6.5pt] tracking-wider leading-relaxed flex flex-col gap-y-[0.3mm] w-full min-w-0">
          {d.phone && <div className="min-w-0">tel. {d.phone}</div>}
          {d.email && <div className="min-w-0">{d.email}</div>}
          {d.website && <div className="min-w-0">{d.website}</div>}
          {d.addressLine && <div className="min-w-0">{d.addressLine}</div>}
        </div>
      </div>
    </div>
  );
}
