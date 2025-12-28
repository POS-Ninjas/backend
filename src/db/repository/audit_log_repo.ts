import { Audit_Log } from "../models"
import { Database  } from "bun:sqlite"
import { logger } from "../../logger"

type RecordId = number
type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

export type Log = Omit<Audit_Log, "audit_id" | "created_at">

interface AuditLogRepo {
    get_all_audit_logs(db: Database): DbResult<Array<Audit_Log>>
    get_logs_of_user(db: Database, user_id: number): DbResult<Array<Audit_Log>>
    create_audit_log(db: Database, log: Log): RecordId | { error: string }
}

export class AuditLogRepository implements AuditLogRepo {

    create_audit_log(db: Database, log: Log): RecordId | { error: string } {

        const queryString = `
            INSERT INTO audit_logs (
                user_id, action, description, 
                table_name
            ) 
            VALUES (?, ?, ?, ?)
        `

        try {
            const query =  db.query(queryString);
 
            const res = query.run(
               log.user_id,
               log.action,
               log.description,
               log.table_name
            );
            
            logger.info("Successfully inserted new user with fullName in the database");
            return res.lastInsertRowid as number;
            
        } catch (error: any) {
            
            logger.error("Database error inserting user:", error);
            return { error: "Failed to create user" };
        }

    }

    get_all_audit_logs(db: Database): DbResult<Array<Audit_Log>>{
        const logs = db.query("select * from audit_log").all() as Audit_Log[]
        return { success:true, data: logs }
    }

    get_logs_of_user(db: Database, user_id: number): DbResult<Array<Audit_Log>>{
        const logs = db.query("SELECT * FROM audit_log WHERE user_id = ?").all(user_id) as Audit_Log[]
        return { success:true, data: logs }
    }

}