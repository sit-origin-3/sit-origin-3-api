import type { FastifyRequest, FastifyReply } from "fastify"
import { getLeaderboardData } from "../../lib/leaderboard.js"

// GET /api/leaderboard — ADMIN เท่านั้น (เห็นชื่อ)
export async function getLeaderboard(_req: FastifyRequest, reply: FastifyReply) {
  const users = await getLeaderboardData()
  const ranked = users.map((u, i) => ({ rank: i + 1, ...u }))
  return reply.send(ranked)
}

// GET /api/leaderboard/anonymous — ทุก role (ปิดตัวตน เห็นแค่ rank + points)
export async function getLeaderboardAnonymous(_req: FastifyRequest, reply: FastifyReply) {
  const users = await getLeaderboardData()
  const ranked = users.map((u, i) => ({ rank: i + 1, points: u.points }))
  return reply.send(ranked)
}
