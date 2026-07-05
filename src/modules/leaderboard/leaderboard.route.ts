import type { FastifyInstance } from "fastify"
import * as hook from "../../hooks/auth.hook.js"
import * as controller from "./leaderboard.controller.js"

export async function leaderboardRoutes(app: FastifyInstance) {
  // GET /api/leaderboard/stream — ADMIN เท่านั้น (เห็นชื่อ)
  app.get("/stream", { preHandler: [hook.requireRole("ADMIN")] }, controller.streamLeaderboard)

  // GET /api/leaderboard/stream/anonymous — ทุก role (ปิดตัวตน เห็นแค่ rank + points)
  app.get("/stream/anonymous", { preHandler: [hook.requireAuth] }, controller.streamLeaderboardAnonymous)
}
