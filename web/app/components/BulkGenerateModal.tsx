"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardData } from "../lib/types";
import { CardRenderer } from "./CardRenderer";
import { CardBack } from "./CardBack";
import {
  BulkPerson,
  BULK_LIMIT,
  downloadBulkA4Pdf,
  downloadBulkPrintShopPdf,
  openBulkA4PdfForPrint,
  previewFirstA4Page,
  isPhotoTemplate,
  mergePersonIntoCardData,
} from "../lib/bulkExport";
import {
  fetchSheetRows,
  type Integration,
  listIntegrationsByKind,
} from "../lib/integrations";
import { listProfiles, type SavedProfile } from "../lib/profiles";

/**
 * 一括生成モーダル (#214) — 完成ページから開く、名刺メーカーの設計内容を
 * 名簿に展開して全員分のPDFを出力する画面。
 *
 * 取込経路は3つ: CSV / 連絡帳 / 連携シート。
 * 共通項目（テンプレ・カスタマイズ）は現在の編集中のもの。差替対象は
 * 氏名・ふりがな・ローマ字・役職・部署・連絡先・SNS のみ。
 *
 * 写真テンプレ (photo-*) を選んでいる場合は警告: 全員に同じ写真が使われる。
 * 50名超は切り捨て (リスク#2)。
 */

type Tab = "csv" | "contact" | "sheet";
type OutputMode = "a4" | "print-shop";

const COL_LABELS = [
  "氏名",
  "ふりがな(姓)",
  "ふりがな(名)",
  "ローマ字",
  "役職",
  "部署",
  "電話",
  "メール",
  "住所",
  "Webサイト",
  "会社名",
] as const;
type ColKey = (typeof COL_LABELS)[number];

const COL_TO_FIELD: Record<ColKey, keyof BulkPerson> = {
  "氏名": "name",
  "ふりがな(姓)": "lastNameKana",
  "ふりがな(名)": "firstNameKana",
  "ローマ字": "nameEn",
  "役職": "title",
  "部署": "department",
  "電話": "phone",
  "メール": "email",
  "住所": "address",
  "Webサイト": "website",
  "会社名": "company",
};

export function BulkGenerateModal({
  open,
  onClose,
  data,
  templateId,
  backStyleId,
}: {
  open: boolean;
  onClose: () => void;
  data: CardData;
  templateId: string;
  backStyleId: string;
}) {
  const [tab, setTab] = useState<Tab>("csv");
  const [csvText, setCsvText] = useState("");
  const [headerRow, setHeaderRow] = useState(true);
  const [rows, setRows] = useState<string[][]>([]);
  /** 列マッピング: CSV列インデックス → 項目 */
  const [colMap, setColMap] = useState<(ColKey | "skip")[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  const [withBack, setWithBack] = useState(true);
  const [outputMode, setOutputMode] = useState<OutputMode>("a4");
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; phase: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [captureTarget, setCaptureTarget] = useState<BulkPerson | null>(null);
  const captureFrontRef = useRef<HTMLDivElement>(null);
  const captureBackRef = useRef<HTMLDivElement>(null);
  /** 印刷プレビュー: PDF生成前に1ページ目のサンプルを表示する Data URL */
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setIntegrations(listIntegrationsByKind("contact"));
      setProfiles(listProfiles().filter((p) => p.kind === "contact"));
      setError(null);
    }
  }, [open]);

  // CSV/シートのテキストをパースして rows/colMap 初期化
  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      setRows([]);
      setColMap([]);
      return;
    }
    // タブ or カンマで分割。1行目を見て区切り文字を自動判定。
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const grid = lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, "")));
    setRows(grid);

    // 列マッピング自動推定 (ヘッダー行から)
    if (headerRow && grid.length > 0) {
      const header = grid[0];
      const guessed: (ColKey | "skip")[] = header.map((h) => {
        const m = COL_LABELS.find((label) => label === h || h.includes(label.replace(/\(.+?\)/g, "")));
        return m ?? "skip";
      });
      setColMap(guessed);
    } else {
      // ヘッダーなし: 順番にデフォルト割り当て
      setColMap(grid[0].map((_, i) => COL_LABELS[i] ?? "skip"));
    }
  };

  // 列マッピングを使って BulkPerson[] に変換
  const people: BulkPerson[] = useMemo(() => {
    let dataRows = rows;
    if (headerRow && dataRows.length > 0) dataRows = dataRows.slice(1);
    const result: BulkPerson[] = [];
    for (const r of dataRows) {
      const p: BulkPerson = { id: `tmp_${Math.random().toString(36).slice(2, 8)}`, name: "" };
      r.forEach((val, idx) => {
        const key = colMap[idx];
        if (!key || key === "skip") return;
        const field = COL_TO_FIELD[key];
        if (field === "name") p.name = val;
        else p[field] = val as never;
      });
      if (p.name || result.length < BULK_LIMIT) result.push(p);
    }
    // 連絡帳から選択された人もここに追加
    if (tab === "contact" && selectedProfileIds.size > 0) {
      for (const profile of profiles) {
        if (!selectedProfileIds.has(profile.id)) continue;
        result.push({
          id: profile.id,
          name: profile.data.nameJa,
          nameEn: profile.data.nameEn,
          lastNameKana: profile.data.lastNameKana,
          firstNameKana: profile.data.firstNameKana,
          company: profile.data.company,
          title: profile.data.title,
          department: profile.data.department,
          phone: profile.data.phone,
          email: profile.data.email,
          address: profile.data.address,
          postalCode: profile.data.postalCode,
          website: profile.data.website,
        });
      }
    }
    return result.slice(0, BULK_LIMIT);
  }, [rows, headerRow, colMap, tab, selectedProfileIds, profiles]);

  const tooMany =
    rows.length > 0
      ? (headerRow ? rows.length - 1 : rows.length) > BULK_LIMIT
      : selectedProfileIds.size > BULK_LIMIT;

  const photoWarning = isPhotoTemplate(templateId);

  const handleSyncSheet = async (it: Integration) => {
    setBusy(it.id);
    setError(null);
    try {
      const result = await fetchSheetRows(it.url);
      if (!result.ok || !result.rows) {
        setError(`同期失敗: ${result.error ?? "unknown"}`);
        return;
      }
      // シートのデータをCSV相当のtextに変換してparseCsvに流す
      const text = result.rows.map((cols) => cols.join("\t")).join("\n");
      setCsvText(text);
      setHeaderRow(false); // シートは大抵ヘッダーなし
      parseCsv(text);
    } finally {
      setBusy(null);
    }
  };

  // 共通の出力オプションを組み立てるヘルパー
  const buildOpts = (
    onProg?: (p: { current: number; total: number; phase: string }) => void,
  ) => ({
    people,
    setCaptureTarget,
    frontNode: () => captureFrontRef.current,
    backNode: () => captureBackRef.current,
    withBack,
    onProgress: onProg,
    filenamePrefix: `mycard-${templateId}`,
  });

  /** 印刷プレビュー: 1ページ目だけ生成して表示 (1人分のA4 = 10面付け の確認) */
  const handlePreview = async () => {
    if (people.length === 0) {
      setError("生成対象が0名です");
      return;
    }
    setBusy("preview");
    setError(null);
    try {
      const dataUrl = await previewFirstA4Page(buildOpts());
      setPreviewDataUrl(dataUrl);
    } catch (e) {
      setError(`プレビュー失敗: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(null);
      setCaptureTarget(null);
    }
  };

  const handleDownload = async () => {
    if (people.length === 0) {
      setError("生成対象が0名です");
      return;
    }
    setBusy("generate");
    setError(null);
    setProgress({ current: 0, total: people.length, phase: "front" });
    try {
      const opts = buildOpts((p) => setProgress(p));
      if (outputMode === "a4") {
        await downloadBulkA4Pdf(opts);
      } else {
        await downloadBulkPrintShopPdf(opts);
      }
    } catch (e) {
      setError(`生成失敗: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(null);
      setCaptureTarget(null);
      setTimeout(() => setProgress(null), 1500);
    }
  };

  /** プリンタで直接印刷 (新しいタブでPDFを開き window.print() を発火) */
  const handlePrint = async () => {
    if (people.length === 0) {
      setError("生成対象が0名です");
      return;
    }
    setBusy("print");
    setError(null);
    setProgress({ current: 0, total: people.length, phase: "front" });
    try {
      const opts = buildOpts((p) => setProgress(p));
      // A4 モードでのみ直接印刷をサポート (印刷会社用PDFはダウンロードのみ)
      if (outputMode === "a4") {
        await openBulkA4PdfForPrint(opts);
      } else {
        // 印刷会社用はダウンロードに切替
        await downloadBulkPrintShopPdf(opts);
      }
    } catch (e) {
      setError(`印刷失敗: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(null);
      setCaptureTarget(null);
      setTimeout(() => setProgress(null), 1500);
    }
  };

  if (!open) return null;

  const previewPerson = captureTarget ?? people[0] ?? null;
  const previewData = previewPerson ? mergePersonIntoCardData(data, previewPerson) : data;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-base font-bold text-neutral-900">💼 同じデザインで名簿から一括生成</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              現在編集中のデザイン・カラー・レイアウトをそのまま、名簿の各人に氏名・連絡先を差替えてPDF化（最大 {BULK_LIMIT} 名）
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 写真テンプレ警告 */}
          {photoWarning && (
            <div className="rounded-md border-2 border-amber-300 bg-amber-50 p-3 flex items-start gap-2 text-[12px] text-amber-900">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <strong>写真系テンプレートを選択中</strong>です。一括生成すると、現在設定されている顔写真が全員のカードに同じものとして印刷されます。
                個人ごとに違う写真を使いたい場合は、テンプレートを写真不要のものに変更してから一括生成してください。
              </div>
            </div>
          )}

          {/* 名簿取込タブ */}
          <div>
            <div className="text-[11px] font-bold text-neutral-700 mb-1.5">名簿の取込元</div>
            <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 rounded-md p-1">
              {([
                { id: "csv", label: "📥 CSV / 貼付け" },
                { id: "contact", label: "📇 連絡帳から選ぶ" },
                { id: "sheet", label: "📡 連携シート" },
              ] as { id: Tab; label: string }[]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`text-[11px] py-1.5 rounded font-bold transition ${
                    tab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* CSV タブ */}
          {tab === "csv" && (
            <div className="space-y-2">
              <textarea
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  parseCsv(e.target.value);
                }}
                placeholder="氏名,ふりがな(姓),ふりがな(名),ローマ字,役職,部署,電話,メール,住所,Webサイト,会社名&#10;山田 太郎,やまだ,たろう,Taro Yamada,営業部長,営業部,090-1234-5678,taro@example.com,東京都...,https://example.com,株式会社サンプル"
                rows={6}
                className="w-full px-2 py-1.5 rounded border border-neutral-300 text-[11px] font-mono"
              />
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={headerRow}
                  onChange={(e) => {
                    setHeaderRow(e.target.checked);
                    if (csvText) parseCsv(csvText);
                  }}
                />
                <span>1行目をヘッダー行として扱う(列名から自動マッピング)</span>
              </label>
              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                <span>または</span>
                <label htmlFor="bulk-csv-file" className="px-2 py-1 rounded-md bg-blue-600 text-white font-semibold cursor-pointer hover:bg-blue-700">
                  📂 ファイルを選ぶ
                </label>
                <input
                  type="file"
                  id="bulk-csv-file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setCsvText(reader.result);
                        parseCsv(reader.result);
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </div>
            </div>
          )}

          {/* 連絡帳タブ */}
          {tab === "contact" && (
            <div className="space-y-2">
              {profiles.length === 0 ? (
                <div className="rounded border-2 border-dashed border-neutral-200 p-4 text-center text-[11px] text-neutral-500">
                  連絡帳に登録された連絡先がありません
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {profiles.map((p) => {
                    const checked = selectedProfileIds.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer ${
                          checked ? "border-blue-400 bg-blue-50" : "border-neutral-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(selectedProfileIds);
                            if (e.target.checked) next.add(p.id);
                            else next.delete(p.id);
                            setSelectedProfileIds(next);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-neutral-900 truncate">{p.label}</div>
                          <div className="text-[9px] text-neutral-500 truncate">
                            {p.data.company} {p.data.title && `／ ${p.data.title}`}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="text-[10px] text-neutral-500">
                選択中: {selectedProfileIds.size} 名
              </div>
            </div>
          )}

          {/* 連携シートタブ */}
          {tab === "sheet" && (
            <div className="space-y-2">
              {integrations.length === 0 ? (
                <div className="rounded border-2 border-dashed border-neutral-200 p-4 text-center text-[11px] text-neutral-500">
                  連携シートが登録されていません。トップページの「連携設定」から追加してください。
                </div>
              ) : (
                <div className="space-y-1">
                  {integrations.map((it) => (
                    <div key={it.id} className="flex items-center justify-between p-2 rounded border border-neutral-200">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold truncate">{it.label}</div>
                        <div className="text-[9px] text-neutral-500 truncate">{it.url}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSyncSheet(it)}
                        disabled={busy === it.id}
                        className="text-[10px] px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-neutral-300"
                      >
                        {busy === it.id ? "取得中…" : "📥 取込"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 列マッピング (CSV/シート時のみ) */}
          {(tab === "csv" || tab === "sheet") && rows.length > 0 && (
            <div className="rounded-md border border-neutral-200 p-2">
              <div className="text-[11px] font-bold mb-1">列マッピング（自動推定済・必要なら変更）</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px]">
                {(headerRow ? rows[0] : rows[0].map((_, i) => `列${i + 1}`)).map((label, idx) => (
                  <label key={idx} className="flex items-center gap-1">
                    <span className="text-neutral-500 w-16 truncate">{label}</span>
                    <select
                      value={colMap[idx] ?? "skip"}
                      onChange={(e) => {
                        const next = [...colMap];
                        next[idx] = e.target.value as ColKey | "skip";
                        setColMap(next);
                      }}
                      className="flex-1 px-1 py-0.5 border border-neutral-200 rounded text-[10px]"
                    >
                      <option value="skip">— 使わない —</option>
                      {COL_LABELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 件数表示 */}
          <div className="text-[11px] text-neutral-700">
            <strong>対象: {people.length} 名</strong>
            {tooMany && (
              <span className="ml-2 text-amber-700 font-bold">
                ※ 上限 {BULK_LIMIT} 名を超えた分は切り捨てられます
              </span>
            )}
          </div>

          {/* 出力モード */}
          <div className="grid sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOutputMode("a4")}
              className={`p-3 rounded-lg border-2 text-left transition ${
                outputMode === "a4"
                  ? "border-emerald-500 bg-emerald-50/40"
                  : "border-neutral-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className={`text-sm font-bold ${outputMode === "a4" ? "text-emerald-700" : "text-neutral-900"}`}>
                🏠 自宅A4印刷
              </div>
              <div className="text-[10px] text-neutral-600 mt-0.5">
                A4 1枚に2×5=10枚面付け。トリムマーク付き
              </div>
            </button>
            <button
              type="button"
              onClick={() => setOutputMode("print-shop")}
              className={`p-3 rounded-lg border-2 text-left transition ${
                outputMode === "print-shop"
                  ? "border-amber-500 bg-amber-50/40"
                  : "border-neutral-200 bg-white hover:border-amber-300"
              }`}
            >
              <div className={`text-sm font-bold ${outputMode === "print-shop" ? "text-amber-700" : "text-neutral-900"}`}>
                🏢 印刷会社用PDF
              </div>
              <div className="text-[10px] text-neutral-600 mt-0.5">
                1人1ページ・97×61mm塗り足し付
              </div>
            </button>
          </div>

          <label className="flex items-center gap-2 text-[11px] cursor-pointer">
            <input type="checkbox" checked={withBack} onChange={(e) => setWithBack(e.target.checked)} />
            <span>裏面もPDFに含める（両面印刷用）</span>
          </label>

          {/* 1人目プレビュー */}
          {previewPerson && (
            <div className="rounded-md border border-neutral-200 p-2">
              <div className="text-[10px] text-neutral-500 mb-1">1人目プレビュー</div>
              <div className="flex gap-3 flex-wrap">
                <div>
                  <div className="text-[9px] text-neutral-500">表面</div>
                  <CardRenderer data={previewData} templateId={templateId} />
                </div>
                {withBack && (
                  <div>
                    <div className="text-[9px] text-neutral-500">裏面</div>
                    <CardBack data={previewData} templateId={templateId} backStyleId={backStyleId} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 進捗 */}
          {progress && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-2">
              <div className="text-[11px] font-bold text-blue-900">
                生成中… {progress.current} / {progress.total}（{progress.phase === "front" ? "表面" : "裏面"}）
              </div>
              <div className="w-full bg-white rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-2 py-1.5 text-[11px] text-red-700">
              {error}
            </div>
          )}

          {/* === 出力アクション群 (プレビュー → ダウンロード or 印刷) === */}
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200">
            <div className="text-[10px] text-neutral-600 leading-snug">
              💡 出力前に1ページ目の印刷プレビューを確認できます。
              {outputMode === "a4" && (
                <span> A4モードでは <strong>1名につきA4 1枚（同じ人の名刺10枚面付け）</strong>で出力 → 50名なら50ページPDF。</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={onClose}
                disabled={!!busy}
                className="px-3 py-2 rounded-md border border-neutral-300 text-[11px] hover:bg-neutral-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={!!busy || people.length === 0}
                className="px-3 py-2 rounded-md border border-blue-400 bg-blue-50 text-blue-700 font-bold text-[11px] hover:bg-blue-100 disabled:opacity-50"
              >
                {busy === "preview" ? "生成中…" : "👀 印刷プレビュー (1ページ目)"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!!busy || people.length === 0 || outputMode !== "a4"}
                className="px-3 py-2 rounded-md bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 disabled:bg-neutral-300"
                title={outputMode === "a4" ? "ブラウザの印刷ダイアログでプリンタへ直接送信" : "印刷会社用PDFは直接印刷不可 (ダウンロード後にお使いください)"}
              >
                {busy === "print" ? "生成中…" : "🖨 プリンタで直接印刷"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!!busy || people.length === 0}
                className="flex-1 px-4 py-2 rounded-md bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 disabled:bg-neutral-300"
              >
                {busy === "generate"
                  ? "生成中…"
                  : `💾 ${people.length} 名分PDFをダウンロード`}
              </button>
            </div>
          </div>
        </div>

        {/* 画面外キャプチャ用エリア — 出力時に各人を順に renderingしてtoPng */}
        <div className="absolute -left-[9999px] top-0">
          {captureTarget && (
            <>
              <div ref={captureFrontRef}>
                <CardRenderer
                  data={mergePersonIntoCardData(data, captureTarget)}
                  templateId={templateId}
                  bleed={outputMode === "print-shop"}
                  hideBleedGuide
                />
              </div>
              {withBack && (
                <div ref={captureBackRef}>
                  <CardBack
                    data={mergePersonIntoCardData(data, captureTarget)}
                    templateId={templateId}
                    backStyleId={backStyleId}
                    bleed={outputMode === "print-shop"}
                    hideBleedGuide
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 印刷プレビューモーダル — 1ページ目のPDFを iframe で表示 */}
      {previewDataUrl && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-neutral-900">👀 印刷プレビュー（1ページ目）</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  1名分のA4出力イメージ。実際は名簿全員分（{people.length}ページ）が生成されます
                </div>
              </div>
              <button type="button" onClick={() => setPreviewDataUrl(null)} className="text-neutral-400 hover:text-neutral-700 text-xl">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-neutral-100 p-4">
              <iframe
                src={previewDataUrl}
                className="w-full h-full bg-white border border-neutral-200 rounded"
                title="印刷プレビュー"
              />
            </div>
            <div className="px-5 py-3 border-t border-neutral-200 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPreviewDataUrl(null)}
                className="px-3 py-1.5 rounded-md border border-neutral-300 text-[11px] hover:bg-neutral-50"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl(null);
                  handlePrint();
                }}
                disabled={!!busy || outputMode !== "a4"}
                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:bg-neutral-300"
              >
                🖨 プリンタで直接印刷
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl(null);
                  handleDownload();
                }}
                disabled={!!busy}
                className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 disabled:bg-neutral-300"
              >
                💾 全員分PDFダウンロード
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
