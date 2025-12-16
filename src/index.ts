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

    const result = (await db.getUserByEmail(validatedForm))
    
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
    console.log('+++' )
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
          data: { "Bearer Token" : token, redirect: '/user/products' },
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
    console.log('+++' + token)

    if (isMatch){
      response  = {
        success: true,
        data: { "Bearer Token": token, redirect: '/user/products' },
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