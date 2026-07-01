import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";
import type { SessionEvent } from "@ape/types";
import { orm } from "../db/client";
import { sessions, prompts, gateDecisions } from "../db/schema";
import { loadContext } from "../context/loader";
import { type Subtask, decompose } from "./decompose";
import { generateCandidates } from "./generate";
import { scoreCandidates } from "./score";
import { executePrompt } from "./execute";
import { shouldGate } from "./gate";

// Serialized between gate pause and resume — stored in sessions.checkpoint
interface LoopCheckpoint {
  subtasks: Subtask[];
  currentIndex: number;
  outputs: string[];      // collected before the gated subtask
  bestCandidate: string;  // highest-scored candidate (already persisted)
  bestId: string;         // DB id of that candidate row
}

// ── Shared inner loop ─────────────────────────────────────────────────────────
// Runs subtasks from startIdx to end. Mutates `outputs` in place so callers
// can prepend outputs they've already collected before handing off.
// Finalizes the session and yields { type:'done' } when all subtasks complete.
async function* processSubtasksFrom(
  sessionId: string,
  subtasks: Subtask[],
  context: string,
  startIdx: number,
  outputs: string[]
): AsyncGenerator<SessionEvent> {
  for (let i = startIdx; i < subtasks.length; i++) {
    const subtask = subtasks[i];

    yield { type: "subtask", index: i, text: subtask.name };

    const candidates = await generateCandidates(subtask.name, context);
    for (let j = 0; j < candidates.length; j++) {
      yield { type: "prompt", subtask: i, candidate: j, text: candidates[j] };
    }

    const scored = await scoreCandidates(subtask.name, candidates, subtask.successCriteria);
    for (let j = 0; j < scored.length; j++) {
      yield { type: "score", subtask: i, candidate: j, score: scored[j].score };
    }

    // Persist all candidates; scored[0] is highest
    let bestId = "";
    for (let j = 0; j < scored.length; j++) {
      const id = ulid();
      if (j === 0) bestId = id;
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

    // Gate check
    const gateResult = await shouldGate(subtask.name, context);
    if (gateResult.gate) {
      const gateId = ulid();
      const question = gateResult.question ?? "How should we proceed?";
      const options = gateResult.options ?? ["Proceed as planned"];

      orm
        .insert(gateDecisions)
        .values({
          id: gateId,
          sessionId,
          question,
          options: JSON.stringify(options),
          chosen: null,
          createdAt: Date.now(),
          resolvedAt: null,
        })
        .run();

      const checkpoint: LoopCheckpoint = {
        subtasks,
        currentIndex: i,
        outputs: [...outputs], // snapshot — don't include current subtask's output yet
        bestCandidate: scored[0].candidate,
        bestId,
      };

      orm
        .update(sessions)
        .set({
          status: "gating",
          checkpoint: JSON.stringify(checkpoint),
          updatedAt: Date.now(),
        })
        .where(eq(sessions.id, sessionId))
        .run();

      yield { type: "gate", gateId, question, options };
      return; // generator pauses here; resumeLoop picks it up
    }

    const output = await executePrompt(scored[0].candidate);
    yield { type: "output", subtask: i, text: output };
    outputs.push(output);

    orm
      .update(prompts)
      .set({ chosen: 1, output })
      .where(eq(prompts.id, bestId))
      .run();
  }

  // All subtasks done
  const fullOutput = outputs.join("\n\n---\n\n");
  orm
    .update(sessions)
    .set({ status: "done", output: fullOutput, updatedAt: Date.now() })
    .where(eq(sessions.id, sessionId))
    .run();

  yield { type: "done", output: fullOutput };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function* runLoop(
  sessionId: string,
  task: string,
  context: string
): AsyncGenerator<SessionEvent> {
  orm
    .update(sessions)
    .set({ status: "running", updatedAt: Date.now() })
    .where(eq(sessions.id, sessionId))
    .run();

  yield { type: "status", status: "running" };

  const subtasks = await decompose(task, context);
  yield { type: "status", status: "decomposed" };

  yield* processSubtasksFrom(sessionId, subtasks, context, 0, []);
}

export async function* resumeLoop(
  sessionId: string,
  gateId: string,
  choice: string
): AsyncGenerator<SessionEvent> {
  // Load session + checkpoint
  const [session] = orm
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .all();

  if (!session?.checkpoint) {
    throw new Error(`resumeLoop: no checkpoint for session ${sessionId}`);
  }

  const { subtasks, currentIndex, outputs, bestCandidate, bestId } =
    JSON.parse(session.checkpoint) as LoopCheckpoint;

  // Re-load context from the context layer (not stored in checkpoint to avoid stale data)
  const context = await loadContext(session.projectId ?? undefined);

  // Resolve the gate (idempotent — POST handler may have already set these)
  orm
    .update(gateDecisions)
    .set({ chosen: choice, resolvedAt: Date.now() })
    .where(eq(gateDecisions.id, gateId))
    .run();

  // Atomic guard: only proceed if session is still in gating state.
  // If a concurrent handler (old ESS whose client reconnected) already flipped
  // the status to "running", bail out here to avoid double-execution.
  const { changes } = orm
    .update(sessions)
    .set({ status: "running", updatedAt: Date.now() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.status, "gating")))
    .run();

  if (changes === 0) return;

  yield { type: "status", status: "running" };

  // Execute the gated subtask — prepend the user's choice to inform the prompt
  const subtask = subtasks[currentIndex];
  yield { type: "subtask", index: currentIndex, text: subtask.name };

  const informedCandidate = `User chose: ${choice}\n\n${bestCandidate}`;
  const output = await executePrompt(informedCandidate);
  yield { type: "output", subtask: currentIndex, text: output };

  outputs.push(output);
  orm
    .update(prompts)
    .set({ chosen: 1, output })
    .where(eq(prompts.id, bestId))
    .run();

  // Hand off to shared inner loop for remaining subtasks (gate re-checks enabled for them)
  yield* processSubtasksFrom(sessionId, subtasks, context, currentIndex + 1, outputs);
}
