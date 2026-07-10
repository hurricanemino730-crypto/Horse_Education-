# Horse Education Program 研修評価分析Webアプリ

会社研修（Horse Education Program）の研修前 / 研修後アンケート結果（Excel）をアップロードし、参加者ごとの5つのコンピテンシー（Being / Thinking / Relating / Collaborating / Acting）の変化をレーダーチャートで可視化、AIで総合評価コメントを自動生成し、A4サイズのPDFとしてダウンロードできる社内ツールです。

**公開URL**: https://hurricanemino730-crypto.github.io/Horse_Education-/

## 使い方

1. 研修前・研修後のアンケートExcelをそれぞれアップロードし、同じ画面内で「所属」「講師」「研修プログラム」を入力（受講者名以外の基本情報はここで入力し、出力画面側では編集不要）
2. 「データを分析」→ 参加者一覧が生成され、表示中の参加者のAI総合評価が自動で生成される（Gemini APIキー未設定の場合は入力ダイアログが表示される）
3. 参加者を切り替えると、その参加者の総合評価がまだ無ければ自動で生成される
4. レーダーチャート・参考指標テーブル・AI総合評価（Being〜Actingのカテゴリ別コメント＋全体まとめ文）は画面上でそのまま直接編集可能
5. 2ページ目下部の「チームからのメッセージ」欄に、担当スタッフが参加者へのメッセージを手動で記入（AI生成ではない自由記述）
6. 「A4 PDFダウンロード」で個別PDFを出力

## Excel フォーマット

Googleフォームのエクスポート結果（タイムスタンプ・メールアドレス列や、コンピテンシー設問より前にある別の設問群を含む生データ）を**加工せずそのまま**アップロードできます。

- 行1: ヘッダー行、行2以降: 参加者1名につき1行
- 氏名列: ヘッダーが「お名前」「氏名」「名前」のいずれかの列を自動検出（見つからない場合は列Aを使用）
- コンピテンシー設問列: ヘッダーが `1.` `2.` … `20.` と連番になっている、**20列連続するブロック**を自動検出（Being→Thinking→Relating→Collaborating→Actingの順に4問ずつ）。設問文の内容やヘッダーの表記ゆれは問わない
- 上記以外の列（タイムスタンプ、メールアドレス、コンピテンシー設問より前後にある別の設問群など）は自動的に無視される
- 各カテゴリは null/空欄 を除外した平均値（小数第2位で四捨五入）

### サンプルデータ

動作確認用のサンプルExcelを同梱しています：[sample-pre.xlsx](public/sample-pre.xlsx) / [sample-post.xlsx](public/sample-post.xlsx)（公開サイトでは `/Horse_Education-/sample-pre.xlsx` からダウンロード可能）

## セットアップ

```bash
npm install
cp .env.example .env   # Gemini APIキーを設定（任意）
npm run dev            # 開発サーバー
npm run build          # 本番ビルド → dist/
```

## AI 総合評価

Google Gemini（gemini-2.5-pro）のみを使用します。APIキーは以下の優先順で使用されます：

1. `.env` の `VITE_GEMINI_API_KEY`
2. 画面上のダイアログで入力（localStorage に保存）

参加者を表示すると、その参加者の総合評価が未生成であれば自動でAPIを呼び出します（手動生成ボタンはありません）。AIはJSON形式で「Being〜Actingの5カテゴリ別コメント」と「全体まとめ文」を生成し、出力後は総合評価ページ上でそのまま直接編集できます。

アップロードカード右上の「Gemini APIキーを設定」ボタンから、Excelをアップロードする前でもいつでもキーを入力・変更できます。[Google AI Studio](https://aistudio.google.com/apikey) でGoogleアカウントにログインし、無料で取得できます。

> **注意**: `.env` のキーはビルド後の JS に埋め込まれます。公開サイトでは「ユーザーが自分のキーを入力する」方式を推奨します。

## デプロイ（GitHub Pages）

```bash
npm run deploy   # vite build && gh-pages -d dist
```

`gh-pages` ブランチに `dist/` を push し、リポジトリの Settings → Pages → Source を `gh-pages` ブランチに設定してください。

## 技術スタック

React 18 / Vite 5 / TypeScript 5 / Tailwind CSS 3 / recharts / xlsx (SheetJS) / jsPDF + html2canvas / lucide-react / sonner
