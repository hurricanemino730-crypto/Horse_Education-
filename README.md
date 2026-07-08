# Horse Education Program 研修評価分析Webアプリ

会社研修（Horse Education Program）の研修前 / 研修後アンケート結果（Excel）をアップロードし、参加者ごとの5つのコンピテンシー（Being / Thinking / Relating / Collaborating / Acting）の変化をレーダーチャートで可視化、AIで総合評価コメントを生成し、A4サイズのPDFとしてダウンロードできる社内ツールです。

**公開URL**: https://hurricanemino730-crypto.github.io/Horse_Education-/

## 使い方

1. 研修前・研修後のアンケートExcelをそれぞれアップロード
2. 「データを分析」→ 参加者一覧が生成される
3. 参加者を切り替えながらレーダーチャート・スコア表・参考指標テーブルを確認（基本情報・参考指標は編集可能）
4. 「総合評価を生成」で AI コメントを取得（クリックで編集可能）
5. 「A4 PDFダウンロード」で個別PDF、「全員分PDF一括ダウンロード」でZIP出力

## Excel フォーマット

- 行1: ヘッダー（スキップ）、行2以降: 参加者1名につき1行
- A列: 参加者氏名（必須）
- D–G: Being / H–K: Thinking / L–O: Relating / P–S: Collaborating / T–W: Acting（各4問の数値）
- 各カテゴリは null/空欄 を除外した平均値（小数第2位で四捨五入）

### サンプルデータ

動作確認用のサンプルExcelを同梱しています：[sample-pre.xlsx](public/sample-pre.xlsx) / [sample-post.xlsx](public/sample-post.xlsx)（公開サイトでは `/Horse_Education-/sample-pre.xlsx` からダウンロード可能）

## セットアップ

```bash
npm install
cp .env.example .env   # APIキーを設定（任意）
npm run dev            # 開発サーバー
npm run build          # 本番ビルド → dist/
```

## AI 総合評価

OpenAI（gpt-4o-mini）または Google Gemini（gemini-2.5-flash）を画面上で選択できます。APIキーは以下の優先順で使用されます：

1. `.env` の `VITE_OPENAI_API_KEY` / `VITE_GEMINI_API_KEY`
2. 画面上のダイアログで入力（localStorage に保存）

> **注意**: `.env` のキーはビルド後の JS に埋め込まれます。公開サイトでは「ユーザーが自分のキーを入力する」方式を推奨します。

## デプロイ（GitHub Pages）

```bash
npm run deploy   # vite build && gh-pages -d dist
```

`gh-pages` ブランチに `dist/` を push し、リポジトリの Settings → Pages → Source を `gh-pages` ブランチに設定してください。

## 技術スタック

React 18 / Vite 5 / TypeScript 5 / Tailwind CSS 3 / recharts / xlsx (SheetJS) / jsPDF + html2canvas / JSZip / lucide-react / sonner
