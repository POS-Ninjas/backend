import { PasswordReset, User } from "../models"
import { SignupRequestForm } from '../../auth/signup'
import { Database  } from "bun:sqlite"
import { logger } from "../../logger"

type RecordId = number
type UserDetails = SignupRequestForm
type UpdateUserDetails = { username: string } & SignupRequestForm 

type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

interface UserRepo {
    insertNewUser(db: Database, user: SignupRequestForm): Promise<RecordId | { error: string }>
    updateUserDetails(db: Database,  userId: number,  user: UserDetails): Promise<boolean>
    getAllUsers(db: Database): Promise<DbResult<Array<User>>>
    getUserByEmail(db: Database, email: string): Promise<DbResult<User>>
    getUserByUsername(db: Database, username: string): Promise<DbResult<User>>
    getUserByRolename(db: Database, role: string): Promise<DbResult<User>>
    deleteUser(db: Database, username: string): void
}

export class UserRepository implements UserRepo {

    constructor(){}

    async insertNewUser(db: Database, user: SignupRequestForm): Promise<RecordId | { error: string }> {
        const queryString = `
            INSERT INTO users (
                username, password_hash,
                first_name, last_name, email,
                role_name, is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
            const query = db.query(queryString);
            const hashed_password = await Bun.password.hash(user.password);
            
            const res = query.run(
                user.username,
                hashed_password,
                user.fullname,
                user.lastname,
                user.email,
                null,
                false
            );
            
            logger.info("Successfully inserted new user with fullName " + user.fullname + " in the database");
            return res.lastInsertRowid as number;
            
        } catch (error: any) {

            if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            
                const message = error.message || "";
                
                if (message.includes("users.email")) {
                    logger.warn(`Duplicate email attempt: ${user.email}`);
                    return { error: "Email already exists" };
                } else if (message.includes("users.username")) {
                    logger.warn(`Duplicate username attempt: ${user.username}`);
                    return { error: "Username already exists" };
                } else {
                    logger.error("Unique constraint failed:", message);
                    return { error: "User already exists" };
                }
            }
            
            logger.error("Database error inserting user:", error);
            return { error: "Failed to create user" };
        }
    }

    async updateUserDetails(db: Database, userId: number, user: UpdateUserDetails): Promise<boolean> {
        const queryString = `
            UPDATE users 
            SET username = ?,
                password_hash = ?,
                first_name = ?,
                last_name = ?,
                email = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;
        
        const query = db.query(queryString);
        const hashed_password = await Bun.password.hash(user.password);
        
        const res = query.run(
            user.username,
            hashed_password,
            user.fullname,
            user.lastname,
            user.email,
            userId
        );
        
        logger.info(`Successfully updated user with ID ${userId} (${user.fullname}) in the database`);
        return res.changes > 0;
    }

    async updateUserPassword(db: Database, userId: number, newPassword: string) {
        const hashedPassword = await Bun.password.hash(newPassword)
        const query = db.query(`
            UPDATE users 
            SET password_hash = ?, updated_at = datetime('now')
            WHERE user_id = ?
        `)
        return query.run(hashedPassword, userId).lastInsertRowid
    }

    async getAllUsers(db: Database): Promise<DbResult<Array<User>>> {
        const allUsers = db.query("select * from users").all() as User[]
        return { success:true, data: allUsers }
    }

    async getUserByEmail(db: Database, email: string): Promise<DbResult<User>> {
        const user = db.query("SELECT * FROM users WHERE email = ?").get(email) as User
        return { success:true, data: user }
    }

    async getUserByUsername(db: Database, username: string): Promise<DbResult<User>> {
        const user = db.query("SELECT * FROM users WHERE username = ?").get(username) as User
        return { success: true, data: user }
    }

    async getUserByRolename(db: Database, role: string): Promise<DbResult<User>> {
        const user = db.query("SELECT * FROM users WHERE role = ?").get(role) as User
        return { success: true, data: user }
    }

    deleteUser(db: Database, username: string): void {
       const query =  db.query("DELETE * FROM users WHERE username = ?")
       query.run(username)
    }
    
}