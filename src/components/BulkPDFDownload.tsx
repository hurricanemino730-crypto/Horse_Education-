import { useState } from "react";
import JSZip from "jszip";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ParticipantData } from "@/types/survey";
import { buildPdf } from "@/utils/pdf";

interface Props {
  participants: ParticipantData[];
  implementationDate: string;
  /** 指定インデックスの参加者を表示し、描画完了まで待つ */
  selectParticipant: (index: number) => Promise<void>;
  getPage1: () => HTMLElement | null;
  getPage2: () => HTMLElement | null;
  getComment: (index: number) => string | undefined;
}

export function BulkPDFDownload({
  participants,
  implementationDate,
  selectParticipant,
  getPage1,
  getPage2,
  getComment,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBulkDownload = async () => {
    if (participants.length === 0) return;
    setProcessing(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      for (let i = 0; i < participants.length; i++) {
        await selectParticipant(i);
        const page1 = getPage1();
        if (!page1) throw new Error("評価シートが見つかりません");
        const hasComment = Boolean(getComment(i));
        const pdf = await buildPdf(page1, hasComment ? getPage2() : null);
        zip.file(
          `評価シート_${participants[i].name}.pdf`,
          pdf.output("blob")
        );
        setProgress(i + 1);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `評価シート一括_${implementationDate}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${participants.length}名分のPDFをZIPでダウンロードしました`);
    } catch (e) {
      console.error(e);
      toast.error("一括PDF生成に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleBulkDownload}
      disabled={processing || participants.length === 0}
    >
      {processing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          生成中… {progress}/{participants.length}
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          全員分PDF一括ダウンロード
        </>
      )}
    </Button>
  );
}
