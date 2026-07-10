import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  PAGE_W,
  PAGE_H,
  CANVAS_SCALE,
  PAGE_MARGIN,
  PAGE_BACKGROUND,
} from "./pdf-constants";

/** ページ全体をシートと同じ背景色で塗りつぶす（jsPDFの既定は白のため、
 * これをしないと余白部分が白く浮いて印刷時に目立ってしまう） */
function fillPageBackground(pdf: jsPDF): void {
  pdf.setFillColor(PAGE_BACKGROUND);
  pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
}

/**
 * 要素に .exporting クラスを付与して 1000x1414px に固定し、
 * html2canvas でラスタライズする（DPR 非依存の固定スケール）。
 */
export async function rasterizeToCanvas(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  element.classList.add("exporting");
  // レイアウト反映を待つ
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));
  try {
    const canvas = await html2canvas(element, {
      scale: CANVAS_SCALE,
      width: PAGE_W,
      height: PAGE_H,
      windowWidth: PAGE_W,
      backgroundColor: "#f2e8dc",
      useCORS: true,
      logging: false,
    });
    return canvas;
  } finally {
    element.classList.remove("exporting");
  }
}

/**
 * 評価シート（1ページ目）と総合評価（2ページ目・任意）から A4比 PDF を生成する。
 */
export async function buildPdf(
  page1: HTMLElement,
  page2?: HTMLElement | null
): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: "p",
    unit: "px",
    format: [PAGE_W, PAGE_H],
  });

  fillPageBackground(pdf);
  const canvas1 = await rasterizeToCanvas(page1);
  pdf.addImage(
    canvas1.toDataURL("image/png"),
    "PNG",
    PAGE_MARGIN,
    PAGE_MARGIN,
    PAGE_W - PAGE_MARGIN * 2,
    PAGE_H - PAGE_MARGIN * 2
  );

  if (page2) {
    const canvas2 = await rasterizeToCanvas(page2);
    pdf.addPage([PAGE_W, PAGE_H], "p");
    fillPageBackground(pdf);
    pdf.addImage(
      canvas2.toDataURL("image/png"),
      "PNG",
      PAGE_MARGIN,
      PAGE_MARGIN,
      PAGE_W - PAGE_MARGIN * 2,
      PAGE_H - PAGE_MARGIN * 2
    );
  }

  return pdf;
}

export function todayString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
