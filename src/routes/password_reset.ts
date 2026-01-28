import { Hono } from 'hono'

import { db } from '../db_service'
import { PasswordResetRequestForm } from '../db/models'
import { sendPasswordResetEmail } from '../auth/email_sender'


export type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  timestamp: string;
};

const password_reset_service = db.password_service()
const user_service = db.users_service()
const password_reset = new Hono()

password_reset.post('/reset-password', async (c) => {

  const request_data = await c.req.json()
  const user         = db.users_service().getUserByEmail(request_data['email'])

  if (user == null){
    return c.json({
      success: false,
      data: { reason : `user with ${request_data['email']} not found`},
      timestamp: new Date().toISOString()
    })
    
  } else if (user && typeof user === 'object' && 'email' in user) {

    // Multiple reset requests before first expires (invalidate old tokens when new one is created)

    const token = crypto.randomUUID();

    const password_reset_form: PasswordResetRequestForm = {
      user_id: user.user_id,
      email: user.email,
      token: token,
    }

    const res = await password_reset_service.insertPasswordResetForm(password_reset_form)

    if (typeof res == 'number'){

      // send email here
        sendPasswordResetEmail(user, token)

        return c.json({
          success: true,
          // data: {
          //   "redirect-link": `/reset-password/${token}`
          // },
          timestamp: new Date().toISOString()
        })
    } else {
      return c.json({
        success: false,
        data: { reason : res },
        timestamp: new Date().toISOString()
      })
    }
    
  }
})

password_reset.post('/reset-password/:token', async (c) => {

  const token = c.req.param('token')
  const update_password_details = await c.req.json()

  const password: string = update_password_details['password']

  if (password == undefined || password.length < 6 ){
    return c.json({
      success: false,
      data: { reason : "password must be at least 6 characters" },
      timestamp: new Date().toISOString()
    })
  }

  const retrieveRecord = await password_reset_service.getPasswordResetRequestByToken(token) as { success: boolean, data: any }

  if (retrieveRecord['data'] == null) {
      return c.json({
        success: false,
        data: { reason : "token doesn't exist in DB" },
        timestamp: new Date().toISOString()
      })
  } else {
    
    const expiry = new Date(retrieveRecord['data']['expires_at']).getTime()

    if (Date.now() > expiry){
      return c.json({
        success: false,
        data: { reason : "token has expired" },
        timestamp: new Date().toISOString()
      })
    } else {

      const getToken = await password_reset_service.getPasswordResetRequestByToken(token) as { success: boolean, data: any}
      const isTokenUsed = getToken['data']['used_at'] != null

      if (isTokenUsed){
        
        return c.json({
          success: false,
          data: { reason : "token has been used" },
          timestamp: new Date().toISOString()
        })

      } else {
        const res = await user_service.updateUserPassword(
          retrieveRecord['data']['user_id'], 
          update_password_details['password']
        )

        const markTokenAsUsed = await password_reset_service.markTokenasUsed(token)

        if (markTokenAsUsed){
          return c.json({
            success: true,
            data: "user password updated successfully",
            timestamp: new Date().toISOString()
          })

        } else {

          return c.json({
            success: false,
            data: "user password update was not successful",
            timestamp: new Date().toISOString()
          })
        }
      }
    }
  }
})

export default password_reset