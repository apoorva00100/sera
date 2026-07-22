import { hc } from "hono/client";
import type { AppType } from "../../../api/src/index";
import { API_URL } from "./config";

// credentials: "include" so the Better Auth session cookie rides along on
// task creation and history requests (associates tasks with the signed-in user).
export const client = hc<AppType>(API_URL, {
  init: { credentials: "include" },
});
