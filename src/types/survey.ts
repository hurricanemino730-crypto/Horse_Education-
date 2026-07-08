export interface SkillScores {
  being: number;
  thinking: number;
  relating: number;
  collaborating: number;
  acting: number;
}

export interface ParticipantData {
  name: string;
  preTraining?: SkillScores;
  postTraining?: SkillScores;
  improvement?: SkillScores;
  aiComment?: string;
}

export type SkillKey = keyof SkillScores;

export const SKILL_KEYS: SkillKey[] = [
  "being",
  "thinking",
  "relating",
  "collaborating",
  "acting",
];

export const SKILL_LABELS: Record<SkillKey, { en: string; ja: string; subtitle: string }> = {
  being: { en: "Being", ja: "自分のあり方", subtitle: "自分を整える力" },
  thinking: { en: "Thinking", ja: "考える力", subtitle: "考える力" },
  relating: { en: "Relating", ja: "つながりを築く力", subtitle: "つながりを築く力" },
  collaborating: { en: "Collaborating", ja: "協働する力", subtitle: "協働する力" },
  acting: { en: "Acting", ja: "行動する力", subtitle: "行動する力" },
};
