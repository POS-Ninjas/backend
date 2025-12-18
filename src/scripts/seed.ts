
import { Database } from "bun:sqlite"

export async function seedPasswordResetData(db: Database) {
  const testUserId = 1 // Assumes user already exists
  
  const validToken = crypto.randomUUID()
  const expiredToken = crypto.randomUUID()
  const usedToken = crypto.randomUUID()

  // Insert all three at once with different expiry times
  db.run(`
    INSERT INTO password_reset (user_id, email, token, expires_at, used_at)
    VALUES 
      (?, 'test@gmail.com', ?, datetime('now', '+30 minutes'), NULL),
      (?, 'test@gmail.com', ?, datetime('now', '-5 minutes'), NULL),
      (?, 'test@gmail.com', ?, datetime('now', '+30 minutes'), datetime('now', '-2 minutes'))
  `, [
    testUserId, validToken,
    testUserId, expiredToken,
    testUserId, usedToken
  ])

  console.log("🔑 Test Tokens Created:")
  console.log("Valid:  ", validToken)
  console.log("Expired:", expiredToken)
  console.log("Used:   ", usedToken)

  return { validToken, expiredToken, usedToken }

}

export async function seedUsers(db: Database) {
  
  const hashedPassword = await Bun.password.hash("erefss")
  
  db.run(`
    INSERT INTO users (username, password_hash, first_name, last_name, email, role_name, is_active)
    VALUES 
      ('devuser', '${hashedPassword}', 'Dev', 'User', 'dev@gmail.com', 'cashier', 1),
      ('Dev User name', '${hashedPassword}', 'Dev', 'Username', 'devusername@gmail.com', 'cashier', 1),
      ('inactivedevuser', '${hashedPassword}', 'Inactive', 'Dev', 'inactivedev@gmail.com', 'cashier', 0),
      ('pendingdevuser', '${hashedPassword}', 'Pending', 'Dev', 'pendingdev@gmail.com', NULL, 0)
  `)  

  console.log("✅ Test users seeded")
  console.log("📧 Email login: devusername@gmail.com/ erefss")
  console.log("👤 Username login: Dev User name / erefss")
  
  db.close()
  
  return {
    emailUser: "devusername@gmail.com",
    usernameUser: "Dev User name",
    password: "erefss"
  }
}
