import { CardData, PhotoLayout } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, ResolvedCardData, nameDisplay } from "./utils";

type LayoutNormal =
  | "none"
  | "bleed-left-half"
  | "bleed-right-half"
  | "bleed-left-third"
  | "bleed-right-third"
  | "bleed-top-half"
  | "bleed-top-third"
  | "circle-tr-sm"
  | "circle-tl-sm"
  | "circle-tr-md"
  | "circle-tl-md"
  | "circle-center"
  | "rect-tr-sm"
  | "rect-tl-sm"
  | "diagonal-left"
  | "diagonal-right";

function normalizeLayout(layout: PhotoLayout): LayoutNormal {
  switch (layout) {
    case "left":
      return "bleed-left-third";
    case "right":
      return "bleed-right-third";
    case "top-left":
      return "circle-tl-sm";
    case "top-right":
      return "circle-tr-sm";
    case "circle-large":
      return "circle-center";
    default:
      return layout as LayoutNormal;
  }
}

const FALLBACK_BG_STYLE: React.CSSProperties = {
  backgroundColor: "#e5e5e5",
  backgroundImage:
    "repeating-linear-gradient(45deg, #d4d4d4 0 6px, #e5e5e5 6px 12px)",
};

function ImageBox({
  src,
  className = "",
  style,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (src) {
    return (
      <div className={`overflow-hidden ${className}`} style={style}>
        <img src={src} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center text-[6.5pt] text-neutral-500 ${className}`}
      style={{ ...FALLBACK_BG_STYLE, ...style }}
    >
      画像
    </div>
  );
}

function InfoBlock({ d, compact }: { d: ResolvedCardData; compact?: boolean }) {
  return (
    <div className="flex flex-col min-w-0">
      {d.company && (
        <div
          data-role="company"
          className="text-[7pt] tracking-[0.3em] uppercase min-w-0"
          style={{ color: "var(--c-accent, #171717)" }}
        >
          {d.company}
        </div>
      )}
      {d.nameJa && (
        <div
          data-role="name"
          className={`font-bold leading-tight tracking-[-0.02em] min-w-0 ${compact ? "text-[14pt]" : "text-[16pt]"}`}
        >
          {nameDisplay(d)}
        </div>
      )}
      {d.nameEn && (
        <div
          data-role="nameEn"
          className="text-[7pt] tracking-[0.2em] uppercase mt-[0.3mm] min-w-0"
          style={{ color: "var(--c-muted, #737373)" }}
        >
          {d.nameEn}
        </div>
      )}
      {d.title && (
        <div data-role="title" className="text-[7.5pt] mt-[1mm] min-w-0" style={{ opacity: 0.85 }}>
          {d.title}
        </div>
      )}
      <div
        data-role="contact"
        className="mt-[1.5mm] text-[6.5pt] leading-[1.5] flex flex-col gap-[0.2mm] min-w-0"
        style={{ color: "var(--c-muted, #737373)" }}
      >
        {d.phone && (
          <div data-role="phone" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="phone" size="2.2mm" className="shrink-0" />
            {d.phone}
          </div>
        )}
        {d.email && (
          <div data-role="email" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="mail" size="2.2mm" className="shrink-0" />
            {d.email}
          </div>
        )}
        {d.website && (
          <div data-role="website" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="web" size="2.2mm" className="shrink-0" />
            {d.website}
          </div>
        )}
        {d.addressLine && (
          <div data-role="address" className="flex items-start gap-[1mm] min-w-0">
            <Icon kind="pin" size="2.2mm" className="mt-[0.3mm] shrink-0" />
            {d.addressLine}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoCard({ data }: { data: CardData }) {
  const d = fallback(data);
  const layout: LayoutNormal = normalizeLayout(data.photoPosition || "bleed-left-third");
  const src = data.profilePhoto;

  const baseFrame: React.CSSProperties = {
    backgroundColor: "var(--c-bg, #ffffff)",
    color: "var(--c-fg, #171717)",
    fontFamily: "'Helvetica Neue', system-ui, sans-serif",
  };

  // BLEED LAYOUTS (image takes side area edge-to-edge)
  if (
    layout === "bleed-left-half" ||
    layout === "bleed-right-half" ||
    layout === "bleed-left-third" ||
    layout === "bleed-right-third"
  ) {
    const onRight = layout.startsWith("bleed-right");
    const isHalf = layout.endsWith("half");
    const imageWidth = isHalf ? "50%" : "33%";
    return (
      <div className="absolute inset-0 flex" style={baseFrame}>
        <div
          className={`flex ${onRight ? "flex-row-reverse" : ""} w-full h-full`}
        >
          <ImageBox src={src} className="h-full shrink-0" style={{ width: imageWidth }} />
          <div className="flex-1 flex flex-col justify-center p-[5mm] min-w-0">
            <InfoBlock d={d} compact={isHalf} />
          </div>
        </div>
      </div>
    );
  }

  // BLEED TOP
  if (layout === "bleed-top-half" || layout === "bleed-top-third") {
    const isHalf = layout === "bleed-top-half";
    return (
      <div className="absolute inset-0 flex flex-col" style={baseFrame}>
        <ImageBox
          src={src}
          className="w-full shrink-0"
          style={{ height: isHalf ? "50%" : "35%" }}
        />
        <div className="flex-1 flex flex-col justify-center p-[5mm]">
          <InfoBlock d={d} compact={isHalf} />
        </div>
      </div>
    );
  }

  // Frame customization values shared by circle/rect insets
  const pf = d.customization.photoFrame ?? {};
  const sizeScale = pf.sizeScale ?? 1;
  const borderWidthMm = pf.borderWidthMm ?? 0.5;
  const borderColor = pf.borderColor ?? "var(--c-accent, #171717)";
  const bgEnabled = pf.bgEnabled ?? false;
  const bgColor = pf.bgColor ?? "#ffffff";
  const framePadMm = bgEnabled ? Math.max(0.5, borderWidthMm + 0.4) : 0;

  // CIRCLE TOP-CORNER
  if (
    layout === "circle-tr-sm" ||
    layout === "circle-tl-sm" ||
    layout === "circle-tr-md" ||
    layout === "circle-tl-md"
  ) {
    const onRight = layout.startsWith("circle-tr");
    const isMd = layout.endsWith("md");
    const baseMm = isMd ? 22 : 14;
    const sizeMm = baseMm * sizeScale;
    return (
      <div className="absolute inset-0 flex flex-col p-[6mm]" style={baseFrame}>
        <div
          className="absolute rounded-full overflow-hidden shrink-0"
          style={{
            width: `${sizeMm}mm`,
            height: `${sizeMm}mm`,
            top: "5mm",
            [onRight ? "right" : "left"]: "5mm",
            borderStyle: "solid",
            borderWidth: `${borderWidthMm}mm`,
            borderColor,
            backgroundColor: bgEnabled ? bgColor : undefined,
            padding: `${framePadMm}mm`,
            boxSizing: "content-box",
          }}
        >
          <div className="w-full h-full overflow-hidden rounded-full">
            <ImageBox src={src} className="w-full h-full" />
          </div>
        </div>
        <div className={`flex-1 flex flex-col justify-end ${onRight ? "items-start" : "items-end"} text-${onRight ? "left" : "right"}`}>
          <InfoBlock d={d} compact={false} />
        </div>
      </div>
    );
  }

  // RECT TOP-CORNER (small rounded square)
  if (layout === "rect-tr-sm" || layout === "rect-tl-sm") {
    const onRight = layout === "rect-tr-sm";
    const baseMm = 18;
    const sizeMm = baseMm * sizeScale;
    return (
      <div className="absolute inset-0 flex flex-col p-[6mm]" style={baseFrame}>
        <div
          className="absolute rounded-md overflow-hidden shrink-0"
          style={{
            width: `${sizeMm}mm`,
            height: `${sizeMm}mm`,
            top: "5mm",
            [onRight ? "right" : "left"]: "5mm",
            borderStyle: "solid",
            borderWidth: `${borderWidthMm}mm`,
            borderColor,
            backgroundColor: bgEnabled ? bgColor : undefined,
            padding: `${framePadMm}mm`,
            boxSizing: "content-box",
          }}
        >
          <div className="w-full h-full overflow-hidden rounded-md">
            <ImageBox src={src} className="w-full h-full" />
          </div>
        </div>
        <div className={`flex-1 flex flex-col justify-end ${onRight ? "items-start" : "items-end"} text-${onRight ? "left" : "right"}`}>
          <InfoBlock d={d} compact={false} />
        </div>
      </div>
    );
  }

  // CIRCLE CENTER
  if (layout === "circle-center") {
    const baseMm = 22;
    const sizeMm = baseMm * sizeScale;
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-[6mm] text-center" style={baseFrame}>
        <div
          className="rounded-full overflow-hidden shrink-0 mb-[2mm]"
          style={{
            width: `${sizeMm}mm`,
            height: `${sizeMm}mm`,
            borderStyle: "solid",
            borderWidth: `${borderWidthMm}mm`,
            borderColor,
            backgroundColor: bgEnabled ? bgColor : undefined,
            padding: `${framePadMm}mm`,
            boxSizing: "content-box",
          }}
        >
          <div className="w-full h-full overflow-hidden rounded-full">
            <ImageBox src={src} className="w-full h-full" />
          </div>
        </div>
        {d.company && (
          <div
            data-role="company"
            className="text-[6.5pt] tracking-[0.4em] uppercase mb-[0.5mm] min-w-0"
            style={{ color: "var(--c-accent, #171717)" }}
          >
            {d.company}
          </div>
        )}
        {d.nameJa && <div data-role="name" className="text-[16pt] font-bold leading-tight min-w-0">{nameDisplay(d)}</div>}
        {d.nameEn && (
          <div
            data-role="nameEn"
            className="text-[7pt] tracking-[0.2em] uppercase mt-[0.5mm] min-w-0"
            style={{ color: "var(--c-muted, #737373)" }}
          >
            {d.nameEn}
          </div>
        )}
        {d.title && (
          <div data-role="title" className="text-[7.5pt] mt-[0.5mm] min-w-0" style={{ opacity: 0.85 }}>
            {d.title}
          </div>
        )}
        <div
          data-role="contact"
          className="mt-[1.5mm] text-[6.5pt] leading-[1.5] text-center flex flex-wrap justify-center gap-x-[3mm] min-w-0"
          style={{ color: "var(--c-muted, #737373)" }}
        >
          {d.phone && (
            <span data-role="phone" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="phone" size="2.2mm" className="shrink-0" />
              {d.phone}
            </span>
          )}
          {d.email && (
            <span data-role="email" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="mail" size="2.2mm" className="shrink-0" />
              {d.email}
            </span>
          )}
        </div>
      </div>
    );
  }

  // DIAGONAL CUT
  if (layout === "diagonal-left" || layout === "diagonal-right") {
    const onRight = layout === "diagonal-right";
    const clipPath = onRight
      ? "polygon(40% 0, 100% 0, 100% 100%, 60% 100%)"
      : "polygon(0 0, 60% 0, 40% 100%, 0 100%)";
    return (
      <div className="absolute inset-0 flex" style={baseFrame}>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath }}
        >
          <ImageBox src={src} className="w-full h-full" />
        </div>
        <div
          className={`relative flex-1 flex flex-col justify-center p-[5mm] ${onRight ? "items-start text-left pr-[40%]" : "items-end text-right pl-[40%]"}`}
        >
          <InfoBlock d={d} compact={false} />
        </div>
      </div>
    );
  }

  // NONE (no image)
  return (
    <div className="absolute inset-0 flex flex-col p-[6mm]" style={baseFrame}>
      <InfoBlock d={d} compact={false} />
    </div>
  );
}
