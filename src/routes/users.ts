import { Hono } from 'hono'
import { logger as pinologger } from '../logger'
import { sign } from 'hono/jwt'
import { validate_signup_request_form } from '../auth/signup'

import { db } from '../db_service'
import { validate_login_request_form } from '../auth/login'
import { UserDetails } from '../db/repository/user_repo'
import { success } from 'zod'

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

            const res = await user_services.createUser( validatedForm)

            if (typeof(res) == 'number') {
                pinologger.info("successfully created user, returning response")
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
    
        const result = user_services.getUserByEmail( validatedForm.email)
        
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
    
        const result = user_services.getUserByUsername( validatedForm.username)
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
    .get('/users/all', async (c) => {
        pinologger.info("matched /users/all")
        const res = user_services.getAllUsers()

        return c.json({
            success: true,
            data: res,
            timestamp: new Date().toISOString()
        })
    })

users
    .get('/users/active', async (c) => {
        pinologger.info("matched /users/active")
        const res = user_services.getActiveUsers()

        if (typeof(res) == 'string'){
            return c.json({
                success: false,
                message: res,
                timestamp: new Date().toISOString()
            })
        } else {
  
            return c.json({
                success: true,
                data: res,
                timestamp: new Date().toISOString()
            })
        }
    })

users
    .get('/users/:id', async (c) => { 
        const id   = c.req.param('id') as unknown as number
        const user = user_services.getUserById(id)

        if (typeof(user) == 'string'){
            return c.json({
                success: false,
                error: `user with ${id} not found`,
                timestamp: new Date().toISOString()
            }, 404)
            
        } else {
            return c.json({
                success: true,
                data: user,
                timestamp: new Date().toISOString()
            })
        }
    })


users
    .get('/users', async (c) => {
        pinologger.info("matched /users")
        const email    = c.req.query('email')
        const username = c.req.query('username')
        const role     = c.req.query('role')

        if (email == ''){
            return c.json({
                success: false,
                error: "please enter the email of user",
                timestamp: new Date().toISOString()
            }, 400)
        } else if (username == ''){
            return c.json({
                success: false,
                error: "please enter the name of user",
                timestamp: new Date().toISOString()
            }, 400)
        } else if (role == ''){
            return c.json({
                success: false,
                error: "please enter the product code",
                timestamp: new Date().toISOString()
            }, 400)
        }

        if (email){
            pinologger.info("matched /users?email=")
            const user = user_services.getUserByEmail(email)

            if (typeof user == 'string'){
                return c.json({
                    success: false,
                    error: user,
                    timestamp: new Date().toISOString()
                }, 422)
            } else if (user == null) {
                return c.json({
                    success: false,
                    error: `user with ${role} role not found`,
                    timestamp: new Date().toISOString()
                }, 404)
            } 
            
            return c.json({
                success: true,
                data: user,
                timestamp: new Date().toISOString()
            })
        }

        if (username){
            pinologger.info("matched /users?username=")
            
            const user = user_services.getUserByUsername(username)

            if (typeof user == 'string'){
                return c.json({
                    success: false,
                    error: user,
                    timestamp: new Date().toISOString()
                }, 422)
            } else if (user == null) {
                return c.json({
                    success: false,
                    error: `user with ${username} username not found`,
                    timestamp: new Date().toISOString()
                }, 404)
            }
            
            return c.json({
                success: true,
                data: user,
                timestamp: new Date().toISOString()
            })
        }

        if (role){

            pinologger.info("matched /users?role")
            const user = user_services.getUserByRolename(role)

            if (typeof user == 'string'){
                return c.json({
                    success: false,
                    error: user,
                    timestamp: new Date().toISOString()
                }, 422)
            } else if (user == null) {
                return c.json({
                    success: false,
                    error: `user with ${role} role not found`,
                    timestamp: new Date().toISOString()
                }, 404)
            }
            
            return c.json({
                success: true,
                data: user,
                timestamp: new Date().toISOString()
            })
            
        }
    })


users
    .patch('/users/:id', async (c) => {
        pinologger.info("matched /users/delete?username=<username>")
        const id   = c.req.param('id') 
        const user_details = c.req.json() as unknown as UserDetails

        if (id == '') {
            return c.json({
                success: false,
                error: "please enter the id of user",
                timestamp: new Date().toISOString()
            })
        }

        const does_user_exist = user_services.doesUserExistsById( id as unknown as number)

        const parsed_id = id as unknown as number 
        const res = await user_services.updateUserDetails( parsed_id, user_details)

        if(res){
            return c.json({
                success: true,
                error: `User details with ${id} successfully updated`,
                timestamp: new Date().toISOString()
            })
        } else {
            return c.json({
                success: false,
                error: `User details with ${id} could not be successfully updated`,
                timestamp: new Date().toISOString()
            })
        }
    })

// delete by username?
users
    .delete('/users/delete', async (c) => {
        pinologger.info("matched /users/delete?username=<username>")
        const username = c.req.query('username') as unknown as string

        if (username == '') {
            return c.json({
                success: false,
                error: "please enter the username",
                timestamp: new Date().toISOString()
            })
        }

        user_services.deleteUserByUsername(username)
    })

users
    .delete('/users/delete/:id', async (c) => {
        pinologger.info("matched /users/delete/id")
        const id = c.req.param('id') 

        if (id == '') {
            return c.json({
                success: false,
                error: "please enter the username",
                timestamp: new Date().toISOString()
            })
        }

        user_services.deleteUserById(id as unknown as number)
    })

export default users