import { SignupRequestForm } from "../auth/signup";
import { Database } from "./types";

import { Database as SqliteMemoryDatabase } from "bun:sqlite"
import { logger } from '../logger'

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

export class MemoryDatabase implements Database {

    private db: SqliteMemoryDatabase

    constructor(){
        this.db = new SqliteMemoryDatabase(":memory:", {strict: true} )
        this.init()
    }

    private async init(){
        logger.info("Starting in-memory sqlite database")
        this.db.run('PRAGMA foreign_keys = ON')
        const schema = await Bun.file('./pos_tables.sql').text()

        this.db.run(schema)
        this.insertRoles()
        // Check if table exists and see its structure
        // const tableInfo = this.db.query(`PRAGMA table_info(users)`).all()
        // console.log('Table structure:', tableInfo)

    }

    async insertNewUser(newUserDetails: SignupRequestForm): Promise<number> {
        const queryString = `
            INSERT INTO users (
                username, password_hash,
                first_name, last_name, email,
                role_name, is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        
        const query = this.db.query(queryString)
        
        const roleNames = Object.keys(ROLE_NAMES_AND_DESCRIPTIONS);
        const randomRoleName = roleNames[Math.floor(Math.random() * roleNames.length)];
        const hashed_password = await Bun.password.hash(newUserDetails.password)
        
        const res = query.run(
            newUserDetails.lastname + 23,
            hashed_password,
            newUserDetails.fullname,
            newUserDetails.lastname,
            newUserDetails.email,
            randomRoleName,
            true
        )
        
        // log here that , you inserted in the datadabase, add it to audit table 
        logger.info("successfully inserted user with fullName " + newUserDetails.fullname + " in the database")
        this.db.close(false)
        return res.lastInsertRowid as number
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

    close(){
        this.db.close(true)
    }

}