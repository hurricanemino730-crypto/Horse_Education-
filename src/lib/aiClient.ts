import type { AIEvaluation, ParticipantData } from "@/types/survey";

const SYSTEM_PROMPT = `あなたはHorse Educationプログラムの専門評価者です。参加者の研修前後のスキル評価データを分析し、成長に焦点を当てた建設的で前向きなフィードバックを提供してください。
5つのスキル領域について分析します：
1. Being（自分のあり方）- 内なるコンパス、誠実さ、オープンさ、自己理解、プレゼンス
2. Thinking（考える力）- クリティカル・シンキング、複雑さの認識、パースペクティブ・スキル、センス-メイキング、長期志向
3. Relating（つながりを築く力）- 感謝、つながりの感覚、謙虚さ、共感と思いやり
4. Collaborating（協働する力）- コミュニケーション、共創、インクルーシブ・マインドセット、信頼、集団を動かすスキル
5. Acting（行動する力）- 勇気、創造性、楽観性、粘り強さ
スコアが下がった場合の解釈指標：
- Being: 受講前→自己実現状態、受講後→学習・成長への意欲と主体性の芽生え
- Thinking: 受講前→既存の判断力、受講後→批判的思考と全体最適思考への変容
- Relating: 受講前→基本的な感謝・思いやり、受講後→より深いつながりの意識
- Collaborating: 受講前→基礎的コミュニケーション力、受講後→多様性対応の協働力
- Acting: 受講前→確実な行動力、受講後→希望と前向きな変化への意識
スコアが下がった場合も、学習と気づきの過程として肯定的に解釈し、今後の成長可能性に言及してください。
回答は必ず指定されたJSON形式のみで出力し、前後に説明文やMarkdownのコードブロック記法（\`\`\`）を付けないでください。`;

function formatScores(label: string, s?: { being: number; thinking: number; relating: number; collaborating: number; acting: number }): string {
  if (!s) return `${label}：データなし`;
  return `${label}：Being: ${s.being}, Thinking: ${s.thinking}, Relating: ${s.relating}, Collaborating: ${s.collaborating}, Acting: ${s.acting}`;
}

function buildUserPrompt(p: ParticipantData): string {
  return `参加者：${p.name}
${formatScores("研修前スコア", p.preTraining)}
${formatScores("研修後スコア", p.postTraining)}
${formatScores("変化量", p.improvement)}

以下のJSON形式でのみ回答してください：
{"being": "...", "thinking": "...", "relating": "...", "collaborating": "...", "acting": "...", "summary": "..."}

- being / thinking / relating / collaborating / acting: 各カテゴリについて100〜140字程度。スコアの増減を具体的な数値で示しながら（例：研修前6.5から研修後8.25へと1.75ポイント向上）、前向きに解説する。カテゴリ名や「**」は含めない
- summary: 参加者名（${p.name}様）を用いて、5つの領域を横断した総合的な気づきや今後への期待を250〜300字程度でまとめる`;
}

export function getStoredApiKey(): string {
  return (
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    localStorage.getItem("gemini_api_key") ||
    ""
  );
}

export function storeApiKey(key: string): void {
  localStorage.setItem("gemini_api_key", key);
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const m = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : trimmed;
}

function parseAIEvaluation(raw: string): AIEvaluation {
  const json = JSON.parse(stripCodeFence(raw));
  const keys: (keyof AIEvaluation)[] = [
    "being",
    "thinking",
    "relating",
    "collaborating",
    "acting",
    "summary",
  ];
  const result = {} as AIEvaluation;
  for (const key of keys) {
    if (typeof json[key] !== "string" || !json[key].trim()) {
      throw new Error(`AI応答に "${key}" フィールドがありません`);
    }
    result[key] = json[key].trim();
  }
  return result;
}

async function callGemini(apiKey: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API エラー (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

export async function generateAIEvaluation(
  participant: ParticipantData,
  apiKey: string
): Promise<AIEvaluation> {
  const userPrompt = buildUserPrompt(participant);
  const text = await callGemini(apiKey, userPrompt);
  if (!text.trim()) throw new Error("AI からの応答が空でした");
  return parseAIEvaluation(text);
}
