import { prisma } from "./src/db.js"

async function main() {
  const users = await prisma.appUser.findMany({
    where: { role: "FRESHY" },
    select: { id: true, nickname: true, points: true, groupId: true },
    orderBy: { points: "desc" },
    take: 5,
  })
  console.log("Top 5 freshies:", JSON.stringify(users, null, 2))
  await prisma.$disconnect()
}
main()
