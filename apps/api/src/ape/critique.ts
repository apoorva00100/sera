import { client, MODEL, MAX_TOKENS, stripJsonFences } from "./anthropic";

export interface CritiqueResult {
  score: number;
  feedback: string;
}

export async function critiqueOutput(
  subtask: string,
  output: string,
  criteria: string
): Promise<CritiqueResult> {
  const msg = await client.messages.create(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You are a rigorous output evaluator. Score outputs against success criteria and give actionable feedback.",
      messages: [
        {
          role: "user",
          content: `Subtask: ${subtask}\n\nSuccess criteria: ${criteria}\n\nOutput to evaluate:\n${output}\n\nReturn ONLY JSON with "score" (float 0–10) and "feedback" (string). No markdown fences, raw JSON only.`,
        },
      ],
    },
    { signal: AbortSignal.timeout(30000) }
  );

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch {
    throw new Error(`critiqueOutput: invalid JSON from model:\n${text}`);
  }

  return parsed as CritiqueResult;
}
