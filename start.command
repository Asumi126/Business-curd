#!/bin/bash
# My Card Maker — ワンクリック起動スクリプト
# 使い方: このファイルを Finder でダブルクリック

set -e

# このスクリプトのある場所に移動
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/web"

# 起動メッセージ
clear
cat <<'BANNER'
╔════════════════════════════════════════════╗
║                                            ║
║       🪪  My Card Maker 起動中...          ║
║                                            ║
╚════════════════════════════════════════════╝

このまま少しお待ちください。
ブラウザが自動で開いて、名刺メーカーが起動します。

【困ったとき】
- 何も起きない場合: Safari や Chrome で
  http://localhost:3000 を開いてください
- 終了するとき: このウィンドウで Control+C を押してください
- ウィンドウは閉じないでください（閉じるとアプリも止まります）

BANNER

# Node.js が入っているか確認
if ! command -v node &> /dev/null; then
  cat <<'NOERR'
❌ エラー: Node.js が見つかりません

Node.js のインストールが必要です。
以下のサイトから「LTS」版をダウンロードしてインストールしてください：
https://nodejs.org/ja/

インストールが終わったら、もう一度このファイルをダブルクリックしてください。
NOERR
  read -p "Enterキーを押すと閉じます..."
  exit 1
fi

# 依存ライブラリが入っていない場合はインストール
if [ ! -d "node_modules" ]; then
  echo "📦 初回起動：必要なライブラリをインストールしています..."
  echo "（数分かかることがあります）"
  echo ""
  npm install
  echo ""
fi

# サーバーを起動して、起動完了したらブラウザを開く
(
  # 数秒待ってブラウザを起動
  sleep 4
  open "http://localhost:3000"
) &

echo "🚀 サーバーを起動中..."
echo ""
npm run dev
