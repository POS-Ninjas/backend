import { logger as pinologger } from './logger'

import { poweredBy } from 'hono/powered-by'
import { Hono } from 'hono'

import { bearerAuth } from 'hono/bearer-auth'

import { db } from './db_service'

import  products  from './routes/products'
import  suppliers  from './routes/suppliers'
import users from './routes/users'
import { cors } from 'hono/cors'
import password_reset from './routes/password_reset'

const app = new Hono()

async function bootstrap(){
  pinologger.info("App started")
}

app.use(poweredBy())

const token = 'honoiscool'

app.use('/api/*', cors())

app.use(
  '/auth/*',
  bearerAuth({
    token
  })
)

// create health routes
app.route('/', users)
app.route('/', products)
app.route('/', suppliers)
app.route('/', password_reset)

export default {
  port: 5000,
  fetch: app.fetch,
}

process.on("SIGINT", () => { 
  db.close() 
  process.exit(0)
}); 