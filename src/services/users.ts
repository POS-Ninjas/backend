import { RecordId, UserRepository } from '../db/repository/user_repo'
import { Database  } from "bun:sqlite"
import { UserResponse, UserDetails } from "../db/repository/user_repo"

export class UserService {

    constructor(private repo: UserRepository){}

    async createUser(userDetails: UserDetails): Promise<number | string> {
        const res = await this.repo.insertNewUser(userDetails)
        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    async updateUserDetails(
        user_id: RecordId, 
        updated_details: UserDetails
    ): Promise<boolean> {
        const res = await this.repo.updateUserDetails(user_id, updated_details)
        if (res){
            return true
        } else {
            return false
        }
    }

    async updateUserPassword(
        userId: number, 
        password: string
    ): Promise<boolean> {
        const res = await this.repo.updateUserPassword(userId, password)
        if (res){
            return true
        } else {
            return false
        }
    }

    doesUserExistsById(id: number): boolean{
        const res = this.repo.doesUserExistsById(id)
        return res
    }

    getAllUsers(): UserResponse[] | string {
        const res = this.repo.getAllUsers()
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserById(id: number): UserResponse | string {
        const res = this.repo.getUserById(id)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByEmail(email: string): UserResponse | string {
        const res = this.repo.getUserByEmail(email)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByUsername(username: string): UserResponse | string {
        const res = this.repo.getUserByUsername(username)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getUserByRolename(role: string): UserResponse[] | string {
        const res = this.repo.getUserByRolename(role)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    } 

    getActiveUsers(): UserResponse[] | string {
        const res = this.repo.getActiveUsers()
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    deleteUserByUsername(username: string): void {
        this.repo.deleteUser(username)
    }

    deleteUserById(user_id: number): void {
        this.repo.deleteUserById(user_id)
    }

}