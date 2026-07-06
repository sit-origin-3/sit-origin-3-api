import type { FastifyRequest, FastifyReply } from "fastify"
import { getLeaderboardData } from "../../lib/leaderboard.js"

const allowedOrigins = ["http://localhost:5173", "https://localhost:5173", "https://SIT-Origin.sit.kmutt.ac.th"]

function setSseHeaders(req: FastifyRequest, reply: FastifyReply) {
  const origin = req.headers.origin ?? ""
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]!
  reply.raw.setHeader("Access-Control-Allow-Origin", allowOrigin)
  reply.raw.setHeader("Access-Control-Allow-Credentials", "true")
  reply.raw.setHeader("Content-Type", "text/event-stream")
  reply.raw.setHeader("Cache-Control", "no-cache")
  reply.raw.setHeader("Connection", "keep-alive")
  reply.raw.setHeader("X-Accel-Buffering", "no")
  reply.raw.flushHeaders()
  req.socket.setNoDelay(true)
}

// GET /api/leaderboard/stream — ADMIN เท่านั้น (เห็นชื่อ)
export async function streamLeaderboard(req: FastifyRequest, reply: FastifyReply) {
  reply.hijack()
  setSseHeaders(req, reply)

  const send = async () => {
    const users = await getLeaderboardData()
    const ranked = users.map((u, i) => ({ rank: i + 1, ...u }))
    reply.raw.write(`data: ${JSON.stringify(ranked)}\n\n`)
  }

  await send()
  const interval = setInterval(send, 5000)
  req.socket.on("close", () => clearInterval(interval))
  await new Promise(() => {})
}

// GET /api/leaderboard/stream/anonymous — ทุก role (ปิดตัวตน เห็นแค่ rank + points)
export async function streamLeaderboardAnonymous(req: FastifyRequest, reply: FastifyReply) {
  reply.hijack()
  setSseHeaders(req, reply)

  const send = async () => {
    const users = await getLeaderboardData()
    const ranked = users.map((u, i) => ({ rank: i + 1, points: u.points }))
    reply.raw.write(`data: ${JSON.stringify(ranked)}\n\n`)
  }

  await send()
  const interval = setInterval(send, 5000)
  req.socket.on("close", () => clearInterval(interval))
  await new Promise(() => {})
}
