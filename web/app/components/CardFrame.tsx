"use client";

import { forwardRef, ReactNode } from "react";

type CardFrameProps = {
  children: ReactNode;
  bleed?: boolean;
  className?: string;
  display?: boolean;
  scale?: number;
  widthMm?: number;
  heightMm?: number;
};

export const CARD_WIDTH_MM = 91;
export const CARD_HEIGHT_MM = 55;
export const BLEED_MM = 3;

export const CardFrame = forwardRef<HTMLDivElement, CardFrameProps>(function CardFrame(
  { children, bleed = false, className = "", display = true, scale = 1, widthMm = CARD_WIDTH_MM, heightMm = CARD_HEIGHT_MM },
  ref,
) {
  const w = bleed ? widthMm + BLEED_MM * 2 : widthMm;
  const h = bleed ? heightMm + BLEED_MM * 2 : heightMm;

  return (
    <div
      ref={ref}
      className={`card-frame relative overflow-hidden ${className}`}
      style={{
        width: `${w}mm`,
        height: `${h}mm`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        backgroundColor: "#ffffff",
        display: display ? "block" : "none",
      }}
    >
      {children}
    </div>
  );
});
