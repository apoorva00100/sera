import { hc } from "hono/client";
import type { AppType } from "../../../api/src/index";

export const client = hc<AppType>("http://localhost:3001");
