import { RecordId, UserRepository } from '../db/repository/user_repo'
import { Database  } from "bun:sqlite"
import { UserResponse, UserDetails } from "../db/repository/user_repo"

export class UserService {

    private repo: UserRepository
    constructor(){
        this.repo = new UserRepository()
    }

    async createUser(db: Database, userDetails: UserDetails): Promise<number | string> {
        const res = await this.repo.insertNewUser(db, userDetails)
        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    async updateUserDetails(db: Database, user_id: RecordId, updated_details: UserDetails): Promise<boolean> {
        const res = await this.repo.updateUserDetails(db, user_id, updated_details)
        if (res){
            return true
        } else {
            return false
        }
    }

    async updateUserPassword(db: Database, userId: number, password: string): Promise<boolean> {
        const res = await this.repo.updateUserPassword(db, userId, password)
        if (res){
            return true
        } else {
            return false
        }
    }

    getAllUsers(db: Database): UserResponse[] | string {
        const res = this.repo.getAllUsers(db)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByEmail(db: Database, email: string): UserResponse | string {
        const res = this.repo.getUserByEmail(db, email)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByUsername(db: Database, username: string): UserResponse | string {
        const res = this.repo.getUserByUsername(db, username)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByRolename(db: Database, role: string): UserResponse[] | string {
        const res = this.repo.getUserByRolename(db, role)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    } 

    getActiveUsers(db: Database): UserResponse[] | string {
        const res = this.repo.getActiveUsers(db)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    deleteUserByUsername(db: Database, username: string): void {
        this.repo.deleteUser(db, username)
    }

    deleteUserById(db: Database, user_id: number): void {
        this.repo.deleteUserById(db, user_id)
    }

}