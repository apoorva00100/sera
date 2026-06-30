import { client, MODEL, MAX_TOKENS } from "./anthropic";

export interface ScoredCandidate {
  candidate: string;
  score: number;
}

export async function scoreCandidates(
  subtask: string,
  candidates: string[],
  criteria: string
): Promise<ScoredCandidate[]> {
  const candidateList = candidates
    .map((c, i) => `Candidate ${i + 1}:\n${c}`)
    .join("\n\n");

  const msg = await client.messages.create(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You are an impartial prompt quality judge. Evaluate prompt candidates strictly against the provided success criteria.",
      messages: [
        {
          role: "user",
          content: `Subtask: ${subtask}\n\nSuccess criteria: ${criteria}\n\n${candidateList}\n\nReturn ONLY a JSON array where each element has "candidate" (the exact prompt text) and "score" (float 0–10). No markdown fences, raw JSON only.`,
        },
      ],
    },
    { signal: AbortSignal.timeout(30000) }
  );

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`scoreCandidates: invalid JSON from model:\n${text}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`scoreCandidates: expected array, got ${typeof parsed}`);
  }

  const scored = parsed as ScoredCandidate[];
  return scored.sort((a, b) => b.score - a.score);
}
