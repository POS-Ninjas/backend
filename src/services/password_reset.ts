import { PasswordResetRequestForm } from "../db/models";
import { PasswordResetRepository } from "../db/repository/password_reset_repo";

export class PasswordResetService {

    constructor(private repo: PasswordResetRepository){}

    async insertPasswordResetForm(passwordResetForm: PasswordResetRequestForm): Promise<number | string>{
        const res = await this.repo.createPasswordResetRequest(passwordResetForm)
        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    getPasswordResetRequestByEmail(email: string)  {
        const res = this.repo.getPasswordResetRequestByEmail(email)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }
    }

    async getPasswordResetRequestByUserId(user_id: number)  {
        const res = this.repo.getPasswordResetRequestByUserId(user_id)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }
    }

    async getPasswordResetRequestByExpiry(expires_at: number)  {
        const res = this.repo.getPasswordResetRequestByExpiry(expires_at)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }
    }

    async getPasswordResetRequestByToken(token: string)  {
        const res = this.repo.getPasswordResetRequestByToken(token)
        if (res.success == true ){
            return res
        } else {
            return res.error
        }
    }


    async markTokenasUsed(token: string): Promise<boolean> {
        const res = await this.repo.markPasswordResetTokenAsUsed(token)

        if (typeof res == 'number'){
            return true
        } else {
            return false
        }
    }

}
