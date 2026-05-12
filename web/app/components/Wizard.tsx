"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUndoRedo, UNDO_REDO_BTN_CLASS } from "../lib/useUndoRedo";
import { CardData, emptyCardData, sampleCardData } from "../lib/types";
import {
  clearLastStep,
  loadBackStyleId,
  loadCardData,
  loadLastStep,
  loadTemplateId,
  saveBackStyleId,
  saveCardData,
  saveLastStep,
  saveTemplateId,
} from "../lib/storage";
import { listProfiles, SavedProfile } from "../lib/profiles";
import { checkRequirements } from "../lib/requirements";
import { listDrafts, saveDraft, deleteDraft, Draft } from "../lib/drafts";
import { hasAnyUserInput } from "../templates/utils";
import { TEMPLATES } from "../templates";
import { BACK_STYLES } from "../backs";
import { CardRenderer } from "./CardRenderer";
import { CardBack } from "./CardBack";
import { AuthMenu } from "./AuthMenu";
import { ProfileManager } from "./ProfileManager";
import { Step1Welcome } from "./wizard/Step1Welcome";
import { Step1Info, INFO_SECTIONS, InfoSection } from "./wizard/Step1Info";
import { ImageTab, IMAGE_TABS } from "./wizard/Step6Logo";
import { CustomizeTab, CUSTOMIZE_TABS } from "./wizard/Step8Customize";
import { StepQRSettings, QRTab, QR_TABS } from "./wizard/StepQRSettings";
import { Step6Logo } from "./wizard/Step6Logo";
import { Step7Template } from "./wizard/Step7Template";
import { Step8Customize } from "./wizard/Step8Customize";
import { Step9Back } from "./wizard/Step9Back";
import { Step9Tune } from "./wizard/Step9Tune";
import { Step8Finish } from "./wizard/Step8Finish";

/**
 * ステッパー定義 — 旧 11 ステップから 8 ステップへ統合。
 * 旧「お名前/お仕事/連絡先/ウェブ・SNS」は Step1Info 内の内部タブとして
 * まとめ、ユーザーがスクロール不要で各情報を入力できるようにする。
 */
// ステップラベルは絵文字を使わず、テキストのみで構成。
// 視覚的な強調はステッパーの丸数字と色で行う(emerald=完了 / blue=現在 / red=未完了)。
const STEP_LABELS = [
  "TOP",                      // 1
  "情報入力",                 // 2
  "デザイン選択",             // 3
  "裏面選択",                 // 4
  "挿入画像",                 // 5
  "QRコード設定",             // 6
  "カラー\nカスタマイズ",     // 7
  "テキスト\nカスタマイズ",   // 8
  "微調整",                   // 9
  "完成",                     // 10
];

const TOTAL_STEPS = STEP_LABELS.length;

/** 旧ステップ番号 → 新ステップ番号への変換マップ（onJumpTo 互換のため）。 */
function legacyToNewStep(n: number): number {
  if (n <= 1) return 1;
  if (n <= 5) return 2; // 旧 2-5 → 新 2 (情報入力)
  return n - 3; // 旧 6→3, 7→4, 8→5, 9→6, 10→7, 11→8
}

type WizardProps = {
  /** AppSelector から渡される「カードの種類選択へ戻る」コールバック。 */
  onBackToSelector?: () => void;
  /** ヘッダー左上の「ホーム」ボタンに表示するアプリ固有のラベル。例: "名刺作成"。 */
  appLabel?: string;
};

export function Wizard({ onBackToSelector, appLabel = "名刺作成" }: WizardProps = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CardData>(emptyCardData);
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [backStyleId, setBackStyleId] = useState<string>(BACK_STYLES[0].id);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [profilesOpen, setProfilesOpen] = useState(false);
  /** Filter applied when opening the manager: card (=デザイン帳) or contact (=連絡帳). */
  const [profilesKind, setProfilesKind] = useState<"card" | "contact">("card");
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  // ヘッダー（ステッパー部）の折りたたみ。編集領域を広く取りたいユーザー向けに
  // localStorage で記憶。デフォルトは展開状態（初回ユーザーが進捗を把握できるよう）。
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  // 左サイドハンバーガーメニュー（オーバーレイドロワー）。
  // pinned=true なら常時表示、それ以外は ☰ クリックで一時オーバーレイ展開。
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPinned, setMenuPinned] = useState(false);

  // Undo/Redo — 編集データを履歴管理し、「↶ 1つ戻る」ボタンと Cmd/Ctrl+Z で
  // 直前の操作（色変更・テキスト編集など）を取り消せるようにする。
  const { undo, redo, canUndo, canRedo } = useUndoRedo(data, setData);

  // 「途中から続ける」のために前回のステップ番号を覚えておく。
  // 初期化時に loadLastStep で取得し、onContinue 時にそこへ復元する。
  const [resumeStep, setResumeStep] = useState<number | null>(null);

  // どのステップに訪問済みか。step が変わるたびに自動追加。
  // 裏面 (step 4) から QR (step 6) へショートカットで飛ぶと step 5 (挿入画像) が
  // スキップされるため、未訪問の必須ステップにユーザーを誘導する目的で利用する。
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));

  // ステッパー（横スクロール）の自動センタリング用 ref。
  // step が変化するたびに、現在のステップボタンをスクロール範囲の中央に持ってくる。
  const stepperScrollRef = useRef<HTMLDivElement | null>(null);

  // 情報入力ステップ (step === 2) 内のサブセクション。
  // 「次へ」ボタンが name → work → contact → sns → (デザイン選択へ) と
  // 順番に進むよう、状態を Wizard 側で持ってボタン挙動を制御する。
  const [infoSection, setInfoSectionRaw] = useState<InfoSection>("name");
  // 挿入画像ステップ (step === 5) 内のタブ。
  // logo → photo → background → (カスタマイズへ) と「次へ」で順送り。
  const [imageTab, setImageTabRaw] = useState<ImageTab>("logo");
  // カスタマイズステップ (step === 7) 内のタブ。
  // color (front/back サブ) → font の順送り。
  const [customizeTab, setCustomizeTabRaw] = useState<CustomizeTab>("color");
  // カラータブ内の表/裏サイド。「次へ」が表面 → 裏面 → font の順送りで使う。
  const [colorSide, setColorSideRaw] = useState<"front" | "back">("front");
  // QRコード設定ステップ (step === 6) 内のタブ。front → back の順送り。
  const [qrTab, setQrTabRaw] = useState<QRTab>("front");

  // 各ステップ内のサブタブ訪問追跡。すべてのサブタブを通ったときだけ
  // 「そのステップを完了した」と判定する。
  const [visitedInfo, setVisitedInfo] = useState<Set<InfoSection>>(new Set(["name"]));
  const [visitedImage, setVisitedImage] = useState<Set<ImageTab>>(new Set(["logo"]));
  const [visitedCustomize, setVisitedCustomize] = useState<Set<CustomizeTab>>(new Set(["color"]));
  // カラータブ内の表/裏訪問追跡
  const [visitedColorSide, setVisitedColorSide] = useState<Set<"front" | "back">>(new Set(["front"]));
  const [visitedQr, setVisitedQr] = useState<Set<QRTab>>(new Set(["front"]));

  // セッターをラップ: state 変更時に訪問済みセットへ自動追加。
  const setInfoSection = (s: InfoSection) => {
    setInfoSectionRaw(s);
    setVisitedInfo((prev) => (prev.has(s) ? prev : new Set(prev).add(s)));
  };
  const setImageTab = (t: ImageTab) => {
    setImageTabRaw(t);
    setVisitedImage((prev) => (prev.has(t) ? prev : new Set(prev).add(t)));
  };
  const setCustomizeTab = (t: CustomizeTab) => {
    setCustomizeTabRaw(t);
    setVisitedCustomize((prev) => (prev.has(t) ? prev : new Set(prev).add(t)));
  };
  const setColorSide = (s: "front" | "back") => {
    setColorSideRaw(s);
    setVisitedColorSide((prev) => (prev.has(s) ? prev : new Set(prev).add(s)));
  };
  const setQrTab = (t: QRTab) => {
    setQrTabRaw(t);
    setVisitedQr((prev) => (prev.has(t) ? prev : new Set(prev).add(t)));
  };

  /**
   * サブタブ単位で「完了」判定するヘルパ。
   * 訪問済みかつ:
   *   - アップロード/挿入系: コンテンツがある OR 明示スキップにチェック
   *   - その他: 訪問だけで OK
   */
  const isImageTabComplete = (id: ImageTab): boolean => {
    if (!visitedImage.has(id)) return false;
    if (id === "logo") return !!data.logoDataUrl || !!data.logoSkipped;
    if (id === "photo") return !!data.profilePhoto || !!data.photoSkipped;
    if (id === "background") {
      // 背景タブには表/裏の2要素がある — 両方ともコンテンツ or スキップ宣言が必要。
      const frontDone = !!data.customBackground || !!data.customBackgroundSkipped;
      const backDone = !!data.backCustomBackground || !!data.backCustomBackgroundSkipped;
      return frontDone && backDone;
    }
    return true;
  };
  const isQrTabComplete = (id: QRTab): boolean => {
    if (!visitedQr.has(id)) return false;
    if (id === "front") return (data.customization?.frontQRs?.length ?? 0) > 0 || !!data.frontQrSkipped;
    if (id === "back") {
      // 裏面QRはqrModeが選ばれていれば設定済み相当。スキップフラグもOK。
      return !!data.qrMode || !!data.backQrSkipped;
    }
    return true;
  };

  // 各ステップが「全サブタブ完了」状態か判定するヘルパ。
  // ステップ構成: 1=Welcome, 2=情報入力, 3=デザイン, 4=裏面, 5=画像,
  //              6=QR, 7=カラー(front/back), 8=テキスト, 9=微調整, 10=完成。
  const isStepFullyVisited = (n: number): boolean => {
    if (n === 2) return INFO_SECTIONS.every((s) => visitedInfo.has(s.id));
    if (n === 5) return IMAGE_TABS.every((id) => isImageTabComplete(id));
    if (n === 6) return QR_TABS.every((id) => isQrTabComplete(id));
    // step 7: カラーは front + back 両方を訪問していたら完了
    if (n === 7) return visitedColorSide.has("front") && visitedColorSide.has("back");
    return visitedSteps.has(n);
  };
  /** ステップ内で未完了のサブタブのラベル一覧（赤バナー用）。 */
  const missedSubTabsOf = (n: number): string[] => {
    if (n === 2) return INFO_SECTIONS.filter((s) => !visitedInfo.has(s.id)).map((s) => s.label);
    if (n === 5) {
      const labels: Record<ImageTab, string> = {
        logo: "ロゴ",
        photo: "顔写真・装飾",
        background: "カスタム背景",
      };
      return IMAGE_TABS.filter((id) => !isImageTabComplete(id)).map((id) => {
        const reason = !visitedImage.has(id) ? "未訪問" : "未アップロード／スキップ未チェック";
        return `${labels[id]} (${reason})`;
      });
    }
    if (n === 6) {
      const labels: Record<QRTab, string> = { front: "表面のQR", back: "裏面のQR" };
      return QR_TABS.filter((id) => !isQrTabComplete(id)).map((id) => {
        const reason = !visitedQr.has(id) ? "未訪問" : "未設定／スキップ未チェック";
        return `${labels[id]} (${reason})`;
      });
    }
    if (n === 7) {
      const missed: string[] = [];
      if (!visitedColorSide.has("front")) missed.push("表面のカラー");
      if (!visitedColorSide.has("back")) missed.push("裏面のカラー");
      return missed;
    }
    return [];
  };

  useEffect(() => {
    setData(loadCardData());
    setTemplateId(loadTemplateId(TEMPLATES[0].id));
    setBackStyleId(loadBackStyleId(BACK_STYLES[0].id));
    setSavedProfiles(listProfiles());
    setDrafts(listDrafts());
    setResumeStep(loadLastStep());
    try {
      const v = window.localStorage.getItem("wizard.headerCollapsed");
      if (v === "1") setHeaderCollapsed(true);
      const p = window.localStorage.getItem("wizard.menuPinned");
      if (p === "1") setMenuPinned(true);
    } catch {}
    setHydrated(true);
  }, []);

  // 編集中のステップを常に保存しておき、画面を閉じた後にも復元できるようにする。
  // step が変化した時点で localStorage に書き戻す。
  // また、次へ/戻る で遷移した際にユーザーが各ページの頭から内容を確認できるよう、
  // ステップ切替時はウィンドウを最上部までスクロールする。
  useEffect(() => {
    if (!hydrated) return;
    saveLastStep(step);
    setVisitedSteps((prev) => {
      if (prev.has(step)) return prev;
      const next = new Set(prev);
      next.add(step);
      return next;
    });
    // 各ステップ遷移時にトップへスクロール
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step, hydrated]);

  // ステッパー横スクロール: 現在のステップを常に水平中央へ自動スライド。
  // 進捗が進むたびに「今の項目」が画面内に出現するようにする。
  useEffect(() => {
    const container = stepperScrollRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`[data-step-btn="${step}"]`);
    if (!target) return;
    // 水平方向のみセンタリング（縦は触らない）。
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset =
      target.offsetLeft - container.offsetLeft - (containerRect.width - targetRect.width) / 2;
    container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }, [step, headerCollapsed]);

  /**
   * 「途中から続ける」ハンドラ。
   * 直前のセッションで開いていたステップが保存されていればそこへ、
   * 無ければステップ2（基本情報）へ遷移する。
   */
  const continueFromLast = () => {
    // 途中再開時: 前回ステップがあればそこ、無ければ必須項目チェックで
    // 埋まっていれば デザイン選択(3) から、欠けていれば 情報入力(2) から。
    let target = resumeStep ?? 2;
    if (resumeStep == null) {
      const issues = checkRequirements(data, templateId);
      const hasStep2Error = issues.some((i) => i.step === 2 && i.level === "error");
      target = hasStep2Error ? 2 : 3;
    }
    setStep(Math.min(Math.max(target, 2), TOTAL_STEPS));
    // 情報入力ステップを飛ばす場合は訪問済みとマーク
    if (target > 2) {
      setVisitedSteps((prev) => {
        const next = new Set(prev);
        next.add(2);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("wizard.menuPinned", menuPinned ? "1" : "0");
    } catch {}
  }, [menuPinned, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        "wizard.headerCollapsed",
        headerCollapsed ? "1" : "0",
      );
    } catch {}
  }, [headerCollapsed, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveCardData(data);
  }, [data, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveTemplateId(templateId);
  }, [templateId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveBackStyleId(backStyleId);
  }, [backStyleId, hydrated]);

  const update = (patch: Partial<CardData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setCurrentProfileId(null);
  };

  const useSample = () => {
    stashCurrentAsDraft();
    // Reset customization to defaults so the user sees template-default colors,
    // not whatever they customized before. Color customization happens later.
    setData(sampleCardData);
    setCurrentProfileId(null);
    setCurrentDraftId(null);
    // Jump to design selection (step 3 in the consolidated stepper).
    setStep(3);
  };

  const loadProfile = (p: SavedProfile) => {
    // "card" kind: full snapshot — restore design + text.
    // "contact" kind: text only — restore text but reset design to defaults
    // so the user can rebuild from scratch.
    let loadedData: CardData;
    let loadedTemplateId: string;
    if ((p.kind ?? "card") === "card") {
      loadedData = p.data;
      loadedTemplateId = p.templateId || "minimal-white";
      setData(loadedData);
      setTemplateId(loadedTemplateId);
      setBackStyleId(p.backStyleId || "qr-split");
    } else {
      loadedData = {
        ...p.data,
        customization: emptyCardData.customization,
        qr2: emptyCardData.qr2,
        customBackground: "",
        customBackgroundOpacity: 1,
      };
      loadedTemplateId = "minimal-white";
      setData(loadedData);
      setTemplateId(loadedTemplateId);
      setBackStyleId("qr-split");
    }
    setCurrentProfileId(p.id);
    // 名刺帳/連絡帳ロード時の動作:
    //  - 必須項目 (氏名/連絡先) が埋まっていれば 情報入力 (Step 2) はスキップして
    //    デザイン選択 (Step 3) からスタート。
    //  - 必須項目が欠けていれば 情報入力 (Step 2) に誘導して埋めてもらう。
    const issues = checkRequirements(loadedData, loadedTemplateId);
    const hasStep2Error = issues.some((i) => i.step === 2 && i.level === "error");
    setStep(hasStep2Error ? 2 : 3);
    // Step 2 を通したことにして UI ステッパー上「未訪問」表示にしない。
    setVisitedSteps((prev) => {
      const next = new Set(prev);
      next.add(1);
      if (!hasStep2Error) next.add(2);
      return next;
    });
  };

  const onProfileSaved = (p: SavedProfile) => {
    setCurrentProfileId(p.id);
    setSavedProfiles(listProfiles());
  };

  const stashCurrentAsDraft = () => {
    if (!hasAnyUserInput(data)) return;
    saveDraft({
      data,
      templateId,
      backStyleId,
      existingId: currentDraftId ?? undefined,
    });
    setDrafts(listDrafts());
  };

  const startFresh = () => {
    stashCurrentAsDraft();
    // Fresh start = defaults across the board. Past customization is intentionally
    // dropped so the user sees the template's default colors first; they can
    // customize at the dedicated color step later.
    setData(emptyCardData);
    setTemplateId("minimal-white");
    setBackStyleId("qr-split");
    setCurrentProfileId(null);
    setCurrentDraftId(null);
    // 新規作成では「途中から」復元対象もリセット
    clearLastStep();
    setResumeStep(null);
    setStep(2);
  };

  const loadDraft = (d: Draft) => {
    stashCurrentAsDraft();
    setData(d.data);
    setTemplateId(d.templateId);
    setBackStyleId(d.backStyleId);
    setCurrentDraftId(d.id);
    setCurrentProfileId(null);
    // ドラフトロード時: 必須項目が埋まっていれば情報入力をスキップしてデザイン選択へ
    const issues = checkRequirements(d.data, d.templateId);
    const hasStep2Error = issues.some((i) => i.step === 2 && i.level === "error");
    setStep(hasStep2Error ? 2 : 3);
    setVisitedSteps((prev) => {
      const next = new Set(prev);
      next.add(1);
      if (!hasStep2Error) next.add(2);
      return next;
    });
  };

  const removeDraft = (id: string) => {
    deleteDraft(id);
    setDrafts(listDrafts());
    if (currentDraftId === id) setCurrentDraftId(null);
  };

  const isLastStep = step === TOTAL_STEPS;
  const canGoNext = step < TOTAL_STEPS;
  const canGoBack = step > 1;

  const headerProgress = useMemo(() => ((step - 1) / (TOTAL_STEPS - 1)) * 100, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white text-neutral-900">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-3 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* ☰ ハンバーガーボタン: 左サイドドロワーを開閉。pinned 中は不要。 */}
            {!menuPinned && (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center justify-center w-8 h-8 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 hover:border-neutral-500 transition"
                title="メニューを開く（デザイン帳・保存・リセット など）"
                aria-label="メニューを開く"
                aria-expanded={menuOpen}
              >
                <span className="text-base leading-none">☰</span>
              </button>
            )}
            <div className="min-w-0 leading-tight hidden md:block">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="text-[12px] sm:text-[13px] font-bold tracking-tight truncate">
                  名刺メーカー
                </div>
                {/* カード種類選択へ — タイトルの真横に配置 (家マーク+オレンジ) */}
                {onBackToSelector && (
                  <button
                    type="button"
                    onClick={onBackToSelector}
                    className="flex items-center gap-1 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-full transition shadow-sm shrink-0"
                    title="カードの種類選択画面に戻る"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                      aria-hidden
                    >
                      <path d="M12 3.172l8.485 8.485-1.06 1.06L18 11.293V21h-5v-6h-2v6H6v-9.707l-1.425 1.424-1.06-1.06L12 3.172z" />
                    </svg>
                    <span className="hidden sm:inline">カード種類選択</span>
                  </button>
                )}
                {/* アプリ固有「TOPに戻る」ボタン — アイコンは付けず「{appLabel} TOP」表示 */}
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-full transition shadow-sm shrink-0"
                    title={`${appLabel} の最初の画面（TOPページ）に戻る`}
                  >
                    <span className="hidden sm:inline">{appLabel}</span>
                    <span className="font-mono">TOP</span>
                  </button>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] text-neutral-500 truncate">
                Step {step}/{TOTAL_STEPS} — {STEP_LABELS[step - 1]}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Undo/Redo ボタンはヘッダーではなく Step8Customize のカラー欄に移設。
                ⌘Z / Ctrl+Z のショートカットは useUndoRedo 内で常時有効。 */}
            <AuthMenu />
            {/* ヘッダー折りたたみトグル: コンパクトなチップ風。
                ステップ一覧の表示/非表示。シェブロン1つでスタイリッシュに表現。 */}
            <button
              type="button"
              onClick={() => setHeaderCollapsed((v) => !v)}
              className="flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 hover:text-blue-700 hover:bg-blue-50 active:scale-90 transition"
              title={
                headerCollapsed
                  ? "ステップ一覧を表示"
                  : "ステップ一覧を隠して編集領域を広くする"
              }
              aria-label={headerCollapsed ? "ヘッダーを展開する" : "ヘッダーを折りたたむ"}
              aria-expanded={!headerCollapsed}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 transition-transform ${
                  headerCollapsed ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
        {/* Connected stepper navigation — circles linked by progress lines.
         *  Past / current / future are color-coded so the user can read the
         *  whole progress at a glance and click anywhere to jump. */}
        <nav
          aria-label="ステップ一覧"
          hidden={headerCollapsed}
          className="border-t border-neutral-100 bg-gradient-to-b from-white to-neutral-50"
        >
          <div
            ref={stepperScrollRef}
            className="max-w-5xl mx-auto px-2 sm:px-4 py-2"
          >
            {/* 10ステップを横スクロールなしで全表示。flex-1 で等分配し、コネクタは
                各ボタン間に置く。画面幅が狭くてもラベルは縮小して収まるよう設計。 */}
            <div className="flex items-start gap-0">
              {STEP_LABELS.map((labelText, idx) => {
                const n = idx + 1;
                const active = step === n;
                const visited = step > n;
                const isLast = idx === STEP_LABELS.length - 1;
                // Connector to the next step: blue if both this and next are
                // visited/current; gradient halfway when current step.
                const connectorClass = visited
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                  : active
                    ? "bg-gradient-to-r from-blue-500 to-neutral-300"
                    : "bg-neutral-200";
                // 現在ステップより前で「未完了(サブタブ含む)」のものを赤強調
                const isMissed = n < step && n >= 2 && !isStepFullyVisited(n);
                return (
                  <div key={n} className="flex items-start flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setStep(n)}
                      data-step-btn={n}
                      className="group relative flex flex-col items-center gap-1 flex-1 min-w-0 px-0.5 cursor-pointer focus:outline-none"
                      aria-current={active ? "step" : undefined}
                      title={
                        isMissed
                          ? `ステップ${n}: ${labelText}(未訪問・要確認)`
                          : `ステップ${n}: ${labelText}`
                      }
                    >
                      <span
                        className={`relative inline-flex items-center justify-center rounded-full font-bold transition-all shrink-0 ${
                          active
                            ? "w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-100"
                            : isMissed
                              ? "w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-[11px] bg-red-600 text-white ring-2 ring-red-200 animate-pulse"
                              : visited
                                ? "w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-[11px] bg-emerald-500 text-white"
                                : "w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-[11px] bg-white text-neutral-400 border-2 border-neutral-300 group-hover:border-neutral-500 group-hover:text-neutral-700"
                        }`}
                      >
                        {isMissed ? "!" : visited ? "✓" : n}
                      </span>
                      {/* ラベルは \n を改行として 2 行表示に対応（長いタイトル用） */}
                      <span
                        className={`text-[8px] sm:text-[10px] leading-tight text-center transition-colors whitespace-pre-line break-keep ${
                          active
                            ? "text-blue-700 font-bold"
                            : isMissed
                              ? "text-red-700 font-bold"
                              : visited
                                ? "text-emerald-700 font-semibold"
                                : "text-neutral-400 font-medium group-hover:text-neutral-700"
                        }`}
                      >
                        {labelText}
                      </span>
                    </button>
                    {!isLast && (
                      <div
                        className={`h-0.5 mt-2.5 sm:mt-3 flex-shrink-0 transition-all w-2 sm:w-3 ${connectorClass}`}
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Compact progress hint under the stepper */}
            <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500">
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                完了 {step - 1} / {TOTAL_STEPS - 1}
              </span>
              <span className="font-mono text-neutral-600">
                {Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}% 進行中
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-neutral-300 mr-1" />
                残り {TOTAL_STEPS - step}
              </span>
            </div>
          </div>
        </nav>

        {/* Continuous progress bar (gradient) — bottom of header */}
        <div className="h-1 bg-neutral-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${headerProgress}%` }}
          />
        </div>
      </header>

      {/* 左サイドメニュードロワー
          - menuPinned = true: 常時表示（オーバーレイではなくレイアウトに居続ける）
          - menuPinned = false かつ menuOpen = true: 背景を暗くしてスライド表示
          メニュー内に「常時表示」トグルを置き、ユーザーが好みで切替できる。 */}
      {(menuOpen || menuPinned) && (
        <>
          {/* 背景クリックで閉じる（pinned 中は不要） */}
          {!menuPinned && menuOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
          )}
          <aside
            className={`${
              menuPinned
                ? "sticky top-[64px] self-start h-[calc(100vh-64px)]"
                : "fixed top-0 left-0 h-screen z-50 shadow-2xl"
            } w-[260px] bg-white border-r border-neutral-200 flex flex-col`}
            aria-label="メニュー"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
              <div className="text-xs font-bold text-neutral-700">📋 メニュー</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMenuPinned((v) => !v)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                    menuPinned
                      ? "bg-emerald-600 border-emerald-700 text-white"
                      : "bg-white border-neutral-300 text-neutral-700 hover:border-emerald-400"
                  }`}
                  title={menuPinned ? "常時表示を解除" : "常時表示に固定"}
                >
                  {menuPinned ? "📌 常時" : "📌 固定"}
                </button>
                {!menuPinned && (
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                    title="閉じる"
                    aria-label="閉じる"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {(() => {
                const cardCount = savedProfiles.filter((p) => (p.kind ?? "card") === "card").length;
                const contactCount = savedProfiles.filter((p) => p.kind === "contact").length;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setProfilesKind("card");
                        setProfilesOpen(true);
                        if (!menuPinned) setMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 text-left text-xs font-semibold text-neutral-800 bg-white border border-neutral-200 hover:border-purple-400 hover:bg-purple-50 rounded-md px-3 py-2 transition"
                      title="デザイン帳（デザイン込みの保存）"
                    >
                      <span>📚 デザイン帳</span>
                      {cardCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                          {cardCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfilesKind("contact");
                        setProfilesOpen(true);
                        if (!menuPinned) setMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 text-left text-xs font-semibold text-neutral-800 bg-white border border-neutral-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-md px-3 py-2 transition"
                      title="連絡帳（連絡先情報のみ）"
                    >
                      <span>📒 連絡帳</span>
                      {contactCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          {contactCount}
                        </span>
                      )}
                    </button>
                  </>
                );
              })()}
              {step > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasAnyUserInput(data)) {
                        window.alert("まだ何も入力されていません。最低限 名前 を入力してから保存してください。");
                        return;
                      }
                      setProfilesKind("card");
                      setProfilesOpen(true);
                      if (!menuPinned) setMenuOpen(false);
                    }}
                    className="w-full text-left text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-md px-3 py-2 transition"
                  >
                    💾 現在のデザインを保存
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        hasAnyUserInput(data) &&
                        window.confirm(
                          "現在のデザインを下書きに保存して、新しい名刺の作成を始めますか？",
                        )
                      ) {
                        stashCurrentAsDraft();
                        setData(emptyCardData);
                        setTemplateId(TEMPLATES[0].id);
                        setBackStyleId(BACK_STYLES[0].id);
                        setCurrentProfileId(null);
                        setCurrentDraftId(null);
                        setStep(2);
                      } else if (!hasAnyUserInput(data)) {
                        setData(emptyCardData);
                        setStep(2);
                      }
                      if (!menuPinned) setMenuOpen(false);
                    }}
                    className="w-full text-left text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md px-3 py-2 transition"
                  >
                    ＋ 新規作成
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setHeaderCollapsed((v) => !v)}
                className="w-full text-left text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-blue-400 hover:bg-blue-50 rounded-md px-3 py-2 transition"
              >
                {headerCollapsed ? "▾ ステップ一覧を表示" : "▴ ステップ一覧を隠す"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "現在の入力内容をリセットしますか？（名刺帳に保存したものは消えません）",
                    )
                  ) {
                    setData(emptyCardData);
                    setTemplateId(TEMPLATES[0].id);
                    setBackStyleId(BACK_STYLES[0].id);
                    setCurrentProfileId(null);
                    setStep(1);
                    if (!menuPinned) setMenuOpen(false);
                  }
                }}
                className="w-full text-left text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-md px-3 py-2 transition"
              >
                🗑 入力をリセット
              </button>
            </nav>
            <div className="border-t border-neutral-200 px-3 py-2 text-[10px] text-neutral-400">
              My Card Maker
            </div>
          </aside>
        </>
      )}

      <main className={`${menuPinned ? "lg:pl-[260px]" : ""} max-w-5xl mx-auto px-4 py-6 sm:py-10 grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-10`}>
        <div className="min-w-0">
          {/*
            未訪問ステップの誘導バナー(汎用化版)。
            現在の step より小さい番号で、まだ未訪問のステップがあれば
            すべて赤く目立つ表示で列挙し、各ステップへ直接ジャンプできるようにする。
            これにより、デザイン選択→カスタム背景→画像アップロードなどの
            ショートカットで挟まれたステップを飛ばさないよう誘導する。
          */}
          {(() => {
            if (step <= 1) return null;
            // 未訪問: ステップ自体未訪問 or サブタブが全部訪問されていない。
            const missed: { step: number; subMissing: string[] }[] = [];
            for (let n = 2; n < step; n++) {
              if (!isStepFullyVisited(n)) {
                missed.push({ step: n, subMissing: missedSubTabsOf(n) });
              }
            }
            if (missed.length === 0) return null;
            return (
              <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3 mb-4 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0 leading-none mt-0.5">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-red-900 leading-tight">
                      未完了のステップが {missed.length} 件あります
                    </div>
                    <div className="text-[11px] text-red-800/85 mt-0.5 leading-relaxed">
                      以下のステップは未訪問のサブ項目があります。完成前に必ず全部を通ってください。
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      {missed.map(({ step: n, subMissing }) => (
                        <div key={n} className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setStep(n)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 active:scale-95 transition shadow-sm shrink-0"
                          >
                            Step {n}: {STEP_LABELS[n - 1]} →
                          </button>
                          {subMissing.length > 0 && (
                            <span className="text-[10px] text-red-700">
                              未訪問: {subMissing.join(" / ")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          {/* 編集ページ用 Undo/Redo — ヘッダーには置かず、編集ステップ(2..9)の
              コンテンツ上端に常時表示する。Step8Customize は内部にも別途
              Undo/Redo を持つが、こちらは全編集ステップ共通の入口として機能する。 */}
          {step >= 2 && step <= 9 && (
            <div className="mb-4 flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-neutral-500 mr-1">編集の取り消し:</span>
              <button
                type="button"
                onClick={() => undo()}
                disabled={!canUndo}
                className={UNDO_REDO_BTN_CLASS}
                title="一つ前の操作に戻る (⌘+Z / Ctrl+Z)"
                aria-label="元に戻す"
              >
                ↶ 戻る
              </button>
              <button
                type="button"
                onClick={() => redo()}
                disabled={!canRedo}
                className={UNDO_REDO_BTN_CLASS}
                title="一つ後の操作に進む (⌘+Shift+Z / Ctrl+Y)"
                aria-label="やり直す"
              >
                ↷ 進む
              </button>
            </div>
          )}
          {step === 1 && (
            <Step1Welcome
              onUseSample={useSample}
              savedProfiles={savedProfiles}
              onLoadProfile={loadProfile}
              onOpenProfileManager={() => setProfilesOpen(true)}
              onOpenDesignBook={() => {
                setProfilesKind("card");
                setProfilesOpen(true);
              }}
              onOpenContactBook={() => {
                setProfilesKind("contact");
                setProfilesOpen(true);
              }}
              onContinue={continueFromLast}
              resumeStep={resumeStep}
              resumeStepLabel={
                resumeStep && resumeStep >= 1 && resumeStep <= STEP_LABELS.length
                  ? STEP_LABELS[resumeStep - 1]
                  : null
              }
              onCreateNew={startFresh}
              hasInput={hasAnyUserInput(data)}
              drafts={drafts}
              currentDraftId={currentDraftId}
              onLoadDraft={loadDraft}
              onDeleteDraft={removeDraft}
            />
          )}
          {step === 2 && (
            <Step1Info
              data={data}
              update={update}
              section={infoSection}
              setSection={setInfoSection}
            />
          )}
          {step === 3 && (
            <Step7Template data={data} templateId={templateId} setTemplateId={setTemplateId} update={update} />
          )}
          {step === 4 && (
            <Step9Back
              data={data}
              update={update}
              templateId={templateId}
              backStyleId={backStyleId}
              setBackStyleId={setBackStyleId}
              onJumpToStep={(n) => setStep(n)}
            />
          )}
          {step === 5 && (
            <Step6Logo
              data={data}
              update={update}
              templateId={templateId}
              setTemplateId={setTemplateId}
              imageTab={imageTab}
              setImageTab={setImageTab}
            />
          )}
          {step === 6 && (
            <StepQRSettings
              data={data}
              update={update}
              backStyleId={backStyleId}
              tab={qrTab}
              setTab={setQrTab}
            />
          )}
          {/* step 7 = カラーカスタマイズ専用 — Step8Customize に tab="color" 固定 */}
          {step === 7 && (
            <Step8Customize
              data={data}
              update={update}
              templateId={templateId}
              backStyleId={backStyleId}
              undo={undo}
              redo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              tab="color"
              setTab={() => {}}
              colorSide={colorSide}
              setColorSide={setColorSide}
              hideTabSwitcher
            />
          )}
          {/* step 8 = テキストカスタマイズ専用 — Step8Customize に tab="font" 固定 */}
          {step === 8 && (
            <Step8Customize
              data={data}
              update={update}
              templateId={templateId}
              backStyleId={backStyleId}
              undo={undo}
              redo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              tab="font"
              setTab={() => {}}
              hideTabSwitcher
            />
          )}
          {step === 9 && (
            <Step9Tune data={data} update={update} templateId={templateId} backStyleId={backStyleId} />
          )}
          {step === 10 && (
            <Step8Finish
              data={data}
              templateId={templateId}
              backStyleId={backStyleId}
              onOpenProfileManager={() => setProfilesOpen(true)}
              currentProfileId={currentProfileId}
              onJumpTo={(s) => setStep(s)}
              missedSteps={Array.from({ length: TOTAL_STEPS - 2 }, (_, i) => i + 2).filter(
                (n) => !isStepFullyVisited(n),
              )}
            />
          )}

          <div className={`mt-10 flex items-center justify-between gap-3 sticky bottom-3 ${step === 1 ? "hidden" : ""}`}>
            {/*
              「戻る」/「次へ」ボタンは、各ステップ内に複数のサブタブを持つ
              ページ（step 2=情報入力 / 4=挿入画像 / 6=カスタマイズ）でも
              「全項目を1つもスキップせず通る」ように Step1Info を雛形に拡張。
              下のヘルパで「内部位置」と「次のラベル」を集約管理する。
            */}
            {(() => {
              return null;
            })()}
            {(() => {
              // 全タブ式ステップを統一的に扱うヘルパ。
              type TabSpec = {
                items: { id: string; label: string }[];
                current: string;
                setCurrent: (s: string) => void;
              };
              const SUB_LABELS: Record<string, Record<string, string>> = {
                info: Object.fromEntries(INFO_SECTIONS.map((s) => [s.id, s.label])),
                image: { logo: "ロゴ", photo: "顔写真・装飾", background: "カスタム背景" },
                qr: { front: "表面のQR", back: "裏面のQR" },
                customize: {
                  color: "カラー",
                  font: "テキスト",
                  qr: "表面QR",
                  extras: "その他",
                },
              };
              const specByStep: Record<number, TabSpec | null> = {
                2: {
                  items: INFO_SECTIONS.map((s) => ({ id: s.id, label: SUB_LABELS.info[s.id] })),
                  current: infoSection,
                  setCurrent: (s) => setInfoSection(s as InfoSection),
                },
                5: {
                  items: IMAGE_TABS.map((id) => ({ id, label: SUB_LABELS.image[id] })),
                  current: imageTab,
                  setCurrent: (s) => setImageTab(s as ImageTab),
                },
                6: {
                  items: QR_TABS.map((id) => ({ id, label: SUB_LABELS.qr[id] })),
                  current: qrTab,
                  setCurrent: (s) => setQrTab(s as QRTab),
                },
                // step 7 = カラーカスタマイズ: 表面 → 裏面 の順送り。
                // colorSide state を直接サブタブとして扱う。
                7: {
                  items: [
                    { id: "front", label: "表面のカラー" },
                    { id: "back", label: "裏面のカラー" },
                  ],
                  current: colorSide,
                  setCurrent: (s) => setColorSide(s as "front" | "back"),
                },
                // step 8 = テキストカスタマイズ: サブ無し (1ページのみ)。
                // specByStep に登録しないことで次へ即ステップ進行。
              };
              const spec = specByStep[step] ?? null;
              const idx = spec ? spec.items.findIndex((it) => it.id === spec.current) : -1;
              const isFirstSub = !!spec && idx === 0;
              const isLastSub = !!spec && idx === spec.items.length - 1;
              const nextSubLabel = spec && !isLastSub ? spec.items[idx + 1].label : null;
              const nextStepLabel = step < TOTAL_STEPS ? STEP_LABELS[step] : null; // STEP_LABELS[step] = 次のステップ名（0始まり）
              const handleBack = () => {
                if (spec && !isFirstSub) {
                  spec.setCurrent(spec.items[idx - 1].id);
                  return;
                }
                // 前のステップに戻る際、その前のステップにもサブタブがあるなら最終位置に着地。
                const prev = step - 1;
                const prevSpec = specByStep[prev] ?? null;
                if (prevSpec) {
                  prevSpec.setCurrent(prevSpec.items[prevSpec.items.length - 1].id);
                }
                if (canGoBack) setStep((s) => s - 1);
              };
              const handleNext = () => {
                if (spec && !isLastSub) {
                  spec.setCurrent(spec.items[idx + 1].id);
                  return;
                }
                // 次のステップに進む際、新ステップにサブタブがあるなら先頭に着地。
                const next = step + 1;
                const nextSpec = specByStep[next] ?? null;
                if (nextSpec) {
                  nextSpec.setCurrent(nextSpec.items[0].id);
                }
                setStep((s) => s + 1);
              };
              const backEnabled = canGoBack || (!!spec && !isFirstSub);
              const nextLabel =
                step === 1
                  ? "始める"
                  : spec && !isLastSub
                    ? `次へ：${nextSubLabel}`
                    : nextStepLabel
                      ? `次へ：${nextStepLabel}`
                      : "次へ";
              // 戻るボタンのラベル: 内部サブタブが残っていれば「前へ：◯◯」、
              // それ以外は前のステップ名を表示。
              const prevSubLabel = spec && !isFirstSub ? spec.items[idx - 1].label : null;
              const prevStepLabel =
                step > 1 ? STEP_LABELS[step - 2]?.replace(/\n/g, " ") ?? null : null;
              const backLabel =
                spec && !isFirstSub
                  ? `前へ：${prevSubLabel}`
                  : prevStepLabel
                    ? `前へ：${prevStepLabel}`
                    : "戻る";
              return (
                <>
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={!backEnabled}
                    className={`px-5 py-3 rounded-full text-sm font-medium transition ${
                      backEnabled
                        ? "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 shadow-sm"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    ← {backLabel}
                  </button>
                  {canGoNext ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-95 active:scale-95 shadow-lg transition"
                    >
                      {nextLabel} →
                    </button>
                  ) : null}
                </>
              );
            })()}
            {canGoNext ? null : (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-3 rounded-full bg-white border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-100 shadow-sm"
              >
                ← デザインを選び直す
              </button>
            )}
          </div>
        </div>

        {step !== 1 && (
        <aside className="hidden lg:flex flex-col gap-3 sticky top-24 self-start w-[400px] flex-shrink-0">
          <div className="text-xs font-semibold text-neutral-500 tracking-wider uppercase flex items-center justify-between">
            <span>{step === TOTAL_STEPS ? "🖨 仕上がりプレビュー" : "👀 ライブプレビュー"}</span>
            <span className="text-[10px] text-neutral-400 font-normal normal-case tracking-normal">
              91 × 55 mm
            </span>
          </div>
          {(() => {
            const isPhotoTemplate =
              templateId.startsWith("photo-") || templateId.startsWith("vertical-photo");
            const isCustomBgTemplate = templateId === "custom-background";
            const isImageTemplate = isPhotoTemplate || isCustomBgTemplate;
            return (
              <>
                <div>
                  <div className="text-[10px] text-neutral-500 mb-1 tracking-wider uppercase flex items-center justify-between">
                    <span>表面</span>
                    {isImageTemplate && (
                      <span className="text-[9px] text-violet-600 font-semibold normal-case tracking-normal">
                        💡 ダブルクリックで画像位置を変更
                      </span>
                    )}
                  </div>
                  <div
                    className={`bg-neutral-100 rounded-xl p-4 flex items-center justify-center ${
                      isImageTemplate ? "cursor-pointer hover:ring-2 hover:ring-violet-300 transition" : ""
                    }`}
                    onDoubleClick={
                      isImageTemplate
                        ? () => {
                            setStep(5);
                          }
                        : undefined
                    }
                    title={
                      isImageTemplate
                        ? "ダブルクリックで画像アップロード/位置変更ページへ"
                        : undefined
                    }
                  >
                    <CardRenderer data={data} templateId={templateId} />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 mb-1 tracking-wider uppercase">裏面</div>
                  <div className="bg-neutral-100 rounded-xl p-4 flex items-center justify-center">
                    <CardBack data={data} templateId={templateId} backStyleId={backStyleId} />
                  </div>
                </div>
              </>
            );
          })()}

          {/* 各ステップが Portal でサイドバー下部へ追加描画するためのスロット。
              現状は Step9Back の「裏面に表示する項目」を優先度低として
              プレビューの真下へ寄せる用途で使う。 */}
          <div id="step-aside-slot" />

          {/* Image-upload jump button — visible only when the chosen template
            * needs an image and the user hasn't uploaded one yet. Lets them
            * jump to step 6 (画像アップロードの集約ステップ) without losing
            * their place. */}
          {(() => {
            const needsBg = templateId === "custom-background" && !data.customBackground;
            const needsPhoto =
              (templateId.startsWith("photo-") || templateId.startsWith("vertical-photo")) &&
              !data.profilePhoto;
            const needsImage = needsBg || needsPhoto;
            if (!needsImage || step === 5) return null;
            return (
              <button
                type="button"
                onClick={() => setStep(5)}
                className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 hover:bg-violet-100 hover:border-violet-500 p-3 text-left transition flex items-center gap-3"
              >
                <span className="text-2xl">🖼</span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-violet-900">
                    {needsBg ? "背景画像が未設定です" : "顔写真・装飾画像が未設定です"}
                  </span>
                  <span className="block text-[11px] text-violet-700 mt-0.5">
                    クリックでアップロードページ（ステップ7）へ
                  </span>
                </span>
                <span className="text-violet-700 font-bold">→</span>
              </button>
            );
          })()}

          <div className="text-xs text-neutral-500 text-center">
            印刷時は自動で塗り足し3mmが追加されます
          </div>
        </aside>
        )}
      </main>

      <MobilePreview
        data={data}
        templateId={templateId}
        step={step}
        isLastStep={isLastStep}
        onJumpToImage={() => setStep(5)}
      />

      <ProfileManager
        open={profilesOpen}
        onClose={() => setProfilesOpen(false)}
        currentData={data}
        currentTemplateId={templateId}
        currentBackStyleId={backStyleId}
        currentProfileId={currentProfileId}
        initialKind={profilesKind}
        onLoad={loadProfile}
        onEdit={(p) => {
          // Edit mode: load the contact text and jump straight to the
          // contact-info step so the user can correct/extend the data
          // without going through template selection.
          if ((p.kind ?? "card") === "card") {
            setData(p.data);
            setTemplateId(p.templateId || "minimal-white");
            setBackStyleId(p.backStyleId || "qr-split");
          } else {
            setData({
              ...p.data,
              customization: emptyCardData.customization,
              qr2: emptyCardData.qr2,
            });
          }
          setCurrentProfileId(p.id);
          setStep(2); // jump to contact-info input
        }}
        onCreateNewContact={() => {
          // Create a fresh blank "contact list" entry — empty data,
          // jumps to contact-info input. User saves later as contact
          // (uncheck "デザインも保存") to keep it text-only.
          setData(emptyCardData);
          setCurrentProfileId(null);
          setCurrentDraftId(null);
          setStep(2);
        }}
        onSavedAs={onProfileSaved}
      />
    </div>
  );
}

function MobilePreview({
  data,
  templateId,
  step,
  isLastStep,
  onJumpToImage,
}: {
  data: CardData;
  templateId: string;
  step: number;
  isLastStep: boolean;
  onJumpToImage: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (step === 1 || isLastStep) return null;
  const isImageTemplate =
    templateId.startsWith("photo-") ||
    templateId.startsWith("vertical-photo") ||
    templateId === "custom-background";
  return (
    <div className="lg:hidden fixed top-16 right-3 z-40 flex flex-col items-end pointer-events-none">
      {open && (
        <div className="mb-2 bg-white rounded-xl shadow-2xl p-3 border border-neutral-200 pointer-events-auto">
          <div
            onDoubleClick={isImageTemplate ? onJumpToImage : undefined}
            style={{
              transform: "scale(0.65)",
              transformOrigin: "top right",
              width: "91mm",
              height: "55mm",
              cursor: isImageTemplate ? "pointer" : "default",
            }}
          >
            <CardRenderer data={data} templateId={templateId} />
          </div>
          {isImageTemplate && (
            <div className="text-[9px] text-violet-600 mt-1 text-center font-semibold">
              💡 ダブルタップで画像位置変更
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-neutral-900 text-white text-xs font-medium px-3 py-1.5 shadow-lg flex items-center gap-2 pointer-events-auto"
      >
        {open ? "閉じる" : "👀 見る"}
      </button>
    </div>
  );
}
