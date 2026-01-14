import { SignupRequestForm } from "./auth/signup";
import { 
    LoginRequestWithEmailForm, 
    LoginRequestWithUsernameForm 
} from "./auth/login";
import { Audit_Log, PasswordResetRequestForm } from "./db/models"


import { Database  } from "bun:sqlite"
import { logger } from './logger'
import { UserRepository } from "./db/repository/user_repo";
import { PasswordResetRepository } from "./db/repository/password_reset_repo";
import { AuditLogRepository, Log } from "./db/repository/audit_log_repo";
import { PasswordReset, User } from "./db/models"
import { ProductService } from "./services/product"
import { SupplierService } from "./services/supplier"
import { ProductRepository } from "./db/repository/product_repo";

interface RoleData {
    [key: string]: string;
}

const ROLE_NAMES_AND_DESCRIPTIONS: RoleData = {
    "admin": "Overall admin",
    "manager1": "Manager in charge of front shop" ,
    "manager2": "Manager in charge of back shop",
    "cashier1": "cashier in store 1",
    "cashier2": "cashier in store 2",
}

const ROLE_PERMISSIONS: RoleData = {
    "admin" : "all perms",
    "manager1": "perms1",
    "manager2": "perms2",
    "cashier1": "perms3",
    "cashier2": "perms4"
}

// break this into services

class SqliteDatabaseServices  {

    database: Database
    private user_repo: UserRepository
    private password_reset_repo: PasswordResetRepository
    private audit_log_repo: AuditLogRepository

    constructor(db: string){

        if (db == "concrete"){
            this.database = new Database("./test.db", {strict: true})
        } else {
            this.database = new Database(":memory:", {strict: true})
        }
        
        this.user_repo           = new UserRepository()
        this.audit_log_repo      = new AuditLogRepository()
        this.password_reset_repo = new PasswordResetRepository()

        this.init(db)
    }

    private async init(db: string){

        logger.info("Starting sqlite database")
        this.database.run('PRAGMA foreign_keys = ON')
        const schema = await Bun.file("./pos_tables.sql").text()

        if (db == "memory"){
            logger.info("running schema in memory")
            this.database.run(schema)
        } else {
            logger.info(`using concrete implementation look for ${this.database.filename} file in project dir`)
            return
            // this.db.run(schema)
        }

        // this.insertRoles()
        // Check if table exists and see its structure
        // const tableInfo = this.db.query(`PRAGMA table_info(users)`).all()
        // console.log('Table structure:', tableInfo)

    }

    product_service(){
        return new ProductService()
    }

    supplier_service(){
        return new SupplierService()
    }

    // move these into user service
    async insertNewUser(newUserDetails: SignupRequestForm): Promise<number> {
        const res = await this.user_repo.insertNewUser(this.database, newUserDetails)
        return res as number
    }

    async updateUserPassword(userId: number, updated_password: string): Promise<number> {
        const res = await this.user_repo.updateUserPassword(this.database, userId, updated_password)
        return res as number
    }

    getUserByEmail(email: string): User | string {
        const res = this.user_repo.getUserByEmail(this.database, email)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByUsername(newUserDetails: LoginRequestWithUsernameForm): User | string {
        const res = this.user_repo.getUserByUsername(this.database, newUserDetails.username)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    async insertPasswordResetForm(passwordResetForm: PasswordResetRequestForm): Promise<number | string>{
        const res = await this.password_reset_repo.createPasswordResetRequest(this.database, passwordResetForm)
        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    getPasswordResetRequestByEmail(email: string)  {
        const res = this.password_reset_repo.getPasswordResetRequestByEmail(this.database, email)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async getPasswordResetRequestByUserId(user_id: number)  {
        const res = this.password_reset_repo.getPasswordResetRequestByUserId(this.database, user_id)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async getPasswordResetRequestByExpiry(expires_at: number)  {
        const res = this.password_reset_repo.getPasswordResetRequestByExpiry(this.database, expires_at)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async getPasswordResetRequestByToken(token: string)  {
        const res = this.password_reset_repo.getPasswordResetRequestByToken(this.database, token)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async markTokenasUsed(token: string): Promise<boolean> {
        const res = await this.password_reset_repo.markPasswordResetTokenAsUsed(this.database, token)

        if (typeof res == 'number'){
            return true
        } else {
            return false
        }

    }

    async create_audit_log(log: Log) {
        const res = this.audit_log_repo.create_audit_log(this.database, log)

        if (typeof res == 'number' ){
          return res
        } else {
          return res.error
        }

    }

    get_logs(): Array<Audit_Log> | string {
        const res = this.audit_log_repo.get_all_audit_logs(this.database)
        if (res.success == true ){
            return res.data
        } else {
            return res.error
        }

    }

    get_log_by_user_id(user_id: number): Array<Audit_Log> | string {

        const res = this.audit_log_repo.get_logs_of_user(this.database, user_id)

        if (res.success == true ){
            return res.data
        } else {
            return res.error
        }
    }

    async insertRoles() {
        logger.info("initializing database with roles and roles permissions")
        for (const [name, description] of Object.entries(ROLE_NAMES_AND_DESCRIPTIONS)) {
         
            const permissions = ROLE_PERMISSIONS[name];
    
            const queryString = `
                INSERT INTO roles (
                    role_name, 
                    role_description, permissions
                ) 
                VALUES (?, ?, ?)
                `
            const query = this.database.query(queryString)

            query.run(
                name,
                description,
                permissions
            )
        }
    }

    close() {
        if (this.database) {
            logger.info("Gracefully stopping the database");
            
            try {
                this.database.close();
                logger.info("Database closed successfully");
            } catch (err) {
                logger.error("Error closing database:", err);
            }
        }
    }

}

export const db = new SqliteDatabaseServices("concrete")