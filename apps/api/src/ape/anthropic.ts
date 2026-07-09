// Groq (OpenAI-compatible) client, shimmed to look like the Anthropic Messages
// API so callers (decompose/generate/score/gate/critique/execute) don't change.
import OpenAI from "openai";

export const MODEL = "llama-3.3-70b-versatile";
export const MAX_TOKENS = 2048;

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

interface TextBlock {
  type: "text";
  text: string;
}

interface AnthropicLikeMessage {
  content: TextBlock[];
}

interface CreateParams {
  model: string;
  max_tokens: number;
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

async function createMessage(
  params: CreateParams,
  opts?: { signal?: AbortSignal }
): Promise<AnthropicLikeMessage> {
  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (params.system) chatMessages.push({ role: "system", content: params.system });
  for (const m of params.messages) chatMessages.push({ role: m.role, content: m.content });

  const completion = await openai.chat.completions.create(
    {
      model: params.model,
      max_tokens: params.max_tokens,
      messages: chatMessages,
    },
    { signal: opts?.signal }
  );

  const text = completion.choices[0]?.message?.content ?? "";
  return { content: [{ type: "text", text }] };
}

export const client = {
  messages: {
    create: createMessage,
    stream(params: CreateParams, opts?: { signal?: AbortSignal }) {
      const promise = createMessage(params, opts);
      return { finalMessage: () => promise };
    },
  },
};

// Llama models are more prone than Claude to wrapping JSON responses in
// markdown code fences despite being told not to — strip them before parsing.
export function stripJsonFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1].trim() : text;
}
