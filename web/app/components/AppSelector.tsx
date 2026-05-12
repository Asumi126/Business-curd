"use client";

import { useEffect, useState } from "react";
import { Wizard } from "./Wizard";
import { ShopCardWizard } from "./ShopCardWizard";
import { NametagWizard } from "./NametagWizard";
import { IntegrationsModal } from "./IntegrationsModal";
import { BackupModal } from "./BackupModal";

const APP_MODE_KEY = "mycardmaker:v1:appMode";

// "bulk-card" は名刺メーカー内の一括生成モーダル(BulkGenerateModal)に統合済み。
// 旧 localStorage 値が来た場合は business-card へリダイレクト。
type Mode = "business-card" | "shop-card" | "nametag";

export function AppSelector() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(APP_MODE_KEY) as string | null;
      if (
        stored === "business-card" ||
        stored === "shop-card" ||
        stored === "nametag"
      ) {
        setMode(stored as Mode);
      } else if (stored === "bulk-card") {
        // 旧一括メーカー → 名刺メーカーへリダイレクト(統合済み)
        window.localStorage.setItem(APP_MODE_KEY, "business-card");
        setMode("business-card");
      }
    }
    setHydrated(true);
  }, []);

  const choose = (m: Mode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(APP_MODE_KEY, m);
    }
    setMode(m);
  };

  const reset = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(APP_MODE_KEY);
    }
    setMode(null);
  };

  if (!hydrated) return null;

  if (mode === "business-card") {
    return <Wizard onBackToSelector={reset} appLabel="名刺作成" />;
  }

  if (mode === "shop-card") {
    return <ShopCardWizard onBackToSelector={reset} />;
  }

  if (mode === "nametag") {
    return <NametagWizard onBackToSelector={reset} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Welcome hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-neutral-200 px-6 py-10 sm:py-12 sm:px-10 mb-6">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-purple-200/20 blur-3xl pointer-events-none" />
          <div className="relative text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-600 mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              印刷発注対応・完全無料・登録不要・データは端末ローカル
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.025em] text-neutral-900 leading-[1.15]">
              ようこそ、
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Card Maker
              </span>
              へ
            </h1>
            <p className="mt-3 text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed mx-auto">
              質問に答えるだけで、印刷会社に発注できる名刺・ショップカード・名札が完成します。所要時間およそ 5〜10 分。
            </p>
            {/* 3-step visual guide */}
            <div className="mt-6 grid grid-cols-3 gap-2 max-w-md mx-auto">
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm">1</div>
                <div className="text-[11px] text-neutral-700 font-medium">カードの種類を選ぶ</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-sm font-bold text-purple-600 shadow-sm">2</div>
                <div className="text-[11px] text-neutral-700 font-medium">カスタマイズする</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-sm font-bold text-emerald-600 shadow-sm">3</div>
                <div className="text-[11px] text-neutral-700 font-medium">印刷データの保存</div>
              </div>
            </div>
            <a
              href="#manual"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("manual")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-5 inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-blue-700 underline decoration-dotted underline-offset-2"
            >
              📖 はじめての方は「使い方マニュアル」へ
            </a>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
            何を作りますか？
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            用途に合わせて選んでください。後からいつでも切り替えられます。
          </p>
        </div>
        {/* Removed nothing here yet */}

        <div className="flex justify-end mb-3 gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setBackupOpen(true)}
            className="text-[11px] px-3 py-1.5 rounded-full border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold flex items-center gap-1"
            title="全データを1ファイルでバックアップ・復元"
          >
            💾 データのバックアップ
          </button>
          <button
            type="button"
            onClick={() => setIntegrationsOpen(true)}
            className="text-[11px] px-3 py-1.5 rounded-full border border-neutral-300 bg-white hover:border-emerald-400 hover:text-emerald-700"
            title="Googleスプレッドシート・Excelの連携シートを管理"
          >
            ⚙️ 連携設定（シート登録）
          </button>
        </div>

        {/* === 3カードレイアウト ===
            上段: 名刺メーカー (フィーチャー大カード - フル幅、グラデ強め)
            下段: ショップカード / 名札メーカー (BETA・2カラム並び)
            マガジン風の非対称レイアウトで「メイン機能とサブ機能」のヒエラルキーを表現。 */}
        <div className="space-y-4">
          {/* === FEATURED: 名刺メーカー === */}
          <button
            type="button"
            onClick={() => choose("business-card")}
            className="group relative w-full overflow-hidden flex items-stretch gap-5 p-6 sm:p-7 rounded-3xl border-2 border-neutral-200 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100/50 active:scale-[0.995] transition text-left"
          >
            {/* 背景装飾ブラー */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-indigo-300/15 blur-3xl pointer-events-none" />

            {/* アイコン (大) */}
            <div className="relative shrink-0 flex items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/30 flex items-center justify-center rotate-[-3deg] group-hover:rotate-0 transition-transform">
                <div className="w-12 sm:w-14 h-8 sm:h-9 rounded-md bg-white/95 shadow-inner" />
              </div>
            </div>

            {/* テキスト */}
            <div className="relative flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-600">
                  Main / 推奨
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                  本格仕様
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 group-hover:text-blue-700 transition-colors">
                名刺を作る
              </div>
              <div className="text-[12px] sm:text-sm text-neutral-600 mt-1.5 leading-relaxed">
                ビジネス名刺・個人名刺を本格的にデザイン。30種類以上のテンプレ・両面・QRコード・A4印刷・印刷会社入稿まで対応。
                <span className="block mt-1 text-blue-700 font-semibold">
                  💼 完成ページから 最大50名の名簿一括生成 も可能
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="relative shrink-0 self-center hidden sm:flex items-center gap-2 text-sm font-bold text-blue-700 group-hover:translate-x-1 transition-transform">
              <span>はじめる</span>
              <span className="text-lg">→</span>
            </div>
          </button>

          {/* === SECONDARY: ショップカード + 名札メーカー (2カラム) === */}
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => choose("shop-card")}
              className="group relative overflow-hidden flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-neutral-200 bg-white hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50 active:scale-[0.99] transition text-left"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-purple-300/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                  <div className="w-6 h-6 rounded-full border-[2px] border-white/95" />
                </div>
                <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  BETA
                </span>
              </div>
              <div className="relative">
                <div className="text-base font-bold text-neutral-900 group-hover:text-purple-700 leading-tight">
                  ショップカード／<br className="sm:hidden" />スタンプカード
                </div>
                <div className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                  店舗・サロン・カフェ・教室向け。店舗情報＋スタンプ機能で来店促進。
                </div>
              </div>
              <div className="relative text-xs text-purple-600 font-semibold mt-auto group-hover:translate-x-1 transition-transform">
                → ショップカードメーカーを開く
              </div>
            </button>

            <button
              type="button"
              onClick={() => choose("nametag")}
              className="group relative overflow-hidden flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-neutral-200 bg-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100/50 active:scale-[0.99] transition text-left"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-300/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <div className="w-8 h-6 rounded-md bg-white/95 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
                <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  BETA
                </span>
              </div>
              <div className="relative">
                <div className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 leading-tight">
                  名札メーカー
                </div>
                <div className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                  オフ会・店員名札を一気に作成。名簿から最大100名分をまとめてA4印刷。
                </div>
              </div>
              <div className="relative text-xs text-emerald-600 font-semibold mt-auto group-hover:translate-x-1 transition-transform">
                → 名札メーカーを開く
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-[11px] text-neutral-500 text-center leading-relaxed">
          名刺メーカーは完成度の高い本格仕様。ショップカード／名札作成は育成中の BETA 機能です。
        </div>

        {/* === 使い方マニュアル === */}
        <div id="manual">
          <ManualSection />
        </div>
      </div>

      <IntegrationsModal open={integrationsOpen} onClose={() => setIntegrationsOpen(false)} />
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </main>
  );
}

// === Manual Section ==========================================================

function ManualSection() {
  const [openId, setOpenId] = useState<string | null>("getting-started");
  const sections: { id: string; emoji: string; title: string; content: React.ReactNode }[] = [
    {
      id: "getting-started",
      emoji: "🚀",
      title: "はじめての方へ（30秒で読める）",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <p>このサイトは <strong>3つのアプリ</strong> が入っています。上のカードから1つ選んで始めてください：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>名刺メーカー</strong> — 1人分のビジネス名刺をじっくりデザイン。完成ページから <strong>名簿一括生成（最大50名）</strong>も可能</li>
            <li><strong>ショップカード／スタンプカード</strong> — 店舗・カフェ向けのお店紹介カード＆来店スタンプ</li>
            <li><strong>名札メーカー（BETA）</strong> — オフ会・店員さん用に最大100名分を一気に印刷</li>
          </ul>
          <p>すべて <strong>無料・登録不要・データは自分の端末に保存</strong>。途中で止めても次回続きから再開できます。</p>
        </div>
      ),
    },
    {
      id: "business-card",
      emoji: "📇",
      title: "名刺メーカーの使い方",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li><strong>はじめ方を選ぶ</strong>: 4つの開始方法（新規／途中再開／デザイン帳から／連絡帳から）</li>
            <li><strong>基本情報を入力</strong>: 氏名・会社・連絡先など。途中の保存ボタンで途中保存もOK</li>
            <li><strong>テンプレを選ぶ</strong>: 30種類以上から直感で。あとから変更可能</li>
            <li><strong>裏面を選ぶ</strong>: 連絡先強調・QRコード・スローガンなど用途別レイアウト</li>
            <li><strong>カスタマイズ</strong>: カラー・フォント・テキストエフェクト・パターンを微調整</li>
            <li><strong>微調整</strong>: 全体フォントサイズ・余白・項目別サイズなど最終調整</li>
            <li><strong>ダウンロード</strong>: 印刷会社向け（塗り足し付）／ご家庭A4面付け から選択</li>
          </ol>
          <div className="rounded-md bg-blue-50 border border-blue-200 p-2 mt-2">
            <strong>💡 印刷のコツ</strong>: 印刷会社（ラクスル・プリントパック）に発注する場合は <strong>「印刷会社向けPDF」</strong> をダウンロード。家庭印刷なら <strong>「A4面付け」</strong> が便利です。
          </div>
        </div>
      ),
    },
    {
      id: "shop-card",
      emoji: "🏪",
      title: "ショップカードの使い方",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li><strong>店舗情報</strong>: 屋号・連絡先・営業時間・住所</li>
            <li><strong>表面テンプレ</strong>: 20種類のデザイン（ミニマル／カラフル／プロ風など）</li>
            <li><strong>カスタム背景（任意）</strong>: 自分の写真をアップロードして独自カードに</li>
            <li><strong>裏面レイアウト</strong>: クーポン／スタンプカード／メニュー／QRなど10種類</li>
            <li><strong>スタンプ枠数</strong>: 5・8・10・12・15・20・30・40・50個から選択</li>
            <li><strong>ロゴ反映</strong>: アップロードしたロゴはすべての面に位置・サイズ調整可</li>
          </ol>
          <div className="rounded-md bg-purple-50 border border-purple-200 p-2 mt-2">
            <strong>💡 スタンプカード設計</strong>: 来店ペースに合わせて枠数を選びましょう（週1来店×3ヶ月 = 12枠など）。
          </div>
        </div>
      ),
    },
    {
      id: "nametag",
      emoji: "🏷",
      title: "名札メーカーの使い方",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li><strong>名簿を作る</strong>: 4つの方法から選べます
              <ul className="list-disc pl-4 mt-1 text-[11px] text-neutral-600">
                <li>「+ 1名追加」で1人ずつ手入力</li>
                <li>「📋 サンプル」で即試せる3名分</li>
                <li>「📇 保存名簿から選ぶ」で過去登録した人を再利用（最大1000名保存可）</li>
                <li>「📥 Excel・スプレッドシートから取込」でCSV/タブ貼付・ファイルアップロード</li>
              </ul>
            </li>
            <li><strong>テンプレを選ぶ</strong>: ミニマル／カラーバンド／イベント／プロフェッショナル</li>
            <li><strong>共通設定</strong>: イベント名・日付・メインカラー・ロゴ（全員に適用）</li>
            <li><strong>QRコード（任意）</strong>: 名簿の「URL列」に各人のリンクを入れると自動でQR生成</li>
            <li><strong>PDFダウンロード</strong>: A4縦に2×4=8面付けで自動生成（複数ページ）</li>
          </ol>
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2 mt-2 space-y-1">
            <div><strong>💡 Googleスプレッドシート連携</strong>: シートを「リンクを知っている全員が閲覧可能」に設定し、URLを「📇 保存名簿」→「🔗 Googleスプレッドシート連携」タブに貼ると、ワンクリックで同期できます。</div>
            <div><strong>💡 Excel／Windowsの場合</strong>: 「ファイル → 名前を付けて保存 → CSV (UTF-8)」で保存し、「📂 CSVファイルを選ぶ」から取り込めます。</div>
            <div><strong>💡 用紙</strong>: A4 8面付けの市販ラベル用紙（88×55mm）と互換。普通紙でも切り抜きガイド線付き。</div>
          </div>
        </div>
      ),
    },
    {
      id: "integration",
      emoji: "⚙️",
      title: "Googleスプレッドシート・Excel自動連携",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <p>シートを登録しておけば、名刺・名札・ショップカード全アプリで <strong>ワンクリック取込</strong> できます。</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>トップページ右上の <strong>「⚙️ 連携設定」</strong> をクリック</li>
            <li>用途別タブ（名札 / 名刺・連絡帳 / ショップカード）を選ぶ</li>
            <li>「+ 新規登録」でシート名とURLを入力（最大20件）</li>
            <li>Googleスプレッドシートは <strong>「リンクを知っている全員が閲覧可能」</strong> に設定が必要</li>
            <li>「🔍 同期テスト」で取得が成功するか事前確認</li>
            <li>各アプリで「📡 連携シートから取込」ボタンが出現します</li>
          </ol>
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2 mt-2 space-y-1">
            <div><strong>💡 Excel・Windows対応</strong>: Excelファイルは「ファイル→名前を付けて保存→CSV(UTF-8)」でCSV化 → Googleドライブにアップロード → 共有設定 → 上記の手順</div>
            <div><strong>⚠️ プライバシー</strong>: 「リンク共有」を有効にすると公開状態になります。社員名簿などプライベートデータには専用Googleアカウントを推奨</div>
          </div>
        </div>
      ),
    },
    {
      id: "bulk-card",
      emoji: "💼",
      title: "名刺を名簿から一括生産（最大50名）",
      content: <BulkManualContent />,
    },
    {
      id: "privacy",
      emoji: "🔐",
      title: "プライバシー・セキュリティ",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <p><strong>個人情報を一切サーバに送信しません。</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>データ保管場所</strong>: あなたのブラウザ内（IndexedDB／localStorage）— サーバには到達しません</li>
            <li><strong>通信</strong>: HTTPS のみ。HSTS / CSP / X-Frame-Options などのセキュリティヘッダー実装済み</li>
            <li><strong>クリックジャッキング対策</strong>: iframe 埋め込み禁止</li>
            <li><strong>XSS対策</strong>: ユーザー入力のCSS/HTMLサニタイゼーション、Content-Security-Policy 適用</li>
            <li><strong>第三者連携</strong>: なし（広告・分析ツール非搭載）</li>
            <li><strong>Googleスプレッドシート同期</strong>: 公開シートの取得のみ。Google認証なし、書き込み不可</li>
            <li><strong>ログ・追跡</strong>: 一切しません</li>
          </ul>
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2 mt-2">
            <strong>💡 完全無料・登録不要・アカウント不要</strong>。ブラウザを閉じても、同じ端末・同じブラウザで開けば続きから再開できます。
          </div>
        </div>
      ),
    },
    {
      id: "save-data",
      emoji: "💾",
      title: "データはどこに保存される？",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <p>すべてのデータは <strong>あなたのブラウザ内</strong>（localStorage / IndexedDB）にローカル保存されます。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>サーバには一切送信されません</strong>。プライバシー上安心です</li>
            <li><strong>同じブラウザ・端末</strong>で開けば、いつでも続きから再開できます</li>
            <li>別端末・別ブラウザではデータは見えません（端末間同期はなし）</li>
            <li>名札の保存名簿は「📥 CSVバックアップ」でエクスポートできます</li>
          </ul>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2 mt-2">
            <strong>⚠️ ご注意</strong>: ブラウザの履歴・データを削除すると保存内容も消えます。重要な名簿は定期的にCSVバックアップを取ってください。
          </div>
        </div>
      ),
    },
    {
      id: "troubleshoot",
      emoji: "🛠",
      title: "うまくいかない時",
      content: (
        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-700">
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">Q. 印刷したら表裏のサイズが微妙にずれる</dt>
              <dd className="pl-3 text-neutral-600">A. プリンタの「実際のサイズ」「100%」設定で印刷してください。「ページに合わせる」「縮小する」設定だとズレます。</dd>
            </div>
            <div>
              <dt className="font-semibold">Q. Googleスプレッドシート同期で「アクセスできません」エラー</dt>
              <dd className="pl-3 text-neutral-600">A. シート右上「共有」→「リンクを知っている全員が閲覧可能」に変更してください。プライベート設定では取得できません。</dd>
            </div>
            <div>
              <dt className="font-semibold">Q. 文字が切れる・重なる</dt>
              <dd className="pl-3 text-neutral-600">A. 「微調整」ステップで全体フォントサイズを少し小さくするか、項目ごとサイズを調整してください。</dd>
            </div>
            <div>
              <dt className="font-semibold">Q. 名札にQRコードが出ない</dt>
              <dd className="pl-3 text-neutral-600">A. 名簿の「QR用URL」列に有効な URL（https://〜）を入れてください。空欄ならQRは表示されません。</dd>
            </div>
            <div>
              <dt className="font-semibold">Q. データが消えた</dt>
              <dd className="pl-3 text-neutral-600">A. ブラウザのプライベートモード／シークレットモードを使うとデータは保持されません。通常ウィンドウでお使いください。</dd>
            </div>
          </dl>
        </div>
      ),
    },
  ];

  return (
    <section className="mt-10 rounded-3xl bg-white border border-neutral-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border-b border-neutral-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <div>
            <div className="text-base font-bold text-neutral-900">使い方マニュアル</div>
            <div className="text-[11px] text-neutral-600 mt-0.5">
              迷ったらここを開いてください。各項目をタップして展開できます。
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {sections.map((s) => {
          const open = openId === s.id;
          return (
            <div key={s.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : s.id)}
                className={`w-full text-left px-5 py-3 flex items-center justify-between gap-2 hover:bg-neutral-50 transition ${
                  open ? "bg-neutral-50/60" : ""
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-sm font-semibold text-neutral-900">{s.title}</span>
                </span>
                <span className={`text-neutral-400 text-sm transition-transform ${open ? "rotate-90" : ""}`}>
                  ›
                </span>
              </button>
              {open && (
                <div className="px-5 pb-4 pt-1">{s.content}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * 名簿一括生産マニュアル — 名刺メーカーの完成ページから開く
 * BulkGenerateModal の使い方と、A4面付け時の出力順を図示する。
 */
function BulkManualContent() {
  // ミニカードのSVGダミー描画。番号付きで1枚を表現。
  const MiniCard = ({
    n,
    flipped = false,
    accent = "bg-blue-100 text-blue-800 border-blue-300",
  }: {
    n: number;
    flipped?: boolean;
    accent?: string;
  }) => (
    <div
      className={`relative aspect-[91/55] rounded border ${accent} flex items-center justify-center text-[10px] font-bold ${
        flipped ? "opacity-80" : ""
      }`}
    >
      <span>{n}{flipped ? "裏" : ""}</span>
    </div>
  );
  // A4ページの2列×5段グリッド
  const A4Page = ({
    startIdx,
    count,
    flipped = false,
  }: {
    startIdx: number;
    count: number;
    flipped?: boolean;
  }) => {
    const slots = Array.from({ length: 10 }).map((_, slot) => {
      const i = startIdx + slot;
      if (slot >= count) return null;
      // 裏面は左右反転（両面印刷時の表裏一致のため）
      const col = slot % 2;
      const row = Math.floor(slot / 2);
      const xCol = flipped ? 1 - col : col;
      return { i, col: xCol, row };
    });
    return (
      <div className="relative aspect-[210/297] bg-white border-2 border-neutral-300 rounded p-2 w-[120px]">
        <div className="grid grid-cols-2 grid-rows-5 gap-1 h-full">
          {Array.from({ length: 10 }).map((_, slot) => {
            const s = slots.find(
              (x) => x && x.col + x.row * 2 === slot,
            );
            if (!s) return <div key={slot} />;
            return (
              <MiniCard
                key={slot}
                n={s.i + 1}
                flipped={flipped}
                accent={
                  flipped
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : "bg-blue-100 text-blue-800 border-blue-300"
                }
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-[12px] leading-relaxed text-neutral-700">
      <p>
        名刺メーカーで <strong>1人分のデザインを仕上げて完成ページに進む</strong>と、
        「💼 同じデザインで名簿から一括生成」ボタンが現れます。
        押すと、現在のデザイン（テンプレ・カラー・カスタマイズ・自由レイアウト・カスタム背景）を
        そのままに、名簿から取り込んだ各人の氏名・連絡先・役職だけを差し替えて
        <strong>最大50名分のPDF</strong>を一気に生成できます。
      </p>

      {/* 取込経路 */}
      <div className="rounded-md border border-neutral-200 bg-white p-3">
        <div className="text-[12px] font-bold mb-1.5">📥 名簿の取込経路（3つから選択）</div>
        <ol className="list-decimal pl-5 space-y-1 text-[11px]">
          <li><strong>CSV / 貼付け</strong>: ExcelやGoogleスプレッドシートからカンマ/タブ区切りで貼り付け、またはファイルアップロード</li>
          <li><strong>連絡帳から選ぶ</strong>: 過去に保存した連絡先（最大10件）にチェックを入れて複数選択</li>
          <li><strong>連携シート</strong>: トップページの「連携設定」で登録した Google スプレッドシートからワンクリック取込</li>
        </ol>
        <div className="text-[10px] text-neutral-600 mt-2">
          列マッピングは1行目をヘッダーとして自動推定。違っている場合は手動で修正可能。
        </div>
      </div>

      {/* 出力モード */}
      <div className="rounded-md border border-neutral-200 bg-white p-3">
        <div className="text-[12px] font-bold mb-1.5">🖨 出力モード（2種類）</div>
        <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
          <div className="rounded border border-emerald-200 bg-emerald-50/40 p-2">
            <div className="font-bold text-emerald-800">🏠 自宅A4印刷</div>
            <div className="text-neutral-600 mt-0.5">
              A4縦に <strong>2列×5段=10枚</strong> 面付け。50名なら 5枚 のA4にまとめて出力。トリムマーク付き。
            </div>
          </div>
          <div className="rounded border border-amber-200 bg-amber-50/40 p-2">
            <div className="font-bold text-amber-800">🏢 印刷会社用PDF</div>
            <div className="text-neutral-600 mt-0.5">
              <strong>1人1ページ・97×61mm塗り足し付</strong>。ラクスル・プリントパック等にそのまま入稿可。
            </div>
          </div>
        </div>
      </div>

      {/* 出力順の図解 */}
      <div className="rounded-md border-2 border-blue-200 bg-blue-50/30 p-3">
        <div className="text-[12px] font-bold mb-2">📄 A4自宅印刷の出力順（50名の例）</div>
        <div className="text-[11px] text-neutral-700 mb-2">
          A4 1枚に左→右、上→下の順に番号順で配置されます。10枚で改ページして次のA4へ。
          <strong>両面印刷時は表面ページが先、続けて裏面ページが順に出力</strong>されます。
        </div>

        {/* 1枚のA4の中身詳細 (1〜10人目) */}
        <div className="rounded-md bg-white border border-blue-300 p-2 mb-3">
          <div className="text-[11px] font-bold mb-1.5">A4 1ページ目（表面・1〜10人目）</div>
          <div className="flex items-start gap-2">
            <A4Page startIdx={0} count={10} />
            <div className="text-[10px] text-neutral-700 leading-snug">
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>1人目→2人目（最上段）</li>
                <li>3人目→4人目</li>
                <li>5人目→6人目（中段）</li>
                <li>7人目→8人目</li>
                <li>9人目→10人目（最下段）</li>
              </ol>
              <div className="mt-1.5 text-neutral-500">
                11人目から2枚目のA4へ
              </div>
            </div>
          </div>
        </div>

        {/* 50名分のA4ページ全体 (表面のみ) */}
        <div className="rounded-md bg-white border border-blue-300 p-2 mb-3">
          <div className="text-[11px] font-bold mb-1.5">表面ページ群（A4を5枚使用）</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <A4Page startIdx={0} count={10} />
            <A4Page startIdx={10} count={10} />
            <A4Page startIdx={20} count={10} />
            <A4Page startIdx={30} count={10} />
            <A4Page startIdx={40} count={10} />
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            1〜10 / 11〜20 / 21〜30 / 31〜40 / 41〜50
          </div>
        </div>

        {/* 両面印刷時の裏面 */}
        <div className="rounded-md bg-white border border-purple-300 p-2">
          <div className="text-[11px] font-bold mb-1.5 text-purple-800">
            裏面ページ群（両面印刷時のみ・5〜10ページ目）
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <A4Page startIdx={0} count={10} flipped />
            <A4Page startIdx={10} count={10} flipped />
            <A4Page startIdx={20} count={10} flipped />
            <A4Page startIdx={30} count={10} flipped />
            <A4Page startIdx={40} count={10} flipped />
          </div>
          <div className="text-[10px] text-neutral-600 mt-1.5 leading-snug">
            <strong>裏面ページは列が左右反転して配置されます</strong>（表裏が物理的に同じカードで重なるため）。
            プリンタの両面印刷設定（長辺フリップ/短辺フリップ）に応じて表裏が一致します。
          </div>
        </div>
      </div>

      {/* 注意点 */}
      <div className="rounded-md bg-amber-50 border border-amber-200 p-3 space-y-1.5">
        <div className="text-[12px] font-bold text-amber-900">⚠️ 使う際の注意</div>
        <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-900">
          <li>
            <strong>写真テンプレート（photo-*）選択時</strong>：
            全員に <strong>同じ顔写真</strong> が印刷されます。違う写真にしたい場合はテンプレートを切り替えてから一括生成してください（警告バナーが表示されます）。
          </li>
          <li>
            <strong>50名上限</strong>：51名以上のCSVを取り込んだ場合、超過分は自動的に切り捨てられます。大量分は分割してください。
          </li>
          <li>
            <strong>ロゴ・カスタム背景</strong>：全員に同じものが適用されます。
          </li>
          <li>
            <strong>列名の自動マッピング</strong>：CSVのヘッダー行に「氏名」「電話」など日本語の項目名を入れると自動で割り当てられます。違っていれば手動修正可能。
          </li>
        </ul>
      </div>
    </div>
  );
}
