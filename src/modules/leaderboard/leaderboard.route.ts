import type { FastifyInstance } from "fastify"
import * as controller from "./leaderboard.controller.js"

export async function leaderboardRoutes(app: FastifyInstance) {
  // GET /api/leaderboard/stream
  app.get("/stream", controller.streamLeaderboard)
}
