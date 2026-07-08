import type { ParticipantData } from "@/types/survey";

export type AIProvider = "openai" | "gemini";

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
スコアが下がった場合も、学習と気づきの過程として肯定的に解釈し、今後の成長可能性に言及してください。`;

function formatScores(label: string, s?: { being: number; thinking: number; relating: number; collaborating: number; acting: number }): string {
  if (!s) return `${label}：データなし`;
  return `${label}：Being: ${s.being}, Thinking: ${s.thinking}, Relating: ${s.relating}, Collaborating: ${s.collaborating}, Acting: ${s.acting}`;
}

function buildUserPrompt(p: ParticipantData): string {
  return `参加者：${p.name}
${formatScores("研修前スコア", p.preTraining)}
${formatScores("研修後スコア", p.postTraining)}
${formatScores("変化量", p.improvement)}

600文字程度で、参加者の成長と今後の可能性について前向きな総合評価コメントを日本語で生成してください。
必ず以下のフォーマットに従ってください：
- 各カテゴリごとに分析
- 各カテゴリの先頭に「**カテゴリ名（日本語名）**」（例：**Being（自分のあり方）**）
- スコアの増減を具体的な数値で示す（例：3.25から5.0へと大幅に向上）
- 全体で600文字程度`;
}

export function getStoredApiKey(provider: AIProvider): string {
  if (provider === "openai") {
    return (
      (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ||
      localStorage.getItem("openai_api_key") ||
      ""
    );
  }
  return (
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    localStorage.getItem("gemini_api_key") ||
    ""
  );
}

export function storeApiKey(provider: AIProvider, key: string): void {
  localStorage.setItem(
    provider === "openai" ? "openai_api_key" : "gemini_api_key",
    key
  );
}

async function callOpenAI(apiKey: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API エラー (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(apiKey: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
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

export async function generateAIComment(
  participant: ParticipantData,
  provider: AIProvider,
  apiKey: string
): Promise<string> {
  const userPrompt = buildUserPrompt(participant);
  const text =
    provider === "openai"
      ? await callOpenAI(apiKey, userPrompt)
      : await callGemini(apiKey, userPrompt);
  if (!text.trim()) throw new Error("AI からの応答が空でした");
  return text.trim();
}
