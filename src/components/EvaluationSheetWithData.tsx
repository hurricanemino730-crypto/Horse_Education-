import { useEffect, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillRadarChart } from "@/components/charts/RadarChart";
import { CustomPDFDownload } from "@/components/CustomPDFDownload";
import { parseExcelFile, mergeParticipants } from "@/lib/excelProcessor";
import {
  generateAIEvaluation,
  getStoredApiKey,
  storeApiKey,
} from "@/lib/aiClient";
import type { ParticipantData } from "@/types/survey";
import { SKILL_LABELS } from "@/types/survey";
import {
  DEFAULT_REFERENCE_ROWS,
  DEFAULT_BASIC_INFO,
  type ReferenceRow,
} from "@/data/referenceIndicators";

const EVALUATION_CATEGORY_KEYS = [
  "being",
  "thinking",
  "relating",
  "collaborating",
  "acting",
] as const;

/** 編集可能な1行分のフィールド（画面では常時編集可、PDF出力時のみプレーンテキストに切り替える） */
function EditableField({
  value,
  onChange,
  multiline = false,
  inputClassName = "",
  textClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  inputClassName?: string;
  textClassName?: string;
}) {
  return (
    <>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`no-export resize-none border-none bg-transparent p-1 ${inputClassName}`}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`no-export border-none bg-transparent p-1 ${inputClassName}`}
        />
      )}
      <div className={`export-only whitespace-pre-line p-1 ${textClassName}`}>
        {value}
      </div>
    </>
  );
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

  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const attemptedRef = useRef<Set<number>>(new Set());

  const current = participants[currentIndex];

  const updateCurrent = (patch: Partial<ParticipantData>) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === currentIndex ? { ...p, ...patch } : p))
    );
  };

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
      attemptedRef.current.clear();
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

  const generateForIndex = async (index: number) => {
    const target = participants[index];
    if (!target) return;
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setShowKeyDialog(true);
      return;
    }
    setGenerating(true);
    try {
      const evaluation = await generateAIEvaluation(target, apiKey);
      setParticipants((prev) =>
        prev.map((p, i) => (i === index ? { ...p, aiEvaluation: evaluation } : p))
      );
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "AI総合評価の生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  // ファイルをアップロードして参加者が表示されたら、自動でAI総合評価を生成する
  useEffect(() => {
    if (!current || current.aiEvaluation) return;
    if (attemptedRef.current.has(currentIndex)) return;
    if (!getStoredApiKey()) {
      setShowKeyDialog(true);
      return;
    }
    attemptedRef.current.add(currentIndex);
    void generateForIndex(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, current]);

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    storeApiKey(keyInput.trim());
    setKeyInput("");
    setShowKeyDialog(false);
    toast.success("APIキーを保存しました");
    attemptedRef.current.add(currentIndex);
    void generateForIndex(currentIndex);
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

  const SheetHeader = ({
    subtitleJa,
    subtitleEn,
  }: {
    subtitleJa: string;
    subtitleEn: string;
  }) => (
    <div className="mb-6 flex items-end justify-between border-b-2 border-primary pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-wide">
          Horse&nbsp;&nbsp;Education Program
        </h1>
        <p className="mt-1 text-xl font-bold">{subtitleJa}</p>
        <p className="text-xs font-medium tracking-[0.25em] text-muted-foreground">
          {subtitleEn}
        </p>
      </div>
      <div className="text-right text-sm">
        <p>
          <span className="text-muted-foreground">実施日　：</span>
          <EditableFieldInline
            value={basicInfo.date}
            onChange={(v) => setBasicInfo((b) => ({ ...b, date: v }))}
          />
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">実施場所：</span>
          <EditableFieldInline
            value={basicInfo.venue}
            onChange={(v) => setBasicInfo((b) => ({ ...b, venue: v }))}
          />
        </p>
      </div>
    </div>
  );

  const BasicInfoTable = () => (
    <section className="mb-6">
      <h2 className="mb-3 bg-evaluation-header px-3 py-1.5 text-base font-bold">
        1. 基本情報
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-sm">
        <table className="w-full table-fixed border-collapse">
          <tbody>
            <tr>
              <td className="w-32 whitespace-nowrap border border-evaluation-table-border bg-evaluation-table-header px-3 py-2 font-medium">
                受講者
              </td>
              <td className="border border-evaluation-table-border px-3 py-2">
                {current?.name} 様
              </td>
            </tr>
            <tr>
              <td className="w-32 whitespace-nowrap border border-evaluation-table-border bg-evaluation-table-header px-3 py-2 font-medium">
                所属
              </td>
              <td className="border border-evaluation-table-border px-1 py-1">
                <EditableFieldInline
                  value={basicInfo.affiliation}
                  onChange={(v) => setBasicInfo((b) => ({ ...b, affiliation: v }))}
                  widthClassName="w-full"
                  placeholder="所属を入力"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <table className="w-full table-fixed border-collapse">
          <tbody>
            <tr>
              <td className="w-32 whitespace-nowrap border border-evaluation-table-border bg-evaluation-table-header px-3 py-2 font-medium">
                講師
              </td>
              <td className="border border-evaluation-table-border px-1 py-1">
                <EditableFieldInline
                  value={basicInfo.instructor}
                  onChange={(v) => setBasicInfo((b) => ({ ...b, instructor: v }))}
                  widthClassName="w-full"
                  placeholder="講師名を入力"
                />
              </td>
            </tr>
            <tr>
              <td className="w-32 whitespace-nowrap border border-evaluation-table-border bg-evaluation-table-header px-3 py-2 font-medium">
                研修プログラム
              </td>
              <td className="border border-evaluation-table-border px-1 py-1">
                <EditableFieldInline
                  value={basicInfo.program}
                  onChange={(v) => setBasicInfo((b) => ({ ...b, program: v }))}
                  widthClassName="w-full"
                  placeholder="研修プログラム名を入力"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );

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
            <div className="flex flex-wrap items-center gap-3">
              {generating && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI総合評価を生成中…
                </span>
              )}
              <CustomPDFDownload
                participantName={current.name}
                hasEvaluation={Boolean(current.aiEvaluation)}
                getPage1={() => page1Ref.current}
                getPage2={() => page2Ref.current}
              />
            </div>
          </div>

          {/* APIキー入力ダイアログ */}
          {showKeyDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <Card className="w-full max-w-md bg-background">
                <CardHeader>
                  <CardTitle>Gemini APIキーを入力</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    APIキーはこの端末のlocalStorageにのみ保存されます。
                  </p>
                  <Input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="AIza..."
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
            <SheetHeader subtitleJa="自己評価" subtitleEn="SELF EVALUATION" />
            <BasicInfoTable />

            {/* 2. 自己評価結果 */}
            <section className="mb-6">
              <h2 className="mb-3 bg-evaluation-header px-3 py-1.5 text-base font-bold">
                2. 自己評価結果
              </h2>
              <SkillRadarChart participant={current} />
            </section>

            {/* 3. 参考指標 */}
            <section>
              <h2 className="mb-3 bg-evaluation-header px-3 py-1.5 text-base font-bold">
                3. 結果を理解するための参考指標
              </h2>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="w-[14%] border border-evaluation-table-border bg-evaluation-table-header px-2 py-1.5">
                      カテゴリ
                    </th>
                    <th className="w-[43%] border border-evaluation-table-border bg-chart-pre-bg px-2 py-1.5">
                      受講前の方がスコアが高い方の傾向
                    </th>
                    <th className="w-[43%] border border-evaluation-table-border bg-chart-post-bg px-2 py-1.5">
                      受講後の方がスコアが高い方の傾向
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referenceRows.map((row, i) => (
                    <tr key={row.category}>
                      <td className="border border-evaluation-table-border bg-evaluation-table-header px-2 py-1.5 text-center">
                        <span className="block font-semibold">{row.category}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {row.subtitle}
                        </span>
                      </td>
                      <td className="border border-evaluation-table-border bg-chart-pre-bg p-1 align-top">
                        <EditableField
                          value={row.preHigher}
                          onChange={(v) => updateReference(i, "preHigher", v)}
                          multiline
                          inputClassName="min-h-[68px] text-xs leading-snug"
                          textClassName="text-xs leading-snug"
                        />
                      </td>
                      <td className="border border-evaluation-table-border bg-chart-post-bg p-1 align-top">
                        <EditableField
                          value={row.postHigher}
                          onChange={(v) => updateReference(i, "postHigher", v)}
                          multiline
                          inputClassName="min-h-[68px] text-xs leading-snug"
                          textClassName="text-xs leading-snug"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* ===== 総合評価シート（PDF 2ページ目） ===== */}
          {current.aiEvaluation && (
            <div
              ref={page2Ref}
              className="mx-auto mb-8 w-[1000px] max-w-full rounded-xl p-10 shadow-elegant"
              style={{ backgroundColor: "hsl(30 50% 90%)" }}
            >
              <SheetHeader subtitleJa="総合評価" subtitleEn="COMPREHENSIVE EVALUATION" />
              <BasicInfoTable />

              <h2 className="mb-3 text-xl font-bold">総合評価</h2>
              <table className="mb-4 w-full border-collapse text-sm">
                <tbody>
                  {EVALUATION_CATEGORY_KEYS.map((key) => (
                    <tr key={key}>
                      <td className="w-40 border border-evaluation-table-border bg-evaluation-table-header px-3 py-3 align-top">
                        <span className="block font-bold">{SKILL_LABELS[key].en}</span>
                        <span className="text-xs text-muted-foreground">
                          {SKILL_LABELS[key].subtitle}
                        </span>
                      </td>
                      <td className="border border-evaluation-table-border p-1 align-top leading-relaxed">
                        <EditableField
                          value={current.aiEvaluation![key]}
                          onChange={(v) =>
                            updateCurrent({
                              aiEvaluation: { ...current.aiEvaluation!, [key]: v },
                            })
                          }
                          multiline
                          inputClassName="min-h-[90px] text-sm leading-relaxed"
                          textClassName="text-sm leading-relaxed"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mb-6 text-sm leading-relaxed">
                <EditableField
                  value={current.aiEvaluation.summary}
                  onChange={(v) =>
                    updateCurrent({
                      aiEvaluation: { ...current.aiEvaluation!, summary: v },
                    })
                  }
                  multiline
                  inputClassName="min-h-[140px] text-sm leading-relaxed"
                  textClassName="text-sm leading-relaxed"
                />
              </div>

              {/* チームからのメッセージ（スタッフが手動で記入する自由記述） */}
              <div className="rounded-md border border-evaluation-table-border p-4">
                <p
                  className="mb-2 font-bold tracking-wide"
                  style={{ fontFeatureSettings: "normal" }}
                >
                  【チームからのメッセージ】
                </p>
                <div className="mb-2 w-40">
                  <EditableField
                    value={current.teamMessage?.author ?? ""}
                    onChange={(v) =>
                      updateCurrent({
                        teamMessage: {
                          author: v,
                          body: current.teamMessage?.body ?? "",
                        },
                      })
                    }
                    inputClassName="text-sm font-medium"
                    textClassName="text-sm font-medium"
                  />
                </div>
                <div className="text-sm leading-relaxed">
                  <EditableField
                    value={current.teamMessage?.body ?? ""}
                    onChange={(v) =>
                      updateCurrent({
                        teamMessage: {
                          author: current.teamMessage?.author ?? "",
                          body: v,
                        },
                      })
                    }
                    multiline
                    inputClassName="min-h-[100px] text-sm leading-relaxed"
                    textClassName="text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** ヘッダー右上・基本情報欄などインラインで使う1行の編集フィールド */
function EditableFieldInline({
  value,
  onChange,
  widthClassName = "w-32",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  widthClassName?: string;
  placeholder?: string;
}) {
  return (
    <>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`no-export inline-block border-b border-border bg-transparent px-1 text-sm focus-visible:outline-none ${widthClassName}`}
      />
      <span className="export-only-inline">{value}</span>
    </>
  );
}
