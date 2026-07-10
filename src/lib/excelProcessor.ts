import * as XLSX from "xlsx";
import type { ParticipantData, SkillScores } from "@/types/survey";
import { SKILL_KEYS } from "@/types/survey";

const NAME_HEADER_CANDIDATES = ["お名前", "氏名", "名前"];

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** ヘッダーセルの先頭が "1." "2." 等の設問番号かどうかを判定し、番号を返す */
function leadingQuestionNumber(header: unknown): number | null {
  if (typeof header !== "string") return null;
  const m = header.trim().match(/^(\d+)\s*[.．]/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * ヘッダー行から氏名列のインデックスを探す。
 * 見つからない場合は列Aを氏名列とみなす（後方互換）。
 */
function findNameColumn(header: unknown[]): number {
  const idx = header.findIndex(
    (h) => typeof h === "string" && NAME_HEADER_CANDIDATES.includes(h.trim())
  );
  return idx >= 0 ? idx : 0;
}

/**
 * ヘッダー行の中から「1.〜20. と連番が振られた設問が20列連続する」
 * ブロックを自動検出する。Googleフォームの生データではタイムスタンプ／
 * メールアドレス列や、本来のコンピテンシー設問より前にある別の設問群
 * （ストレスチェック等、1〜18で連番）が混在するが、それらは長さが
 * 20に満たないため除外され、20問連続するコンピテンシー設問ブロックのみが選ばれる。
 */
function findScoreColumns(header: unknown[]): number[] {
  const runs: number[][] = [];
  let current: number[] = [];
  let expected = 1;

  for (let i = 0; i < header.length; i++) {
    const n = leadingQuestionNumber(header[i]);
    if (n === expected) {
      current.push(i);
      expected++;
    } else if (n === 1) {
      if (current.length > 0) runs.push(current);
      current = [i];
      expected = 2;
    } else {
      if (current.length > 0) runs.push(current);
      current = [];
      expected = 1;
    }
  }
  if (current.length > 0) runs.push(current);

  const candidates = runs.filter((r) => r.length >= 20);
  const chosen =
    candidates.length > 0
      ? candidates[candidates.length - 1]
      : runs.reduce((a, b) => (b.length > a.length ? b : a), [] as number[]);

  return chosen.slice(0, 20);
}

function averageColumns(row: unknown[], columns: number[]): number {
  const values: number[] = [];
  for (const i of columns) {
    const v = row[i];
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (v !== null && v !== undefined && v !== "" && !Number.isNaN(n)) {
      values.push(n);
    }
  }
  if (values.length === 0) return 0;
  return round2(values.reduce((a, b) => a + b, 0) / values.length);
}

function rowToScores(row: unknown[], scoreColumns: number[]): SkillScores {
  const scores = {} as SkillScores;
  SKILL_KEYS.forEach((key, i) => {
    const columns = scoreColumns.slice(i * 4, i * 4 + 4);
    scores[key] = averageColumns(row, columns);
  });
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
  if (rows.length === 0) return result;

  const header = rows[0] ?? [];
  const nameCol = findNameColumn(header);
  const scoreColumns = findScoreColumns(header);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const name = String(row[nameCol] ?? "").trim();
    if (!name) continue;
    result.set(name, rowToScores(row, scoreColumns));
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
