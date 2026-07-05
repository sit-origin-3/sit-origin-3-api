import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import bcrypt from "bcrypt"
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

function toGroupId(raw: string): string {
  const num = parseInt(raw, 10)
  if (!isNaN(num) && num >= 1 && num <= 10) return `G${num}`
  if (/^[GS][1-9][0-9]?$/.test(raw) || /^I[1-2]$/.test(raw) || raw === "ADMIN")
    return raw
  throw new Error(`Invalid groupId: ${raw}`)
}

const STATION_POOL_POINTS = 500

const GROUP_DEFINITIONS: { id: string; name: string; points: number }[] = [
  { id: "G1", name: "G1", points: 0 },
  { id: "G2", name: "G2", points: 0 },
  { id: "G3", name: "G3", points: 0 },
  { id: "G4", name: "G4", points: 0 },
  { id: "G5", name: "G5", points: 0 },
  { id: "G6", name: "G6", points: 0 },
  { id: "G7", name: "G7", points: 0 },
  { id: "G8", name: "G8", points: 0 },
  { id: "G9", name: "G9", points: 0 },
  { id: "G10", name: "G10", points: 0 },
  { id: "S1", name: "สืบคดี", points: STATION_POOL_POINTS },
  { id: "S2", name: "สปาย", points: STATION_POOL_POINTS },
  { id: "S3", name: "ทำตามพี่บอก", points: STATION_POOL_POINTS },
  { id: "S4", name: "วาดแล้วเล่า", points: STATION_POOL_POINTS },
  { id: "S5", name: "ต่อกระดาษ", points: STATION_POOL_POINTS },
  { id: "I1", name: "ใบ้คำ", points: STATION_POOL_POINTS },
  { id: "I2", name: "นับเลขเปลี่ยนคำ", points: STATION_POOL_POINTS },
  { id: "ADMIN", name: "ADMIN", points: 0 },
]

async function seedGroups() {
  for (const g of GROUP_DEFINITIONS) {
    await prisma.userGroup.upsert({
      where: { id: g.id },
      update: { name: g.name },
      create: { id: g.id, name: g.name, points: g.points },
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
    // strip Windows \r line endings
    const columns = rows[i]?.replace(/\r/g, "").split(",")
    if (!columns || columns.length < 12) continue

    // CSV columns: email,alt_email,password,phoneNo,studentId,firstname,lastname,nickname,role,major,session,groupId
    const email = columns[0]?.trim() ?? ""
    const altEmail = columns[1]?.trim() || null
    const rawPassword = columns[2]?.trim() ?? ""
    const password = await bcrypt.hash(rawPassword, 10)
    const phoneNo = columns[3]?.trim() || null
    const studentId = columns[4]?.trim() || null
    const firstname = columns[5]?.trim() ?? ""
    const lastname = columns[6]?.trim() ?? ""
    const nickname = columns[7]?.trim() ?? ""
    const role = columns[8]?.trim() ?? "FRESHY"
    const major = columns[9]?.trim() ?? "IT"
    const session =
      role === "ADMIN"
        ? "ADMIN"
        : role === "STAFF"
          ? "STAFF"
          : (columns[10]?.trim() ?? "A") === "B"
            ? "B"
            : "A"
    const groupId = toGroupId(columns[11]?.trim() ?? "")

    const userCode = await getUniqueUserCode(usedCodes)

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
        points: 0,
        group: { connect: { id: groupId } },
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
