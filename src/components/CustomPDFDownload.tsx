import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildPdf, todayString } from "@/utils/pdf";

interface Props {
  participantName: string;
  hasEvaluation: boolean;
  getPage1: () => HTMLElement | null;
  getPage2: () => HTMLElement | null;
}

export function CustomPDFDownload({
  participantName,
  hasEvaluation,
  getPage1,
  getPage2,
}: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const page1 = getPage1();
    if (!page1) {
      toast.error("評価シートが見つかりません");
      return;
    }
    setDownloading(true);
    try {
      const pdf = await buildPdf(page1, hasEvaluation ? getPage2() : null);
      pdf.save(`評価シート_${participantName}_${todayString()}.pdf`);
      toast.success("PDFをダウンロードしました");
    } catch (e) {
      console.error(e);
      toast.error("PDF生成に失敗しました");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={downloading}>
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      A4 PDFダウンロード
    </Button>
  );
}
