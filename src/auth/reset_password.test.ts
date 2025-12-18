import { describe, it, expect, beforeAll } from "bun:test"
import app from "../index" // Your Hono app
import { seedPasswordResetData } from "../scripts/seed"
import { Database } from 'bun:sqlite'

describe('user password reset flow', () => {
    let tokens: {
        validToken: string
        expiredToken: string
        usedToken: string
    }

    beforeAll(async () => {

        tokens = await seedPasswordResetData(new Database('./concrete.db', { strict : true}))
    })

    it('should reject token that does not exist in DB', async () => {
        const fakeToken = "f7563ef7-dbdc-428b-88e2-0621bc7e3318"
        
        const req = new Request(`http://localhost:5000/reset-password/${fakeToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: "newPassword123"
            })
        })
        
        const res = await app.fetch(req)
        const contents = await res.json()
        
        expect(res.status).toBe(200) 
        expect(contents.success).toBe(false)
        expect(contents.data.reason).toContain("doesn't exist")
    })

    it('should reject expired token', async () => {
        const req = new Request(`http://localhost:5000/reset-password/${tokens.expiredToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: "newPassword123"
            })
        })
        
        const res = await app.fetch(req)
        const contents = await res.json()
        
        expect(res.status).toBe(200)
        expect(contents.success).toBe(false)
        expect(contents.data.reason).toContain("expired")
    })

    it('should reject token that has already been used', async () => {
        const req = new Request(`http://localhost:5000/reset-password/${tokens.usedToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: "newPassword123"
            })
        })
        
        const res = await app.fetch(req)
        const contents = await res.json()
        
        expect(res.status).toBe(200)
        expect(contents.success).toBe(false)
        expect(contents.data.reason).toContain("token has been used")
    })

    it('should successfully reset password with valid token', async () => {
        const newPassword = "newSecurePassword123"
        
        const req = new Request(`http://localhost:5000/reset-password/${tokens.validToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "test@gmail.com",
                password: newPassword
            })
        })
        
        const res      = await app.fetch(req)
        const contents = await res.json()
        
        expect(res.status).toBe(200)
        expect(contents.success).toBe(true)
        expect(contents.data).toContain("successfully")
    })

    it('should reject reuse of valid token after successful reset', async () => {
        // Try to use the same valid token again
        const req = new Request(`http://localhost:5000/reset-password/${tokens.validToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: "anotherPassword456"
            })
        })
        
        const res = await app.fetch(req)
        const contents = await res.json()
        
        expect(res.status).toBe(200)
        expect(contents.success).toBe(false)
        expect(contents.data.reason).toContain("token has been used")
    })

    it('should reject password reset without password field', async () => {
        const newToken = crypto.randomUUID()
        // Create a fresh valid token for this test
        
        const req = new Request(`http://localhost:5000/reset-password/${newToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // Missing password field
            })
        })
        
        const res      = await app.fetch(req)
        const contents = await res.json()
        
        expect(res.status).toBe(200)
        expect(contents.success).toBe(false)
    })

    it('should reject weak password', async () => {
        const newToken = crypto.randomUUID()
        
        const req = new Request(`http://localhost:5000/reset-password/${newToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: "123" // Too short
            })
        })
        
        const res = await app.fetch(req)
        const contents = await res.json()
        
        expect(res.status).toBe(200)
        expect(contents.success).toBe(false)
        expect(contents.data.reason).toContain("password must be at least 6 characters")
    })
})