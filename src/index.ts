import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { logger as pinologger } from './logger'

import { poweredBy } from 'hono/powered-by'
import { Hono } from 'hono'

import { bearerAuth } from 'hono/bearer-auth'
import { jwt, sign } from 'hono/jwt'
import { validate_signup_request_form } from './auth/signup'

import { SqliteDatabase } from './db/db_service'
import {  validate_login_request_form } from './auth/login'
import { PasswordResetRequestForm } from './db/models'

const app = new Hono()

type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  timestamp: string;
};

// app.use('/static/*', serveStatic({ root: './'}))
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))
// app.use(logger())
app.use(poweredBy())

const token = 'honoiscool'

const db = new SqliteDatabase("concrete")
// app.use(
//   '/auth/*',
//   jwt({
//     secret: token 
//   })
// )

app.use(
  '/auth/*',
  bearerAuth({
    token
  })
)

app.post('/auth/signup', async (c) => { 

  const json_data = await c.req.json()
  const validatedForm = validate_signup_request_form(json_data)

  let response: ApiResponse

  if ("email" in validatedForm) {

    const res = await db.insertNewUser(validatedForm)

    if (!(res > 0)) {
      response  = {
        success: false,
        data: res,
        timestamp: new Date().toISOString()
      }
    } else {
      response  = {
        success: true,
        data: { "lastInsertRowId" : res},
        timestamp: new Date().toISOString()
      }
    }
    
    // log here that , you successfully created a new user, add it to the audit table 
    pinologger.info("successfully created user, returning response")
    pinologger.info(response)

    return c.json(response)

  } else {

    // log the failure but should we add it to the audit table ?
    pinologger.error("Failed to sign up user ")
    pinologger.error(validatedForm)


    response = {
      success: false,
      data: validatedForm,
      timestamp: new Date().toISOString()
    }
  
    return c.json(response)
  }

})

app.post('/login', async (c) => { 

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

    const result = (await db.getUserByEmail(validatedForm.email))
    
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

      pinologger.info("successfully authenticated user, returning response")
      pinologger.info(response)

      return c.json(response)
    } else {
      return c.json({
        success: false,
        data: {"reason": "Wrong Password, please try again"},
        timestamp: new Date().toISOString()
      })
    }

  } else if ("username" in validatedForm) {

    const result = (await db.getUserByUsername(validatedForm))
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

app.post('/reset-password', async (c) => {

  const request_data = await c.req.json()
  const user         = await db.getUserByEmail(request_data['email'])

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

    const res = await db.insertPasswordResetForm(password_reset_form)

    if (typeof res == 'number'){
        return c.json({
          success: true,
          data: {
            "redirect-link": `/reset-password/${token}`
          },
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

app.post('/reset-password/:token', async (c) => {

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

  const retrieveRecord = await db.getPasswordResetRequestByToken(token) as { success: boolean, data: any }

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

      const getToken = await db.getPasswordResetRequestByToken(token) as { success: boolean, data: any}
      const isTokenUsed = getToken['data']['used_at'] != null

      if (isTokenUsed){
        
        return c.json({
          success: false,
          data: { reason : "token has been used" },
          timestamp: new Date().toISOString()
        })

      } else {
        const res = await db.updateUserPassword(
          retrieveRecord['data']['user_id'], 
          update_password_details['password']
        )

        const markTokenAsUsed = await db.markTokenasUsed(token)

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

app.get('/', (c) => c.text('You can access: /static/hello.txt'))
app.get(
  '/static/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) =>
      path.replace(/^\/static/, '/static'),
  })
)

app.get('*', serveStatic({ path: './static/fallback.txt' }))

export default {
  port: 5000,
  fetch: app.fetch,
}

process.on("SIGINT", () => { 
  db.close() 
  process.exit(0)
}); 