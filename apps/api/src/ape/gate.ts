import { client, MODEL, MAX_TOKENS, stripJsonFences } from "./anthropic";

export interface GateResult {
  gate: boolean;
  question?: string;
  options?: string[];
}

const SYSTEM_PROMPT =
  "You are a decision classifier. Given a subtask and user context, decide if this subtask requires a user decision before it can proceed. A gate is needed only when the choice is both (1) irreversible or hard to change later, and (2) depends on user preference not inferable from context. Examples that need a gate: visual style, pricing structure, target audience. Examples that do not: file naming, code formatting, boilerplate. Return ONLY raw JSON: { gate: boolean, question?: string, options?: string[] } where options is 2–4 short strings.";

export async function shouldGate(
  subtask: string,
  context: string
): Promise<GateResult> {
  const msg = await client.messages.create(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Subtask: ${subtask}\n\nContext:\n${context}`,
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
    throw new Error(`shouldGate: invalid JSON from model:\n${text}`);
  }

  return parsed as GateResult;
}
