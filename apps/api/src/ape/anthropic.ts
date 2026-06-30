import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";
export const MAX_TOKENS = 2048;

export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
