import { PasswordReset, Product, User } from "../models"
import { SignupRequestForm } from '../../auth/signup'
import { Database  } from "bun:sqlite"
import { logger } from "../../logger"

export type RecordId          = number
export type UserDetails       = SignupRequestForm
export type UpdateUserDetails = { username: string } & SignupRequestForm 
export type UserResponse      = Omit<User, "deleted_at">

type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

interface UserRepo {
    insertNewUser(user: SignupRequestForm): Promise<RecordId | { error: string }>
    updateUserDetails(userId: number,  user: UserDetails): Promise<boolean>
    getAllUsers(): DbResult<Array<UserResponse>>
    getUserByEmail(email: string): DbResult<UserResponse>
    getUserByUsername(username: string): DbResult<UserResponse>
    getUserByRolename(role: string): DbResult<UserResponse[]> // ask questions, will this be multiple or oen
    deleteUser(username: string): void
}

export class UserRepository implements UserRepo {

    constructor(private db: Database){}

    async insertNewUser(user: SignupRequestForm): Promise<RecordId | { error: string }> {
        const queryString = `
            INSERT INTO users (
                username, password_hash,
                first_name, last_name, email,
                role_name, is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
            const query = this.db.query(queryString);
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

    async updateUserDetails(userId: number, user: UpdateUserDetails): Promise<boolean> {
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
        
        const query = this.db.query(queryString);
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

    async updateUserPassword(userId: number, newPassword: string) {
        const hashedPassword = await Bun.password.hash(newPassword)
        const query = this.db.query(`
            UPDATE users 
            SET password_hash = ?, updated_at = datetime('now')
            WHERE user_id = ?
        `)
        return query.run(hashedPassword, userId).lastInsertRowid
    }

    doesUserExistsById(id: number): boolean {
        const query_string = `SELECT EXISTS(SELECT 1 FROM products WHERE id = ?') as product_exists;`
        const does_user_exists = this.db.query(query_string).run(id) as unknown as boolean
        return does_user_exists
    }

    getAllUsers(): DbResult<Array<UserResponse>> {
        const allUsers = this.db.query("select * from users").all() as UserResponse[]
        return { success:true, data: allUsers }
    }

    getUserByEmail(email: string): DbResult<UserResponse> {
        const user = this.db.query("SELECT * FROM users WHERE email = ?").get(email) as UserResponse
        return { success:true, data: user }
    }

    getUserByUsername(username: string): DbResult<UserResponse> {
        const user = this.db.query("SELECT * FROM users WHERE username = ?").get(username) as UserResponse
        return { success: true, data: user }
    }

    getUserByRolename(role: string): DbResult<UserResponse[]> {
        const user = this.db.query("SELECT * FROM users WHERE role = ?").get(role) as UserResponse[] 
        return { success: true, data: user }
    }

    getUserById(id: number): DbResult<UserResponse>{
        const user = this.db.query("SELECT * FROM users WHERE user_id = ?").get(id) as UserResponse
        return { success: true, data: user }
    }

    getActiveUsers(): DbResult<UserResponse[]> {
        // probably open a github issue for this
        const users = this.db.query("SELECT * FROM users WHERE is_active = ?").all(true) as UserResponse[] 
        return { success: true, data: users }
    }

    deleteUser(username: string): void {
       const query = this.db.query("DELETE * FROM users WHERE username = ?")
       query.run(username)
    }

    deleteUserById(user_id: number): void {
       const query = this.db.query("DELETE * FROM users WHERE user_id = ?")
       query.run(user_id)
    }
    
}