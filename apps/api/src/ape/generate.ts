import { client, MODEL, MAX_TOKENS, stripJsonFences } from "./anthropic";

export async function generateCandidates(subtask: string, context: string): Promise<string[]> {
  const msg = await client.messages.create(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You are an expert prompt engineer. When given a subtask and context, you generate multiple distinct, high-quality prompt candidates.",
      messages: [
        {
          role: "user",
          content: `Context:\n${context}\n\nSubtask: ${subtask}\n\nReturn ONLY a JSON array of exactly 3 distinct prompt strings for completing this subtask. Each should take a meaningfully different approach. No markdown fences, raw JSON only.`,
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
    throw new Error(`generateCandidates: invalid JSON from model:\n${text}`);
  }

  if (!Array.isArray(parsed) || parsed.length !== 3) {
    throw new Error(`generateCandidates: expected array of 3, got ${JSON.stringify(parsed).slice(0, 100)}`);
  }

  return parsed as string[];
}
