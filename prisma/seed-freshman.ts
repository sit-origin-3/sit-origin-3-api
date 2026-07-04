import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import "dotenv/config"

const adapter = new PrismaPg(process.env["DATABASE_URL"] ?? "")
const prisma = new PrismaClient({ adapter })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function generateUserCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function getUniqueUserCode(usedCodes: Set<string>): Promise<string> {
  let code = generateUserCode()
  while (usedCodes.has(code)) {
    code = generateUserCode()
  }
  usedCodes.add(code)
  return code
}

function toGroupName(groupId: string): string {
  const num = parseInt(groupId, 10)
  if (num >= 1 && num <= 10) return `G${num}`
  if (groupId === "ADMIN") return "ADMIN"
  if (groupId === "STAFF") return "STAFF"
  throw new Error(`Invalid groupId: ${groupId}`)
}

async function seedGroups() {
  const groupNames = ["G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","ADMIN","STAFF"]
  for (const name of groupNames) {
    await prisma.userGroup.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log("✅ UserGroups seeded")
}

async function main() {
  console.log("⏳ Seeding user groups...")
  await seedGroups()

  console.log("⏳ Reading CSV file...")
  const csvFilePath = path.join(__dirname, "mockdata_freshman.csv")
  const csvData = fs.readFileSync(csvFilePath, "utf-8")

  const rows = csvData.split("\n").filter((row) => row.trim() !== "")
  console.log(`⏳ Found ${rows.length - 1} records. Starting DB insertion...`)

  const existing = await prisma.appUser.findMany({ select: { userCode: true } })
  const usedCodes = new Set(existing.map((u) => u.userCode))

  for (let i = 1; i < rows.length; i++) {
    const columns = rows[i]?.split(",")
    if (!columns || columns.length < 13) continue

    const email     = columns[0]?.trim() ?? ""
    const altEmail  = columns[1]?.trim() || null
    const password  = columns[2]?.trim() ?? ""
    const phoneNo   = columns[3]?.trim() || null
    const studentId = columns[4]?.trim() || null
    const firstname = columns[5]?.trim() ?? ""
    const lastname  = columns[6]?.trim() ?? ""
    const nickname  = columns[7]?.trim() ?? ""
    const role      = columns[9]?.trim() ?? "FRESHY"
    const major     = columns[10]?.trim() ?? "IT"
    const groupName = toGroupName(columns[11]?.trim() ?? "")
    const session   = role === "ADMIN" ? "ADMIN"
                    : role === "STAFF" ? "STAFF"
                    : (columns[12]?.trim() ?? "A") === "B" ? "B" : "A"

    let userCode = columns[8]?.trim() ?? ""
    if (!userCode) {
      userCode = await getUniqueUserCode(usedCodes)
    } else {
      usedCodes.add(userCode)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.appUser.upsert as any)({
      where: { email },
      update: { session },
      create: {
        email,
        altEmail,
        password,
        phoneNo,
        studentId,
        firstname,
        lastname,
        nickname,
        userCode,
        role,
        session,
        major,
        points: role === "STAFF" || role === "ADMIN" ? 100 : 0,
        group: { connect: { name: groupName } },
      },
    })
  }

  console.log("✅ Successfully inserted all mock data into the database!")
}

main()
  .catch((e) => {
    console.error("❌ Error inserting data:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
