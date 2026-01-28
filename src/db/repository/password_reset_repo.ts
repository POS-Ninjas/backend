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

    createPasswordResetRequest(form: PasswordResetRequestForm): Promise<RecordId | { error: string }>
    getPasswordResetRequestByToken(token: string): DbResult<PasswordResetRecord>
    getPasswordResetRequestByEmail(email: string): DbResult<PasswordResetRecord>
    getPasswordResetRequestByUserId(user_id: number): DbResult<PasswordResetRecord>
    getPasswordResetRequestByExpiry(expires_at: number): DbResult<PasswordResetRecord>

    // update the table and delete the record 
}

export class PasswordResetRepository implements PasswordResetImpl {

     constructor(private db: Database){}

    async createPasswordResetRequest(form: PasswordResetRequestForm): Promise<RecordId | { error: string }> {
        const queryString = `
            INSERT INTO password_reset (
                user_id, email, token,
                expires_at
            )
            VALUES (?, ?, ?, datetime('now', '+3 minutes'))
        `
        try {

            const query = this.db.query(queryString)
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

    getPasswordResetRequestByToken(token: string): DbResult<PasswordResetRecord> {
        const record = this.db.query("SELECT * FROM PASSWORD_RESET where token = ?").get(token) as PasswordResetRecord
        return { success: true, data: record }
    }

    getPasswordResetRequestByEmail(email: string): DbResult<PasswordResetRecord> {
        const record = this.db.query("SELECT * FROM PASSWORD_RESET where email = ?").get(email) as PasswordResetRecord
        return { success: true, data: record }
    }

    getPasswordResetRequestByUserId(user_id: number): DbResult<PasswordResetRecord> {
        const record = this.db.query("SELECT * FROM PASSWORD_RESET where user_id = ?").get(user_id) as PasswordResetRecord
        return { success: true, data: record }
    }

    getPasswordResetRequestByExpiry(expires_at: number): DbResult<PasswordResetRecord> {
        const record = this.db.query("SELECT * FROM PASSWORD_RESET where expires_at = ?").get(expires_at) as PasswordResetRecord
        return { success: true, data: record }
    }

    async markPasswordResetTokenAsUsed(token: string) {
        const query = this.db.query(`
            UPDATE password_reset 
            SET used_at = datetime('now')
            WHERE token = ?
        `)
        return query.run(token).lastInsertRowid
    }
  
    
}