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
    },
    orderBy: { points: "desc" },
    take: 20,
  })

  return users.map((u) => {
    const { group, ...rest } = u
    return { ...rest, group: group.name }
  })
}

export async function getRankById(userId: number): Promise<number | null> {
  const ranked = await getLeaderboardData()
  const index = ranked.findIndex((u) => u.id === userId)
  return index === -1 ? null : index + 1
}
