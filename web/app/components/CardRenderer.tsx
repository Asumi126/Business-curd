"use client";

import { CSSProperties, forwardRef, useId } from "react";
import { CardData, getCardSize } from "../lib/types";
import { getTemplate } from "../templates";
import { CardFrame } from "./CardFrame";
import { FrontQROverlay } from "./FrontQROverlay";
import { Monogram } from "./Monogram";
import {
  fontStyle,
  generateFontOverrideCss,
  getPattern,
  resolvePalette,
} from "../lib/customization";
import { applyFineAdjust } from "../lib/fineAdjust";

type Props = {
  data: CardData;
  templateId: string;
  bleed?: boolean;
  className?: string;
  onClick?: () => void;
  hideBleedGuide?: boolean;
  showSafeZone?: boolean;
};

export const CardRenderer = forwardRef<HTMLDivElement, Props>(function CardRenderer(
  { data, templateId, bleed = false, className = "", onClick, hideBleedGuide, showSafeZone },
  ref,
) {
  const visibleData = applyFineAdjust(data);
  const template = getTemplate(templateId);
  const Component = template.Component;
  const swatch = resolvePalette(visibleData, template.swatch);
  const logoTone = template.logoTone ?? "dark";
  const showDefaultLogo = !template.hasOwnLogo && (visibleData.logoDataUrl || visibleData.customization.monogramStyle !== "none");

  const overlayBg = logoTone === "light" ? "#000000" : "#ffffff";
  const overlayFg = logoTone === "light" ? "#ffffff" : swatch.accent;

  const pattern = getPattern(visibleData.customization.patternId);
  const patternStyle = pattern.apply(swatch.fg + "1f");

  const fa = visibleData.customization.fineAdjust;

  const cssVars: CSSProperties = {
    ["--c-bg" as never]: swatch.bg,
    ["--c-fg" as never]: swatch.fg,
    ["--c-accent" as never]: swatch.accent,
    ["--c-muted" as never]: swatch.muted,
    ...fontStyle(visibleData.customization.fontGlobal),
  };

  // NOTE: Card-wide scale/offset is intentionally disabled because it moves
  // the background along with the text, which makes the card unusable when
  // a custom background image or a colored fill is set. Per-text-element
  // adjustment is a future enhancement; for now we keep transform off so
  // the printed result is exactly what's previewed.
  const innerTransform: string | undefined = undefined;

  const size = getCardSize(visibleData.customization.cardSize);
  const reactId = useId();
  const scopeId = `s${reactId.replace(/[:]/g, "")}`;
  const fontCss = generateFontOverrideCss(visibleData, `data-card-scope="${scopeId}"`);

  return (
    <div
      className={className}
      onClick={onClick}
      style={cssVars}
      data-contact-prefix={visibleData.customization.contactPrefix}
      data-card-scope={scopeId}
    >
      {fontCss && <style dangerouslySetInnerHTML={{ __html: fontCss }} />}
      <CardFrame
        ref={ref}
        bleed={bleed}
        widthMm={size.widthMm}
        heightMm={size.heightMm}
        // No rounded corners or shadow — preview must match the printed
        // result 1:1 (angle-cut cards have square corners and no drop shadow).
        className=""
      >
        {bleed && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: swatch.bg }}
          />
        )}
        <div
          className="absolute"
          style={{
            top: bleed ? "3mm" : 0,
            left: bleed ? "3mm" : 0,
            width: `${size.widthMm}mm`,
            height: `${size.heightMm}mm`,
            overflow: "hidden",
          }}
        >
          <div
            className="absolute inset-0"
            style={
              innerTransform
                ? { transform: innerTransform, transformOrigin: "center" }
                : undefined
            }
          >
            <Component data={visibleData} />
            {visibleData.customization.patternId !== "none" && (
              <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50" style={patternStyle} />
            )}
            {showDefaultLogo && (() => {
              // User-controlled logo placement. Default = top-right corner,
              // 13mm monogram. Offsets translate the position; sizeMm grows
              // or shrinks the logo block (rendering uses the same monogram).
              const lf = visibleData.customization.logoFrame ?? {};
              const sizeMm = lf.sizeMm ?? 13;
              const dx = lf.offsetXmm ?? 0;
              const dy = lf.offsetYmm ?? 0;
              return (
                <div
                  className="absolute z-10"
                  style={{
                    right: "3mm",
                    top: "3mm",
                    ["--mono-size" as never]: `${sizeMm}mm`,
                    transform:
                      dx !== 0 || dy !== 0
                        ? `translate(${dx}mm, ${dy}mm)`
                        : undefined,
                  }}
                >
                  <Monogram
                    data={visibleData}
                    size={`${sizeMm}mm`}
                    bgColor={overlayBg}
                    fgColor={overlayFg}
                  />
                </div>
              );
            })()}
            <FrontQROverlay data={visibleData} />
          </div>
        </div>
        {bleed && !hideBleedGuide && (
          <div
            className="absolute pointer-events-none border border-dashed border-red-400/60"
            style={{ inset: "3mm" }}
          />
        )}
        {showSafeZone && (
          <div
            className="absolute pointer-events-none border border-dashed border-emerald-500/60"
            style={{ inset: bleed ? "6mm" : "3mm" }}
          />
        )}
      </CardFrame>
    </div>
  );
});
