import type { FastifyRequest, FastifyReply } from "fastify"
import { getLeaderboardData } from "../../lib/leaderboard.js"

// GET /api/leaderboard/stream
export async function streamLeaderboard(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const allowedOrigins = ["http://localhost:5173"]
  const origin = req.headers.origin ?? ""
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]!
  reply.raw.setHeader("Access-Control-Allow-Origin", allowOrigin)
  reply.raw.setHeader("Access-Control-Allow-Credentials", "true")
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
