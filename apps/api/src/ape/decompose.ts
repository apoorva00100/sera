import { client, MODEL, MAX_TOKENS, stripJsonFences } from "./anthropic";

export interface Subtask {
  name: string;
  successCriteria: string;
}

export async function decompose(task: string, context: string): Promise<Subtask[]> {
  const msg = await client.messages.create(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You are an expert task planner. When given a task and context, you decompose it into clear, actionable subtasks.",
      messages: [
        {
          role: "user",
          content: `Context:\n${context}\n\nTask: ${task}\n\nReturn ONLY a JSON array of 3–5 subtask objects, each with fields "name" and "successCriteria". No markdown fences, raw JSON only.`,
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
    throw new Error(`decompose: invalid JSON from model:\n${text}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`decompose: expected array, got ${typeof parsed}`);
  }

  return parsed as Subtask[];
}
