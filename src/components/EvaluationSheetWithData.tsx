import { useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Bot,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillRadarChart } from "@/components/charts/RadarChart";
import { HorseIllustration } from "@/components/HorseIllustration";
import { CustomPDFDownload } from "@/components/CustomPDFDownload";
import { BulkPDFDownload } from "@/components/BulkPDFDownload";
import { parseExcelFile, mergeParticipants } from "@/lib/excelProcessor";
import {
  generateAIComment,
  getStoredApiKey,
  storeApiKey,
  type AIProvider,
} from "@/lib/aiClient";
import type { ParticipantData } from "@/types/survey";
import { SKILL_KEYS, SKILL_LABELS } from "@/types/survey";
import {
  DEFAULT_REFERENCE_ROWS,
  DEFAULT_BASIC_INFO,
  type ReferenceRow,
} from "@/data/referenceIndicators";

/** `**text**` を <strong> に、改行を <br> に変換して表示する */
function FormattedComment({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm leading-relaxed">
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        const content = bold ? bold[1] : part;
        const lines = content.split("\n");
        const rendered = lines.map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {line}
          </span>
        ));
        return bold ? <strong key={i}>{rendered}</strong> : <span key={i}>{rendered}</span>;
      })}
    </p>
  );
}

function ImprovementCell({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-gray-400">—</span>;
  if (value > 0) return <span className="font-semibold text-green-700">+{value}</span>;
  if (value < 0) return <span className="font-semibold text-red-600">{value}</span>;
  return <span className="text-gray-500">0</span>;
}

export function EvaluationSheetWithData() {
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [basicInfo, setBasicInfo] = useState(DEFAULT_BASIC_INFO);
  const [referenceRows, setReferenceRows] = useState<ReferenceRow[]>(
    DEFAULT_REFERENCE_ROWS
  );

  const [provider, setProvider] = useState<AIProvider>("openai");
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [editingComment, setEditingComment] = useState(false);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<ParticipantData[]>(participants);
  participantsRef.current = participants;

  const current = participants[currentIndex];

  const handleAnalyze = async () => {
    if (!preFile && !postFile) {
      toast.error("研修前または研修後のExcelファイルをアップロードしてください");
      return;
    }
    setAnalyzing(true);
    try {
      const pre = preFile ? await parseExcelFile(preFile) : new Map();
      const post = postFile ? await parseExcelFile(postFile) : new Map();
      const merged = mergeParticipants(pre, post);
      if (merged.length === 0) {
        toast.error("参加者データが見つかりませんでした");
        return;
      }
      setParticipants(merged);
      setCurrentIndex(0);
      toast.success(`${merged.length}名の参加者データを分析しました`);
    } catch (e) {
      console.error(e);
      toast.error("Excelの読み込みに失敗しました");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateComment = async () => {
    if (!current) return;
    let apiKey = getStoredApiKey(provider);
    if (!apiKey) {
      setShowKeyDialog(true);
      return;
    }
    setGenerating(true);
    try {
      const comment = await generateAIComment(current, provider, apiKey);
      setParticipants((prev) =>
        prev.map((p, i) => (i === currentIndex ? { ...p, aiComment: comment } : p))
      );
      toast.success("総合評価コメントを生成しました");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "AIコメント生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    storeApiKey(provider, keyInput.trim());
    setKeyInput("");
    setShowKeyDialog(false);
    toast.success("APIキーを保存しました");
    handleGenerateComment();
  };

  const selectParticipantAndWait = async (index: number) => {
    setCurrentIndex(index);
    await new Promise((resolve) => setTimeout(resolve, 400));
  };

  const updateReference = (
    rowIndex: number,
    field: "preHigher" | "postHigher",
    value: string
  ) => {
    setReferenceRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row))
    );
  };

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-8 font-japanese">
      {/* アップロードセクション */}
      <Card className="mx-auto mb-8 max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            アンケートExcelのアップロード
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pre-file" className="flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                研修前アンケート
              </Label>
              <Input
                id="pre-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setPreFile(e.target.files?.[0] ?? null)}
              />
              {preFile && <p className="text-xs text-muted-foreground">{preFile.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-file" className="flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                研修後アンケート
              </Label>
              <Input
                id="post-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setPostFile(e.target.files?.[0] ?? null)}
              />
              {postFile && <p className="text-xs text-muted-foreground">{postFile.name}</p>}
            </div>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            データを分析
          </Button>
        </CardContent>
      </Card>

      {current && (
        <>
          {/* 参加者ナビゲーション + アクション */}
          <div className="mx-auto mb-6 flex max-w-[1000px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[10rem] text-center font-medium">
                {currentIndex + 1} / {participants.length}　{current.name}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(participants.length - 1, i + 1))
                }
                disabled={currentIndex === participants.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="h-10 rounded-md border border-border bg-transparent px-2 text-sm"
              >
                <option value="openai">OpenAI (gpt-4o-mini)</option>
                <option value="gemini">Gemini (gemini-2.5-flash)</option>
              </select>
              <Button onClick={handleGenerateComment} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                総合評価を生成
              </Button>
              <CustomPDFDownload
                participantName={current.name}
                hasComment={Boolean(current.aiComment)}
                getPage1={() => page1Ref.current}
                getPage2={() => page2Ref.current}
              />
              <BulkPDFDownload
                participants={participants}
                implementationDate={basicInfo.date}
                selectParticipant={selectParticipantAndWait}
                getPage1={() => page1Ref.current}
                getPage2={() => page2Ref.current}
                getComment={(i) => participantsRef.current[i]?.aiComment}
              />
            </div>
          </div>

          {/* APIキー入力ダイアログ */}
          {showKeyDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <Card className="w-full max-w-md bg-background">
                <CardHeader>
                  <CardTitle>
                    {provider === "openai" ? "OpenAI" : "Gemini"} APIキーを入力
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    APIキーはこの端末のlocalStorageにのみ保存されます。
                  </p>
                  <Input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={provider === "openai" ? "sk-..." : "AIza..."}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowKeyDialog(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleSaveKey}>保存して生成</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== 評価シート（PDF 1ページ目） ===== */}
          <div
            ref={page1Ref}
            className="mx-auto mb-8 w-[1000px] max-w-full rounded-xl bg-background p-10 shadow-elegant"
            style={{ backgroundColor: "hsl(30 50% 90%)" }}
          >
            {/* ヘッダー */}
            <div className="mb-6 flex items-center justify-between border-b-2 border-primary pb-4">
              <div>
                <h1 className="font-english-title text-3xl font-semibold tracking-wide">
                  Horse Education Program
                </h1>
                <p className="mt-1 text-lg font-medium tracking-[0.3em]">
                  SELF EVALUATION SHEET
                </p>
              </div>
              <div className="flex items-center gap-4">
                <HorseIllustration className="h-16 w-20 text-primary" />
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">研修実施日</p>
                  <Input
                    value={basicInfo.date}
                    onChange={(e) =>
                      setBasicInfo((b) => ({ ...b, date: e.target.value }))
                    }
                    className="h-8 w-28 border-none bg-transparent p-0 text-right text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 1. 基本情報 */}
            <section className="mb-6">
              <h2 className="mb-3 bg-evaluation-header px-3 py-1.5 text-base font-bold">
                1. 基本情報
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-medium">受講者</span>
                  <Input
                    value={current.name}
                    readOnly
                    className="h-8 border-0 border-b border-border bg-transparent px-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-medium">所属</span>
                  <Input
                    value={basicInfo.affiliation}
                    onChange={(e) =>
                      setBasicInfo((b) => ({ ...b, affiliation: e.target.value }))
                    }
                    className="h-8 border-0 border-b border-border bg-transparent px-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-medium">講師</span>
                  <Input
                    value={basicInfo.instructor}
                    onChange={(e) =>
                      setBasicInfo((b) => ({ ...b, instructor: e.target.value }))
                    }
                    className="h-8 border-0 border-b border-border bg-transparent px-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-medium">研修プログラム</span>
                  <Input
                    value={basicInfo.program}
                    onChange={(e) =>
                      setBasicInfo((b) => ({ ...b, program: e.target.value }))
                    }
                    className="h-8 border-0 border-b border-border bg-transparent px-1"
                  />
                </div>
              </div>
            </section>

            {/* 2. 自己評価結果 */}
            <section className="mb-6">
              <h2 className="mb-3 bg-evaluation-header px-3 py-1.5 text-base font-bold">
                2. 自己評価結果
              </h2>
              <div className="grid grid-cols-2 items-center gap-4">
                <div>
                  <SkillRadarChart participant={current} />
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-evaluation-table-header">
                      <th className="border border-evaluation-table-border px-2 py-1.5 text-left">
                        スキル
                      </th>
                      <th className="border border-evaluation-table-border px-2 py-1.5">
                        研修前
                      </th>
                      <th className="border border-evaluation-table-border px-2 py-1.5">
                        研修後
                      </th>
                      <th className="border border-evaluation-table-border px-2 py-1.5">
                        変化
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SKILL_KEYS.map((key) => (
                      <tr key={key}>
                        <td className="border border-evaluation-table-border px-2 py-1.5">
                          <span className="font-medium">{SKILL_LABELS[key].en}</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {SKILL_LABELS[key].ja}
                          </span>
                        </td>
                        <td className="border border-evaluation-table-border px-2 py-1.5 text-center">
                          {current.preTraining?.[key] ?? "—"}
                        </td>
                        <td className="border border-evaluation-table-border px-2 py-1.5 text-center">
                          {current.postTraining?.[key] ?? "—"}
                        </td>
                        <td className="border border-evaluation-table-border px-2 py-1.5 text-center">
                          <ImprovementCell value={current.improvement?.[key]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. 参考指標 */}
            <section>
              <h2 className="mb-3 bg-evaluation-header px-3 py-1.5 text-base font-bold">
                3. 結果を理解するための参考指標
              </h2>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-evaluation-table-header">
                    <th className="w-[14%] border border-evaluation-table-border px-2 py-1.5">
                      カテゴリ
                    </th>
                    <th className="w-[43%] border border-evaluation-table-border px-2 py-1.5">
                      受講前の方がスコアが高い方の傾向
                    </th>
                    <th className="w-[43%] border border-evaluation-table-border px-2 py-1.5">
                      受講後の方がスコアが高い方の傾向
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referenceRows.map((row, i) => (
                    <tr key={row.category}>
                      <td className="border border-evaluation-table-border px-2 py-1.5 text-center">
                        <span className="block font-semibold">{row.category}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {row.subtitle}
                        </span>
                      </td>
                      <td className="border border-evaluation-table-border p-1 align-top">
                        <Textarea
                          value={row.preHigher}
                          onChange={(e) => updateReference(i, "preHigher", e.target.value)}
                          className="min-h-[68px] resize-none border-none bg-transparent p-1 text-xs leading-snug"
                        />
                      </td>
                      <td className="border border-evaluation-table-border p-1 align-top">
                        <Textarea
                          value={row.postHigher}
                          onChange={(e) => updateReference(i, "postHigher", e.target.value)}
                          className="min-h-[68px] resize-none border-none bg-transparent p-1 text-xs leading-snug"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* ===== 総合評価シート（PDF 2ページ目） ===== */}
          {current.aiComment !== undefined && (
            <div
              ref={page2Ref}
              className="mx-auto mb-8 w-[1000px] max-w-full rounded-xl p-10 shadow-elegant"
              style={{ backgroundColor: "hsl(30 50% 90%)" }}
            >
              <div className="mb-6 flex items-center justify-between border-b-2 border-primary pb-4">
                <div>
                  <h1 className="font-english-title text-3xl font-semibold tracking-wide">
                    Horse Education Program
                  </h1>
                  <p className="mt-1 text-lg font-medium tracking-[0.3em]">
                    OVERALL EVALUATION
                  </p>
                </div>
                <HorseIllustration className="h-16 w-20 text-primary" />
              </div>
              <h2 className="mb-3 bg-evaluation-header px-3 py-1.5 text-base font-bold">
                総合評価　—　{current.name}
              </h2>
              {editingComment ? (
                <div className="space-y-2">
                  <Textarea
                    value={current.aiComment}
                    onChange={(e) =>
                      setParticipants((prev) =>
                        prev.map((p, i) =>
                          i === currentIndex ? { ...p, aiComment: e.target.value } : p
                        )
                      )
                    }
                    className="min-h-[400px] bg-white/50 text-sm leading-relaxed"
                  />
                  <Button
                    size="sm"
                    className="no-export"
                    onClick={() => setEditingComment(false)}
                  >
                    編集を終了
                  </Button>
                </div>
              ) : (
                <div
                  className="min-h-[200px] cursor-text rounded-md p-2 hover:bg-white/30"
                  onClick={() => setEditingComment(true)}
                  title="クリックで編集"
                >
                  <FormattedComment text={current.aiComment} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
