import type { FastifyInstance } from "fastify"
import * as hook from "../../hooks/auth.hook.js"
import * as controller from "./leaderboard.controller.js"

export async function leaderboardRoutes(app: FastifyInstance) {
  // GET /api/leaderboard/stream
  app.get("/stream", { preHandler: [hook.requireAuth] }, controller.streamLeaderboard)
}
