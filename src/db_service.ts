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
import { ProductService } from "./services/product"
import { SupplierService } from "./services/supplier"
import { UserService } from "./services/users";
import { ProductRepository } from "./db/repository/product_repo";
import { SupplierRepository } from "./db/repository/supplier_repo";

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
    private users_repo: UserRepository
    private password_reset_repo: PasswordResetRepository
    private audit_log_repo: AuditLogRepository
    private products_repo: ProductRepository
    private suppliers_repo: SupplierRepository

    constructor(db: string){

        if (db == "concrete"){
            this.database = new Database("./test.db", {strict: true})
        } else {
            this.database = new Database(":memory:", {strict: true})
        }
        
        this.users_repo          = new UserRepository(this.database)
        this.audit_log_repo      = new AuditLogRepository()
        this.password_reset_repo = new PasswordResetRepository()
        this.products_repo       = new ProductRepository(this.database)
        this.suppliers_repo      = new SupplierRepository(this.database)

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

    // pass the db cxn here 
    product_service(){
        return new ProductService(this.products_repo)
    }

    supplier_service(){
        return new SupplierService(this.suppliers_repo)
    }

    users_service(){
        return new UserService(this.users_repo)
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