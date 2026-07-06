import type { FastifyInstance } from "fastify"
import * as hook from "../../hooks/auth.hook.js"
import * as controller from "./leaderboard.controller.js"

export async function leaderboardRoutes(app: FastifyInstance) {
  // GET /api/leaderboard — ADMIN เท่านั้น (เห็นชื่อ)
  app.get("/", { preHandler: [hook.requireRole("ADMIN")] }, controller.getLeaderboard)

  // GET /api/leaderboard/anonymous — ทุก role (ปิดตัวตน เห็นแค่ rank + points)
  app.get("/anonymous", { preHandler: [hook.requireAuth] }, controller.getLeaderboardAnonymous)
}
