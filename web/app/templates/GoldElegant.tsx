import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function GoldElegant({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1f1410 100%)",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <div
          className="absolute inset-[3mm] border pointer-events-none"
          style={{ borderColor: "rgba(212,175,55,0.5)" }}
        />
      )}
      <div className="relative flex-1 flex flex-col justify-center items-center text-center min-w-0">
        <div
          data-role="company"
          className="text-[7pt] tracking-[0.3em] uppercase min-w-0 max-w-full"
          style={{ color: "#d4af37" }}
        >
          {d.company}
        </div>
        {!d.customization.fineAdjust.hideTemplateExtras && (
          <div className="my-[1.5mm] flex items-center gap-[1mm]">
            <span className="h-px w-[5mm]" style={{ backgroundColor: "#d4af37" }} />
            <span style={{ color: "#d4af37" }}>◆</span>
            <span className="h-px w-[5mm]" style={{ backgroundColor: "#d4af37" }} />
          </div>
        )}
        <div data-role="name" className="text-[19pt] font-semibold leading-tight text-white min-w-0 max-w-full">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[8pt] tracking-[0.25em] uppercase mt-[0.5mm] min-w-0 max-w-full" style={{ color: "#e0c068" }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7pt] italic text-neutral-400 mt-[1mm] min-w-0 max-w-full">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[6.5pt] tracking-wider leading-relaxed text-center space-y-[0.3mm] text-neutral-300 min-w-0">
        {d.phone && <div className="min-w-0">{d.phone}</div>}
        {d.email && <div className="min-w-0">{d.email}</div>}
        {d.website && <div className="min-w-0">{d.website}</div>}
        {d.addressLine && <div className="min-w-0">{d.addressLine}</div>}
      </div>
    </div>
  );
}
