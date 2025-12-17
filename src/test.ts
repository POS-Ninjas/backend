
import { Hono } from 'hono'

import { jwt, sign } from 'hono/jwt'

const app = new Hono()
const secret = 'it-is-very-secret'

// First, generate a JWT token
const payload = {
  sub: "1234567890",
  name: "John Doe",
  lat: Math.floor(Date.now() / 1000),
  iss: "my-trusted-issuer"
}

const token = sign(payload, secret)
console.log("Test token:", token) // Use this token in your request

app.use(
  '/test',
  jwt({
    secret: secret,
  })
)

app.get('/test', (c) => {
  const payload = c.get('jwtPayload')
  if(payload){
    console.log("mediums")
  } else {
    console.log("soft")
  }
  return c.json(payload)
})

export default {
  port: 6080,
  fetch: app.fetch,
}