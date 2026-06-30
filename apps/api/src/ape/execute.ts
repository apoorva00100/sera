import { client, MODEL, MAX_TOKENS } from "./anthropic";

export async function executePrompt(prompt: string): Promise<string> {
  const stream = client.messages.stream(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    },
    { signal: AbortSignal.timeout(30000) }
  );

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}
