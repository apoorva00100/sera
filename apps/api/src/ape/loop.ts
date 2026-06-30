import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import type { SessionEvent } from "@ape/types";
import { orm } from "../db/client";
import { sessions, prompts } from "../db/schema";
import { decompose } from "./decompose";
import { generateCandidates } from "./generate";
import { scoreCandidates } from "./score";
import { executePrompt } from "./execute";

export async function* runLoop(
  sessionId: string,
  task: string,
  context: string
): AsyncGenerator<SessionEvent> {
  // Mark session as running
  orm
    .update(sessions)
    .set({ status: "running", updatedAt: Date.now() })
    .where(eq(sessions.id, sessionId))
    .run();

  yield { type: "status", status: "running" };

  // Decompose task into subtasks
  const subtasks = await decompose(task, context);

  yield { type: "status", status: "decomposed" };

  const outputs: string[] = [];

  for (let i = 0; i < subtasks.length; i++) {
    const subtask = subtasks[i];

    yield { type: "subtask", index: i, text: subtask.name };

    // Generate 3 candidate prompts
    const candidates = await generateCandidates(subtask.name, context);
    for (let j = 0; j < candidates.length; j++) {
      yield { type: "prompt", subtask: i, candidate: j, text: candidates[j] };
    }

    // Score all candidates (returns sorted descending)
    const scored = await scoreCandidates(subtask.name, candidates, subtask.successCriteria);
    for (let j = 0; j < scored.length; j++) {
      yield { type: "score", subtask: i, candidate: j, score: scored[j].score };
    }

    // Persist all candidates; track the best candidate's DB id
    let bestId = "";
    for (let j = 0; j < scored.length; j++) {
      const id = ulid();
      if (j === 0) bestId = id; // scored[0] has highest score
      orm
        .insert(prompts)
        .values({
          id,
          sessionId,
          subtask: subtask.name,
          candidate: scored[j].candidate,
          score: scored[j].score,
          chosen: 0,
          output: null,
          note: null,
          createdAt: Date.now(),
        })
        .run();
    }

    // Execute the best prompt via streaming
    const output = await executePrompt(scored[0].candidate);

    yield { type: "output", subtask: i, text: output };
    outputs.push(output);

    // Mark the chosen row and store its output
    orm
      .update(prompts)
      .set({ chosen: 1, output })
      .where(eq(prompts.id, bestId))
      .run();
  }

  // Finalize session
  const fullOutput = outputs.join("\n\n---\n\n");

  orm
    .update(sessions)
    .set({ status: "done", output: fullOutput, updatedAt: Date.now() })
    .where(eq(sessions.id, sessionId))
    .run();

  yield { type: "done", output: fullOutput };
}
