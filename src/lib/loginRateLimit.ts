// Rate limit การ login ต่อ identifier (studentId/email) — เก็บใน memory
// ใช้ identifier แทน IP เพราะผู้ใช้อาจอยู่หลัง WiFi/NAT เดียวกัน (public IP เดียวกัน)

const MAX_ATTEMPTS = 30
const WINDOW_MS = 2 * 60 * 1000 // 5 นาที

type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

// เคลียร์ entry ที่หมดอายุเป็นระยะ กัน memory โต
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key)
  }
}, WINDOW_MS).unref()

/**
 * เพิ่มจำนวนครั้งของ identifier แล้วบอกว่าเกิน limit หรือยัง
 * @returns true = ยัง login ได้, false = โดน block
 */
export function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now >= entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false
  }

  entry.count++
  return true
}

/** รีเซ็ต counter เมื่อ login สำเร็จ (ให้คน login ถูกไม่ต้องกังวลเรื่อง limit) */
export function resetLoginRateLimit(identifier: string): void {
  store.delete(identifier)
}
