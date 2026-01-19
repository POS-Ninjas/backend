import { Hono } from 'hono'
import { logger as pinologger } from '../logger'
import { authMiddleware } from '../middleware/authenticate'
import { ProductDetails } from '../db/repository/product_repo'
import { jwt, sign } from 'hono/jwt'
import { validate_signup_request_form } from '../auth/signup'

import { db } from '../db_service'
import { validate_login_request_form } from '../auth/login'
import { PasswordResetRequestForm } from '../db/models'
import { sendPasswordResetEmail } from '../auth/email_sender'

export type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  timestamp: string;
};

const user_services = db.users_service()
const users = new Hono()

// these must be auth'd

users
    .post('/users/signup', async (c) => {
        const json_data = await c.req.json()
        const validatedForm = validate_signup_request_form(json_data)

        if ("email" in validatedForm) {

            const res = await user_services.createUser(db.database, validatedForm)

            if (typeof(res) == 'number') {
                pinologger.info("successfully created user, returning response")
                pinologger.info(res)
                return c.json({
                    success: false,
                    message: res,
                    timestamp: new Date().toISOString()
                })
            } else {
                pinologger.info("could not successfully create ")
                return c.json({
                    success: true,
                    data: { "lastInsertRowId" : res},
                    timestamp: new Date().toISOString()
                })
            }

        } else {
            // log the failure but should we add it to the audit table ?
            pinologger.error("Failed to sign up user")
            pinologger.error(validatedForm)
        
            return c.json({
                success: false,
                data: validatedForm,
                timestamp: new Date().toISOString()
            })
        }
    })

users
    .post('users/login', async (c) => {
        const json_data     = await c.req.json()
        const validatedForm = validate_login_request_form(json_data)
    
        let response: ApiResponse
    
        if ("status"  in validatedForm) {
    
            return c.json({
                success: false,
                data: {"reason": validatedForm.reason },
                timestamp: new Date().toISOString()
            })
    
        } else if ("email" in validatedForm) {
    
        const result = (db.getUserByEmail(validatedForm.email))
        
        let stored_password_hash;
    
        if(result && typeof result === 'object' && 'email' in result) {
            stored_password_hash = result.password_hash as string
        } else {
            return c.json({
            success: false,
            data: {"reason":  `user with ${validatedForm.email} email not found`},
            timestamp: new Date().toISOString()
            })
        }
        const isMatch = await Bun.password.verify(validatedForm.password, stored_password_hash as string)
    
        const payload = {
            sub: validatedForm.email,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iss: "pos-app"
        }
    
        const token = await sign(payload, "test-is-secret")
    
        if (isMatch){
            response  = {
                success: true,
                data: { "bearerToken" : token, redirect: '/user/products' },
                timestamp: new Date().toISOString()
            }
    
            // TODO - add action log that user logged in  
            pinologger.info("successfully authenticated user, returning response")
            pinologger.info(response)
    
            return c.json(response)
        } else {
    
            // TODO - add action log that user tried to logged in with wrong password, do for the rest
            return c.json({
            success: false,
            data: {"reason": "Wrong Password, please try again"},
            timestamp: new Date().toISOString()
            })
        }
    
        } else if ("username" in validatedForm) {
    
        const result = db.getUserByUsername(validatedForm)
        let stored_password_hash;
    
        if(result && typeof result === 'object' && 'email' in result) {
            stored_password_hash = result.password_hash
        } else {
    
            return c.json({
                success: false,
                data: {"reason": "could not find user"},
                timestamp: new Date().toISOString()
            })
        }
    
        const isMatch = await Bun.password.verify(validatedForm.password, stored_password_hash)
        const payload = {
            sub: validatedForm.username,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iss: "pos-app"
        }
    
        const token = await sign(payload, "test-is-secret")
        
        if (isMatch){
            response  = {
            success: true,
            data: { "bearerToken": token, redirect: '/user/products' },
            timestamp: new Date().toISOString()
            }
    
            pinologger.info("successfully authenticated user, returning response")
            pinologger.info(response)
    
            return c.json(response)
        } else {
            pinologger.info("could not authenticate user, returning response")
            
            return c.json({
                success: false,
                data: {"reason": "could not authenticate user"},
                timestamp: new Date().toISOString()
            })
        }
        } 
    })

users
    .get('/users', async (c) => {
        pinologger.info("matched /users/")
    })

users
    .get('/users/active', async (c) => {
        pinologger.info("matched /users/active")
        const res = user_services.getActiveUsers(db.database)

        if (typeof(res) == 'string'){
            return c.json({
                success: false,
                message: res,
                timestamp: new Date().toISOString()
            })
        } else {
            return c.json({
                success: true,
                error: res,
                timestamp: new Date().toISOString()
            })
        }
    })

users
    .delete('/users/delete', async (c) => {
        pinologger.info("matched /users/delete?username=<username>")
        const username = c.req.param('username') as unknown as string

        if (username == '') {
            return c.json({
                success: false,
                error: "please enter the username",
                timestamp: new Date().toISOString()
            })
        }

        user_services.deleteUserByUsername(db.database, username)

    })

users
    .get('/users/delete/:id', async (c) => {
        pinologger.info("matched /users/deleete/id")
        const id = c.req.param('id') 

        if (id == '') {
            return c.json({
                success: false,
                error: "please enter the username",
                timestamp: new Date().toISOString()
            })
        }

        user_services.deleteUserById(db.database, id as unknown as number)

    })


export default users