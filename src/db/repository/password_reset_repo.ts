import { PasswordReset } from "../models"
import { Database  } from "bun:sqlite"
import { logger } from "../../logger"
import { PasswordResetRequestForm } from "../models"

type RecordId = number
type PasswordResetRecord = PasswordReset


type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code: string };

interface PasswordResetImpl {

    createPasswordResetRequest(db: Database, form: PasswordResetRequestForm): Promise<RecordId | { error: string }>
    getPasswordResetRequestByToken(db: Database, token: string): DbResult<PasswordResetRecord>
    getPasswordResetRequestByEmail(db: Database, email: string): DbResult<PasswordResetRecord>
    getPasswordResetRequestByUserId(db: Database, user_id: number): DbResult<PasswordResetRecord>
    getPasswordResetRequestByExpiry(db: Database, expires_at: number): DbResult<PasswordResetRecord>

    // update the table and delete the record 
}

export class PasswordResetRepository implements PasswordResetImpl {

    constructor(){}

    async createPasswordResetRequest(db: Database, form: PasswordResetRequestForm): Promise<RecordId | { error: string }> {
        const queryString = `
            INSERT INTO password_reset (
                user_id, email, token,
                expires_at
            )
            VALUES (?, ?, ?, datetime('now', '+3 minutes'))
        `

        try {

            const query = db.query(queryString)
            const res = query.run(
                form.user_id,
                form.email,
                form.token,
            )
            logger.info(`Successfully created password reseet request for ${form.email}`)
            return res.lastInsertRowid as number

        } catch (error: any){
            logger.error("Database error creating password reset request:", error);
            return { error: "Failed to create user" };
        }
        
    }

    getPasswordResetRequestByToken(db: Database, token: string): DbResult<PasswordResetRecord> {
        const record = db.query("SELECT * FROM PASSWORD_RESET where token = ?").get(token) as PasswordResetRecord
        return { success: true, data: record }
    }

    getPasswordResetRequestByEmail(db: Database, email: string): DbResult<PasswordResetRecord> {
        const record = db.query("SELECT * FROM PASSWORD_RESET where email = ?").get(email) as PasswordResetRecord
        return { success: true, data: record }
    }

    getPasswordResetRequestByUserId(db: Database, user_id: number): DbResult<PasswordResetRecord> {
        const record = db.query("SELECT * FROM PASSWORD_RESET where user_id = ?").get(user_id) as PasswordResetRecord
        return { success: true, data: record }
    }

    getPasswordResetRequestByExpiry(db: Database, expires_at: number): DbResult<PasswordResetRecord> {
        const record = db.query("SELECT * FROM PASSWORD_RESET where expires_at = ?").get(expires_at) as PasswordResetRecord
        return { success: true, data: record }
    }

    async markPasswordResetTokenAsUsed(db: Database, token: string) {
        const query = db.query(`
            UPDATE password_reset 
            SET used_at = datetime('now')
            WHERE token = ?
        `)
        return query.run(token).lastInsertRowid
    }
  
    
}