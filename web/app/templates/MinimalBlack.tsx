import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, snsList, nameDisplay } from "./utils";

/**
 * "ミニマル・ブラック" — 黒地・センター揃え。
 *
 * 上部=会社名 / 中央=氏名・英名・装飾線・肩書 / 下部=連絡先 の3ブロック
 * 構成にして、要素同士が重ならないよう flex-1 で中央領域を確保。
 * （ホワイト版が左寄せの非対称レイアウトなので、構造を差別化）
 */
export function MinimalBlack({ data }: { data: CardData }) {
  const d = fallback(data);
  const sns = snsList(d);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center text-center"
      style={{
        backgroundColor: "var(--c-bg, #0a0a0a)",
        color: "var(--c-fg, #fafafa)",
        fontFamily: "var(--c-body-font, 'Helvetica Neue', system-ui, sans-serif)",
        padding: "5mm",
      }}
    >
      {/* 上部: 会社名 */}
      <div
        data-role="company"
        className="text-[6.5pt] tracking-[0.4em] uppercase truncate"
        style={{ color: "var(--c-muted, #737373)", maxWidth: "100%" }}
      >
        {d.company}
      </div>

      {/* 中央: 氏名 / 英名 / 装飾線 / 肩書 */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full px-[1mm]">
        <div
          data-role="name"
          className="text-[20pt] font-light tracking-[0.04em] leading-[1.05] truncate"
          style={{ maxWidth: "100%" }}
        >
          {nameDisplay(d)}
        </div>
        {d.nameEn && (
          <div
            data-role="nameEn"
            className="text-[6.5pt] tracking-[0.4em] uppercase mt-[1.2mm] truncate"
            style={{ color: "var(--c-muted, #a3a3a3)", maxWidth: "100%" }}
          >
            {d.nameEn}
          </div>
        )}
        {/* 装飾線（1本のみ・小さめ） */}
        <div
          className="my-[1.8mm] h-px w-[8mm]"
          style={{ backgroundColor: "var(--c-fg, #fafafa)", opacity: 0.45 }}
        />
        {d.title && (
          <div
            data-role="title"
            className="text-[7.5pt] tracking-[0.12em] truncate"
            style={{ opacity: 0.88, maxWidth: "100%" }}
          >
            {d.title}
          </div>
        )}
      </div>

      {/* 下部: 連絡先 — flex 末尾に固定（重ならない） */}
      <div
        data-role="contact"
        className="w-full text-[6.5pt] tracking-[0.05em] flex flex-wrap justify-center items-center gap-x-[2.5mm] gap-y-[0.5mm]"
        style={{ color: "var(--c-muted, #a3a3a3)" }}
      >
        {d.phone && (
          <span data-role="phone" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="phone" size="2.4mm" className="shrink-0" />
            <span className="truncate">{d.phone}</span>
          </span>
        )}
        {d.email && (
          <span data-role="email" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="mail" size="2.4mm" className="shrink-0" />
            <span className="truncate">{d.email}</span>
          </span>
        )}
        {d.website && (
          <span data-role="website" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="web" size="2.4mm" className="shrink-0" />
            <span className="truncate">{d.website}</span>
          </span>
        )}
        {d.addressLine && (
          <span data-role="address" className="basis-full flex items-center justify-center gap-[1mm] min-w-0">
            <Icon kind="pin" size="2.4mm" className="shrink-0" />
            <span className="truncate">{d.addressLine}</span>
          </span>
        )}
        {sns.length > 0 && (
          <span className="basis-full flex flex-wrap justify-center gap-x-[2mm] gap-y-[0.3mm]">
            {sns.map((s) => (
              <span key={s.kind} className="flex items-center gap-[0.8mm] min-w-0">
                <Icon kind={s.kind} size="2.3mm" className="shrink-0" />
                <span className="truncate">{s.value}</span>
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
