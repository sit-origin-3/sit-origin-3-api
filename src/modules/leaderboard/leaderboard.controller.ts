import type { FastifyRequest, FastifyReply } from "fastify"
import { prisma } from "../../db.js"

async function getLeaderboardData() {
  const users = await prisma.appUser.findMany({
    where: { role: "FRESHY" },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      nickname: true,
      points: true,
      group: { select: { name: true } },
      receivedPoints: {
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  return users
    .map((u) => {
      // หาเวลาที่สะสมแต้มถึง points ปัจจุบันครั้งแรก
      let cumulative = 0
      let reachedAt: Date | null = null
      for (const tx of u.receivedPoints) {
        cumulative += tx.amount
        if (cumulative >= u.points) {
          reachedAt = tx.createdAt
          break
        }
      }
      const { receivedPoints: _, group, ...rest } = u
      return { ...rest, group: group.name, reachedAt }
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      // แต้มเท่ากัน — ใครถึงก่อนอยู่อันดับสูงกว่า
      if (!a.reachedAt) return 1
      if (!b.reachedAt) return -1
      return a.reachedAt.getTime() - b.reachedAt.getTime()
    })
    .slice(0, 50)
}

// GET /api/leaderboard/stream
export async function streamLeaderboard(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  reply.raw.setHeader("Content-Type", "text/event-stream")
  reply.raw.setHeader("Cache-Control", "no-cache")
  reply.raw.setHeader("Connection", "keep-alive")
  reply.raw.flushHeaders()

  const send = async () => {
    const users = await getLeaderboardData()
    const ranked = users.map((u, i) => ({ rank: i + 1, ...u }))
    reply.raw.write(`data: ${JSON.stringify(ranked)}\n\n`)
  }

  await send()
  const interval = setInterval(send, 5000)

  req.socket.on("close", () => {
    clearInterval(interval)
  })

  await new Promise(() => {})
}
