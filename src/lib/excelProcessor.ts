import * as XLSX from "xlsx";
import type { ParticipantData, SkillScores } from "@/types/survey";
import { SKILL_KEYS } from "@/types/survey";

// 列マッピング（0-indexed）: A=氏名, D-G=Being, H-K=Thinking, L-O=Relating, P-S=Collaborating, T-W=Acting
// B・C列（メール等のメタ）は sheet 読み込み時に除外済みの並びで、index 1 から4問ずつ読む
const CATEGORY_RANGES: Record<keyof SkillScores, [number, number]> = {
  being: [1, 4],
  thinking: [5, 8],
  relating: [9, 12],
  collaborating: [13, 16],
  acting: [17, 20],
};

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function averageRange(row: unknown[], start: number, end: number): number {
  const values: number[] = [];
  for (let i = start; i <= end; i++) {
    const v = row[i];
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (v !== null && v !== undefined && v !== "" && !Number.isNaN(n)) {
      values.push(n);
    }
  }
  if (values.length === 0) return 0;
  return round2(values.reduce((a, b) => a + b, 0) / values.length);
}

function rowToScores(row: unknown[]): SkillScores {
  const scores = {} as SkillScores;
  for (const key of SKILL_KEYS) {
    const [start, end] = CATEGORY_RANGES[key];
    scores[key] = averageRange(row, start, end);
  }
  return scores;
}

export async function parseExcelFile(
  file: File
): Promise<Map<string, SkillScores>> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const result = new Map<string, SkillScores>();
  // 行1はヘッダーなのでスキップ
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const name = String(row[0] ?? "").trim();
    if (!name) continue;
    result.set(name, rowToScores(row));
  }
  return result;
}

export function mergeParticipants(
  pre: Map<string, SkillScores>,
  post: Map<string, SkillScores>
): ParticipantData[] {
  const names = new Set<string>([...pre.keys(), ...post.keys()]);
  const participants: ParticipantData[] = [];

  for (const name of names) {
    const preTraining = pre.get(name);
    const postTraining = post.get(name);
    let improvement: SkillScores | undefined;
    if (preTraining && postTraining) {
      improvement = {} as SkillScores;
      for (const key of SKILL_KEYS) {
        improvement[key] = round2(postTraining[key] - preTraining[key]);
      }
    }
    participants.push({ name, preTraining, postTraining, improvement });
  }
  return participants;
}
