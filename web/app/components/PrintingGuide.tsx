"use client";

import { useState } from "react";

type Tab = "home" | "shop";

export function PrintingGuide() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-200">
        <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          📖 印刷の手順マニュアル
        </div>
        <div className="text-[11px] text-neutral-600 mt-0.5">
          自宅プリンタで印刷する／印刷会社に依頼する、それぞれの手順を解説します
        </div>
      </div>

      <div className="flex border-b border-amber-200">
        <button
          type="button"
          onClick={() => setTab("home")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
            tab === "home"
              ? "bg-white text-amber-900 border-b-2 border-amber-600 -mb-px"
              : "text-neutral-600 hover:bg-amber-100/30"
          }`}
        >
          🏠 自宅プリンタで印刷
        </button>
        <button
          type="button"
          onClick={() => setTab("shop")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
            tab === "shop"
              ? "bg-white text-amber-900 border-b-2 border-amber-600 -mb-px"
              : "text-neutral-600 hover:bg-amber-100/30"
          }`}
        >
          🖨 印刷会社に依頼
        </button>
      </div>

      <div className="p-5 text-sm text-neutral-800 leading-relaxed bg-white">
        {tab === "home" && <HomeGuide />}
        {tab === "shop" && <ShopGuide />}
      </div>
    </div>
  );
}

function HomeGuide() {
  return (
    <div className="space-y-5">
      <Section icon="📄" title="ステップ 1：用紙を選ぶ">
        <p className="mb-2">
          名刺らしい仕上がりにするには <strong>少し厚めの用紙</strong>が必要です。普通のコピー用紙だとペラペラで安っぽくなります。
        </p>
        <table className="w-full text-xs border border-neutral-200 rounded overflow-hidden">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-2 py-1.5 text-left">用紙の種類</th>
              <th className="px-2 py-1.5 text-left">特徴</th>
              <th className="px-2 py-1.5 text-left">おすすめ度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr><td className="px-2 py-1.5"><strong>名刺用紙（マイクロミシン目入り）</strong></td><td className="px-2 py-1.5">A4に10枚分が分割線でカット可。専用品</td><td className="px-2 py-1.5">⭐⭐⭐ 一番楽</td></tr>
            <tr><td className="px-2 py-1.5"><strong>マットコート紙 220g/m²以上</strong></td><td className="px-2 py-1.5">手触りがよくしっかり厚い</td><td className="px-2 py-1.5">⭐⭐⭐</td></tr>
            <tr><td className="px-2 py-1.5"><strong>厚口インクジェット紙 180g/m²</strong></td><td className="px-2 py-1.5">家庭用プリンタで印刷可</td><td className="px-2 py-1.5">⭐⭐</td></tr>
            <tr><td className="px-2 py-1.5">普通のコピー用紙 70g/m²</td><td className="px-2 py-1.5">薄くて頼りない</td><td className="px-2 py-1.5">非推奨</td></tr>
          </tbody>
        </table>
        <p className="text-xs text-neutral-600 mt-2">
          <strong>g/m²（グラム）の目安</strong>: 数字が大きいほど厚い。<br/>
          70g/m² → コピー用紙レベル / 180g/m² → ハガキレベル / 220g/m² → 名刺らしい厚さ / 300g/m² → 高級名刺
        </p>
      </Section>

      <Section icon="🛒" title="ステップ 2：用紙の入手場所">
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>家電量販店・ホームセンター</strong>（ヨドバシ・ビック・カインズ等）の名刺コーナー</li>
          <li><strong>Amazon / 楽天</strong>で「名刺用紙」「マット紙 220g」などで検索</li>
          <li><strong>無印良品</strong>や<strong>100円ショップ</strong>でも名刺用紙は売っています</li>
        </ul>
        <p className="text-xs text-neutral-600 mt-2">
          💡 初めての方は<strong>「エレコム MT-MN1WN」「サンワサプライ JP-MC10」</strong>などの<strong>マイクロミシン目入り名刺用紙</strong>がおすすめ。A4から10枚パキッと分割するだけで名刺サイズになります（カット作業不要）。
        </p>
      </Section>

      <Section icon="🖨" title="ステップ 3：プリンタで印刷">
        <ol className="list-decimal list-inside space-y-2 text-xs">
          <li>「<strong>📥 PDFをダウンロード</strong>」を押してPDFを保存</li>
          <li>保存したPDFファイルを開く（Macなら「プレビュー.app」、Windowsなら「Acrobat Reader」）</li>
          <li>メニューから「<strong>ファイル → プリント</strong>」を選択</li>
          <li>プリンタ設定で：
            <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
              <li><strong>用紙サイズ：A4</strong>（名刺用紙のサイズ）</li>
              <li><strong>用紙の種類：マットコート紙</strong>（または使用する紙に合わせる）</li>
              <li><strong>印刷品質：高品質 / きれい</strong></li>
              <li><strong>拡大縮小：「実際のサイズ」</strong>または「100%」（自動縮小しない）</li>
              <li>カラー設定：カラー</li>
              <li>用紙トレイ：手差しトレイ（厚紙用）を使うときれい</li>
            </ul>
          </li>
          <li>テスト印刷を1枚してから本番</li>
        </ol>
      </Section>

      <Section icon="✂️" title="ステップ 4：カット方法">
        <p className="mb-2">マイクロミシン目入り名刺用紙なら、<strong>分割線で折るだけ</strong>でOK。それ以外の用紙の場合：</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>カッターと定規</strong>：トリムマーク（PDFの端の線）に合わせて切る</li>
          <li><strong>ペーパーカッター（ロータリーカッター）</strong>：きれいに大量カット可。3000円程度</li>
          <li><strong>名刺カッター</strong>：91×55mmサイズ専用機。5000円〜</li>
        </ul>
        <p className="text-xs text-neutral-600 mt-2">
          💡 <strong>注意</strong>: 出力PDFは塗り足し3mm込みのサイズ（97×61mm）です。トリム位置（91×55mm）でカットしてください。
        </p>
      </Section>

      <Section icon="⚠️" title="自宅プリンタの注意点">
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>家庭用プリンタの色は<strong>印刷会社ほど綺麗には出ません</strong>。重要な商談用は印刷会社推奨</li>
          <li>厚紙対応プリンタでないと、220g以上の紙は紙詰まりしやすい</li>
          <li>インクジェット紙にレーザープリンタは使わない（インクが定着しない）</li>
          <li>印刷後は1日乾燥させてから持ち歩く（インクが擦れる可能性）</li>
        </ul>
      </Section>
    </div>
  );
}

function ShopGuide() {
  return (
    <div className="space-y-5">
      <Section icon="🏢" title="おすすめの印刷会社">
        <table className="w-full text-xs border border-neutral-200 rounded overflow-hidden">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-2 py-1.5 text-left">会社</th>
              <th className="px-2 py-1.5 text-left">特徴</th>
              <th className="px-2 py-1.5 text-left">最低発注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr><td className="px-2 py-1.5"><strong>ラクスル</strong></td><td className="px-2 py-1.5">国内最大手、初心者にやさしい、100枚〜</td><td className="px-2 py-1.5">100枚</td></tr>
            <tr><td className="px-2 py-1.5"><strong>プリントパック</strong></td><td className="px-2 py-1.5">価格が安い、紙の種類豊富</td><td className="px-2 py-1.5">100枚</td></tr>
            <tr><td className="px-2 py-1.5"><strong>グラフィック</strong></td><td className="px-2 py-1.5">高品質、紙の選択肢200種以上</td><td className="px-2 py-1.5">100枚</td></tr>
            <tr><td className="px-2 py-1.5"><strong>VistaPrint</strong></td><td className="px-2 py-1.5">海外大手、デザインテンプレ豊富</td><td className="px-2 py-1.5">100枚</td></tr>
          </tbody>
        </table>
      </Section>

      <Section icon="📦" title="発注の手順（4ステップ）">
        <ol className="list-decimal list-inside space-y-2 text-xs">
          <li>「<strong>📥 PDFをダウンロード</strong>」でPDFを保存</li>
          <li>印刷会社のサイトを開いて「<strong>名刺印刷</strong>」を選択</li>
          <li>用紙・枚数・加工を選ぶ：
            <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
              <li><strong>サイズ</strong>: 91×55mm（標準）</li>
              <li><strong>用紙</strong>: マットコート 220kg がおすすめ</li>
              <li><strong>表面加工</strong>: マットPP加工（高級感）／ なし（自然）</li>
              <li><strong>枚数</strong>: 初回は100枚から</li>
              <li><strong>角の形</strong>: 角丸（おしゃれ）／ 直角（伝統的）</li>
            </ul>
          </li>
          <li>「<strong>データ入稿</strong>」を選んで保存したPDFをアップロード → 内容を確認 → 注文確定</li>
        </ol>
      </Section>

      <Section icon="✅" title="入稿時のチェックポイント">
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>サイズ:</strong> 91×55mm + 塗り足し3mm = 97×61mm（PDF自動付与済み✓）</li>
          <li><strong>解像度:</strong> 約605dpi（300dpi推奨を超過✓）</li>
          <li><strong>フォント:</strong> 画像化されているのでフォント問題なし✓</li>
          <li><strong>カラーモード:</strong> RGB（主要印刷会社で受付可✓）</li>
          <li><strong>両面印刷:</strong> 出力時に「裏面をPDFに含める」をONに</li>
        </ul>
        <p className="text-xs text-neutral-600 mt-2">
          💡 ほぼ全ての要件を自動で満たすPDFが出力されますが、<strong>各印刷会社のテンプレート要件</strong>と少し異なる場合があります。発注前に「データ確認」サービスを使うと安心です。
        </p>
      </Section>

      <Section icon="💰" title="費用の目安">
        <table className="w-full text-xs border border-neutral-200 rounded overflow-hidden">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-2 py-1.5 text-left">枚数</th>
              <th className="px-2 py-1.5 text-left">価格目安（片面）</th>
              <th className="px-2 py-1.5 text-left">価格目安（両面）</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr><td className="px-2 py-1.5">100枚</td><td className="px-2 py-1.5">500〜1,500円</td><td className="px-2 py-1.5">800〜2,000円</td></tr>
            <tr><td className="px-2 py-1.5">200枚</td><td className="px-2 py-1.5">800〜2,500円</td><td className="px-2 py-1.5">1,300〜3,500円</td></tr>
            <tr><td className="px-2 py-1.5">500枚</td><td className="px-2 py-1.5">1,500〜4,500円</td><td className="px-2 py-1.5">2,300〜6,000円</td></tr>
          </tbody>
        </table>
        <p className="text-xs text-neutral-600 mt-2">
          価格は紙質・加工により変動。ラクスルなら「<strong>翌日届けプラン</strong>」で1,000円前後。
        </p>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
        <span>{icon}</span>
        <span>{title}</span>
      </h4>
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
}
