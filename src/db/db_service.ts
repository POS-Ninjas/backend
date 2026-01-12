import { SignupRequestForm } from "../auth/signup";
import { 
    LoginRequestWithEmailForm, 
    LoginRequestWithUsernameForm 
} from "../auth/login";
import { Audit_Log, PasswordResetRequestForm } from "./models"


import { Database  } from "bun:sqlite"
import { logger } from '../logger'
import { UserRepository } from "./repository/user_repo";
import { PasswordResetRepository } from "./repository/password_reset_repo";
import { AuditLogRepository, Log } from "./repository/audit_log_repo";
import { PasswordReset, User } from "./models"
import { ProductService } from "./services/product"
import { Supplier as SupplierService } from "./services/supplier"
import { ProductRepository } from "./repository/product_repo";

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

export class SqliteDatabaseSerevices  {

    private db: Database
    private user_repo: UserRepository
    private password_reset_repo: PasswordResetRepository
    private audit_log_repo: AuditLogRepository

    constructor(db: string){

        if (db == "concrete"){
            this.db = new Database("./concrete.db", {strict: true})
        } else {
            this.db = new Database(":memory:", {strict: true})
        }
        
        this.user_repo           = new UserRepository()
        this.audit_log_repo      = new AuditLogRepository()
        this.password_reset_repo = new PasswordResetRepository()

        this.init(db)
    }

    private async init(db: string){

        logger.info("Starting sqlite database")
        this.db.run('PRAGMA foreign_keys = ON')
        const schema = await Bun.file("./pos_tables.sql").text()

        if (db == "memory"){
            logger.info("running schema in memory")
            this.db.run(schema)
        } else {
            logger.info(`using concrete implementation look for ${this.db.filename} file in project dir`)
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

    async insertNewUser(newUserDetails: SignupRequestForm): Promise<number> {
        const res = await this.user_repo.insertNewUser(this.db, newUserDetails)
        return res as number
    }

    async updateUserPassword(userId: number, updated_password: string): Promise<number> {
        const res = await this.user_repo.updateUserPassword(this.db, userId, updated_password)
        return res as number
    }

    getUserByEmail(email: string): User | string {
        const res = this.user_repo.getUserByEmail(this.db, email)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByUsername(newUserDetails: LoginRequestWithUsernameForm): User | string {
        const res = this.user_repo.getUserByUsername(this.db, newUserDetails.username)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    async insertPasswordResetForm(passwordResetForm: PasswordResetRequestForm): Promise<number | string>{
        const res = await this.password_reset_repo.createPasswordResetRequest(this.db, passwordResetForm)
        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    getPasswordResetRequestByEmail(email: string)  {
        const res = this.password_reset_repo.getPasswordResetRequestByEmail(this.db, email)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async getPasswordResetRequestByUserId(user_id: number)  {
        const res = this.password_reset_repo.getPasswordResetRequestByUserId(this.db, user_id)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async getPasswordResetRequestByExpiry(expires_at: number)  {
        const res = this.password_reset_repo.getPasswordResetRequestByExpiry(this.db, expires_at)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async getPasswordResetRequestByToken(token: string)  {
        const res = this.password_reset_repo.getPasswordResetRequestByToken(this.db, token)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }

    }

    async markTokenasUsed(token: string): Promise<boolean> {
        const res = await this.password_reset_repo.markPasswordResetTokenAsUsed(this.db, token)

        if (typeof res == 'number'){
            return true
        } else {
            return false
        }

    }

    async create_audit_log(log: Log) {
        const res = this.audit_log_repo.create_audit_log(this.db, log)

        if (typeof res == 'number' ){
          return res
        } else {
          return res.error
        }

    }

    get_logs(): Array<Audit_Log> | string {
        const res = this.audit_log_repo.get_all_audit_logs(this.db)
        if (res.success == true ){
            return res.data
        } else {
            return res.error
        }

    }

    get_log_by_user_id(user_id: number): Array<Audit_Log> | string {

        const res = this.audit_log_repo.get_logs_of_user(this.db, user_id)

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
            const query = this.db.query(queryString)

            query.run(
                name,
                description,
                permissions
            )
        }
    }



    close() {
        if (this.db) {
            logger.info("Gracefully stopping the database");
            
            try {
                this.db.close();
                logger.info("Database closed successfully");
            } catch (err) {
                logger.error("Error closing database:", err);
            }
        }
    }

}