import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const baseProps = (size: number | string = "1em") => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const PhoneIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const MailIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

export const GlobeIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
  </svg>
);

export const PinIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const XIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest} fill="currentColor" stroke="none">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const InstagramIcon = ({ size, ...rest }: IconProps) => (
  // Instagram-style: rounded square camera body + lens circle + viewfinder dot.
  // Solid filled style so it reads as the Instagram logo at small sizes.
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size ?? 16}
    height={size ?? 16}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...rest}
  >
    {/* Rounded square frame (camera body) */}
    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9z" />
    {/* Lens (camera circle) */}
    <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    {/* Top-right small dot (viewfinder) */}
    <circle cx="17.5" cy="6.5" r="1.1" />
  </svg>
);

export const LinkedinIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest} fill="currentColor" stroke="none">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.57h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.55V9h3.57z" />
  </svg>
);

export const GithubIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest} fill="currentColor" stroke="none">
    <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.13-.31-.54-1.54.12-3.21 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.67.25 2.9.12 3.21.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5z" />
  </svg>
);

export const ArrowIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const SparkleIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest} fill="currentColor" stroke="none">
    <path d="M12 2 14 9.5 21.5 11.5 14 13.5 12 21 10 13.5 2.5 11.5 10 9.5z" />
  </svg>
);

export const QuoteIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c0 4-2 4-3 4z" />
    <path d="M14 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c0 4-2 4-3 4z" />
  </svg>
);

export const DownloadIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const FileTextIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const ImageIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export type IconKind = "phone" | "mail" | "web" | "pin" | "x" | "ig" | "linkedin" | "github";

/** 各アイコンに対応するテキストラベル（text モード時に表示） */
const ICON_TEXT_LABEL: Record<IconKind, string> = {
  phone: "T.",
  mail: "E.",
  web: "W.",
  pin: "@",
  x: "X",
  ig: "IG",
  linkedin: "in",
  github: "GH",
};

/**
 * Icon — テンプレ内の連絡先アイコン共通ラッパー。
 *
 * 標準では SVG アイコンを描画。連絡先の見せ方（contactPrefix）切替に対応：
 *  - "icon"    : SVG表示 + テキストラベルは隠す（デフォルト）
 *  - "text"    : SVG非表示 + テキストラベル "T." "E." 等を表示
 *  - "minimal" : SVG非表示 + テキストラベルも非表示
 *
 * 切替は親要素の data-contact-prefix 属性に応じて CSS で行う
 * （customization.ts の generateContactPrefixCss が出力）。
 */
export function Icon({ kind, ...rest }: { kind: IconKind } & IconProps) {
  const svgClass = `card-icon card-icon-${kind} ${rest.className ?? ""}`.trim();
  const dataProps = { "data-card-icon": kind };
  const label = ICON_TEXT_LABEL[kind];
  const renderSvg = () => {
    switch (kind) {
      case "phone":
        return <PhoneIcon {...rest} {...dataProps} className={svgClass} />;
      case "mail":
        return <MailIcon {...rest} {...dataProps} className={svgClass} />;
      case "web":
        return <GlobeIcon {...rest} {...dataProps} className={svgClass} />;
      case "pin":
        return <PinIcon {...rest} {...dataProps} className={svgClass} />;
      case "x":
        return <XIcon {...rest} {...dataProps} className={svgClass} />;
      case "ig":
        return <InstagramIcon {...rest} {...dataProps} className={svgClass} />;
      case "linkedin":
        return <LinkedinIcon {...rest} {...dataProps} className={svgClass} />;
      case "github":
        return <GithubIcon {...rest} {...dataProps} className={svgClass} />;
    }
  };
  return (
    <>
      {renderSvg()}
      {/*
        テキストラベル（"T." "E." など）— デフォルトでは display:none。
        contactPrefix === "text" の時のみ CSS で表示する。
      */}
      <span
        className="card-icon-text-label"
        data-card-icon-label={kind}
        aria-hidden="true"
        style={{ display: "none", fontWeight: 600, marginRight: "0.2em" }}
      >
        {label}
      </span>
    </>
  );
}
