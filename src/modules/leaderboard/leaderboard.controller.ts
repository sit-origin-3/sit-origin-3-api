import type { FastifyRequest, FastifyReply } from "fastify"
import { getLeaderboardData } from "../../lib/leaderboard.js"
import { prisma } from "../../db.js"

async function getShowLeaderboard(): Promise<boolean> {
  const config = await prisma.systemConfig.findUnique({ where: { key: "SHOW_LEADERBOARD" } })
  return config?.value === "true"
}

// GET /api/leaderboard — ADMIN เท่านั้น (เห็นชื่อเสมอ)
export async function getLeaderboard(_req: FastifyRequest, reply: FastifyReply) {
  const users = await getLeaderboardData()
  const entries = users.map((u, i) => ({ rank: i + 1, ...u }))
  return reply.send(entries)
}

// GET /api/leaderboard/anonymous — ทุก role (ชื่อขึ้นอยู่กับ config)
export async function getLeaderboardAnonymous(_req: FastifyRequest, reply: FastifyReply) {
  const [users, showLeaderboard] = await Promise.all([getLeaderboardData(), getShowLeaderboard()])

  const entries = users.map((u, i) =>
    showLeaderboard
      ? { rank: i + 1, ...u }
      : { rank: i + 1, points: u.points },
  )

  return reply.send({ showLeaderboard, entries })
}
