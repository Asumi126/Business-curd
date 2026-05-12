import { CardData } from "../lib/types";

type Props = {
  data: CardData;
  size?: string;
  /** 旧仕様の互換用に残しているが未使用。 */
  bgColor?: string;
  fgColor?: string;
  className?: string;
  forceStyle?: string;
};

/**
 * ロゴ枠コンポーネント。
 * 仕様変更: アップロードされた logoDataUrl がある場合のみ画像を表示し、
 * 無い場合は何も表示しない（旧来の頭文字モノグラム代替は廃止）。
 * `monogramStyle` や `forceStyle` は後方互換のために受け取るが、
 * 描画判定には用いない。
 */
export function Monogram({
  data,
  size = "12mm",
  className = "",
}: Props) {
  if (!data.logoDataUrl) return null;
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={data.logoDataUrl}
        alt="logo"
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}
