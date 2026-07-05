import { prisma } from "../db.js"

export async function getLeaderboardData() {
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
      if (!a.reachedAt) return 1
      if (!b.reachedAt) return -1
      return a.reachedAt.getTime() - b.reachedAt.getTime()
    })
    .slice(0, 50)
}

export async function getRankById(userId: number): Promise<number | null> {
  const ranked = await getLeaderboardData()
  const index = ranked.findIndex((u) => u.id === userId)
  return index === -1 ? null : index + 1
}
