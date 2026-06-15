// Server-only Gemini client. Reads GEMINI_ROCKET_AI from env and calls
// Google Generative Language API directly. Never imported from the client.

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface GeminiCallOptions {
  system: string;
  user: string;
  temperature?: number;
}

export async function callGemini({ system, user, temperature = 0.85 }: GeminiCallOptions): Promise<string> {
  const apiKey = process.env.GEMINI_ROCKET_AI;
  if (!apiKey) {
    throw new Error(
      "GEMINI_ROCKET_AI não encontrada. A secret precisa ter exatamente esse nome (sem espaços).",
    );
  }

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      const errText = await res.text();
      console.error("[gemini] HTTP", res.status, errText);
    } else {
      console.error("[gemini] HTTP", res.status);
    }
    throw new Error(`Gemini API erro ${res.status}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Resposta vazia do Gemini");
  return text;
}

export function safeParseJson<T = unknown>(raw: string): T {
  // Strip markdown fences if model returned any
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
