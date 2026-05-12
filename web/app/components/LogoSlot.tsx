import { CardData } from "../lib/types";

type Props = {
  data: CardData;
  className?: string;
  fallbackInitials?: string;
  fallbackBg?: string;
  fallbackFg?: string;
  showFallback?: boolean;
};

export function LogoSlot({
  data,
  className = "",
  fallbackInitials,
  fallbackBg = "transparent",
  fallbackFg = "currentColor",
  showFallback = false,
}: Props) {
  if (data.logoDataUrl) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src={data.logoDataUrl}
          alt="logo"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }
  if (!showFallback) return null;
  const initials =
    fallbackInitials ??
    (data.company ? data.company.charAt(0) : data.nameJa.charAt(0) || "Y");
  return (
    <div
      className={`flex items-center justify-center font-bold ${className}`}
      style={{ backgroundColor: fallbackBg, color: fallbackFg }}
    >
      {initials}
    </div>
  );
}
