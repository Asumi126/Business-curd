"use client";

import { CSSProperties, forwardRef, useEffect, useId, useMemo, useState } from "react";
import { CardData, getCardSize } from "../lib/types";
import { CardFrame } from "./CardFrame";
import { buildQRPayload, buildSecondQRPayload, generateQRDataUrl } from "../lib/qr";
import { getTemplate } from "../templates";
import { getBackStyle } from "../backs";
import {
  fontStyle,
  generateFontOverrideCss,
  getPattern,
  getTemplateDefaultFont,
  resolveBackPalette,
} from "../lib/customization";
import { applyBackVisibility } from "../lib/backVisibility";

type Props = {
  data: CardData;
  templateId: string;
  backStyleId: string;
  bleed?: boolean;
  className?: string;
  hideBleedGuide?: boolean;
  showSafeZone?: boolean;
};

export const CardBack = forwardRef<HTMLDivElement, Props>(function CardBack(
  { data, templateId, backStyleId, bleed = false, className = "", hideBleedGuide, showSafeZone },
  ref,
) {
  const visibleBackData = applyBackVisibility(data);
  const template = getTemplate(templateId);
  const backStyle = getBackStyle(backStyleId);
  const swatch = resolveBackPalette(visibleBackData, template.swatch);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrDataUrl2, setQrDataUrl2] = useState<string>("");

  // Use useMemo on the *whole* data object so adding new contact fields
  // (or any future fields) automatically refreshes the QR. Previously we
  // listed deps explicitly and missed fields, causing stale QRs.
  const qrPayload = useMemo(() => buildQRPayload(data), [data]);
  const qrPayload2 = useMemo(() => buildSecondQRPayload(data), [data]);

  useEffect(() => {
    if (!qrPayload) {
      setQrDataUrl("");
      return;
    }
    let active = true;
    generateQRDataUrl(qrPayload, 600)
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [qrPayload]);

  useEffect(() => {
    if (!qrPayload2) {
      setQrDataUrl2("");
      return;
    }
    let active = true;
    generateQRDataUrl(qrPayload2, 600)
      .then((url) => {
        if (active) setQrDataUrl2(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [qrPayload2]);

  const Component = backStyle.Component;
  const pattern = getPattern(visibleBackData.customization.patternId);
  const patternStyle = pattern.apply(swatch.fg + "1f");

  // 表面テンプレ ID から推定したフォントを CSS 変数として裏面の各テンプレに伝播。
  // 裏面テンプレが `var(--c-body-font, ...)` を参照していれば、表面の見た目に
  // 自動的に連動する。ユーザーが fontGlobal を別途指定している場合は fontStyle() が
  // 上書きするので、そちらが優先される。
  const inferredTemplateFont = getTemplateDefaultFont(templateId);
  const cssVars: CSSProperties = {
    ["--c-bg" as never]: swatch.bg,
    ["--c-fg" as never]: swatch.fg,
    ["--c-accent" as never]: swatch.accent,
    ["--c-muted" as never]: swatch.muted,
    ["--c-body-font" as never]: inferredTemplateFont,
    fontFamily: `var(--c-body-font, ${inferredTemplateFont})`,
    ...fontStyle(visibleBackData.customization.fontGlobal),
  };

  const size = getCardSize(visibleBackData.customization.cardSize);
  const reactId = useId();
  const scopeId = `b${reactId.replace(/[:]/g, "")}`;
  // 裏面の連絡先の見せ方は backContactPrefix 優先（未指定なら表面と同じ）
  const backContactMode =
    visibleBackData.customization.backContactPrefix ??
    visibleBackData.customization.contactPrefix;
  // CSS生成も裏面用に contactPrefix を上書きしたコピーで実行。
  // 自由レイアウトエディタの項目別オフセット／サイズ／一括整列も、
  // 表面用フィールドを *Back の裏面専用フィールドで上書きしてから
  // CSS生成器に渡すことで、表面と裏面で独立した調整を可能にする。
  const dataForBackCss: CardData = {
    ...visibleBackData,
    customization: {
      ...visibleBackData.customization,
      contactPrefix: backContactMode,
      layoutOffsetPerRole: visibleBackData.customization.layoutOffsetPerRoleBack ?? {},
      fontSizePerRole: visibleBackData.customization.fontSizePerRoleBack ?? {},
      bulkTextAlign: visibleBackData.customization.bulkTextAlignBack,
      // 裏面の項目別フォントは fontPerRoleBack を優先。
      // ただし "auto" は「表面と同じ」を意味するので、表面の値が見えるように
      // マージから除外する。これにより裏面で「表面と同じ」を選んでいる項目は
      // 自動的に表面のフォント設定に連動する。
      fontPerRole: {
        ...visibleBackData.customization.fontPerRole,
        ...Object.fromEntries(
          Object.entries(visibleBackData.customization.fontPerRoleBack ?? {})
            .filter(([, v]) => v && v !== "auto"),
        ),
      },
    },
  };
  const fontCss = generateFontOverrideCss(dataForBackCss, `data-card-scope="${scopeId}"`);

  return (
    <div
      className={className}
      style={cssVars}
      data-contact-prefix={backContactMode}
      data-card-scope={scopeId}
    >
      {fontCss && <style dangerouslySetInnerHTML={{ __html: fontCss }} />}
      <CardFrame
        ref={ref}
        bleed={bleed}
        widthMm={size.widthMm}
        heightMm={size.heightMm}
        // No rounded corners or shadow — preview must match the printed
        // result 1:1.
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
          <Component data={visibleBackData} template={template} qrDataUrl={qrDataUrl} qrDataUrl2={qrDataUrl2} />
          {visibleBackData.customization.patternId !== "none" && (
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50" style={patternStyle} />
          )}
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
