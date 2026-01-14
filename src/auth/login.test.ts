// write tests

// email, username and password validation 

import { beforeAll, describe, expect, it } from 'bun:test'
import app from '../index'
import { LoginRequestForm } from './login'
import { seedUsers } from '../scripts/seed'
import { Database } from 'bun:sqlite'

describe('user login flow', () => {

  let users: {
      emailUser: string
      usernameUser: string
      password: string
  }

  let requestBodyWithEmail: {
      email: string;
      password: string;
  }

  let requestBodyWithUsername: {
    username: string;
    password: string;
  }


  beforeAll(async () => {
    users =  await seedUsers(new Database('./concrete.db', { strict : true}))

    requestBodyWithEmail = {
      "email": users.emailUser,
      "password": users.password
    }

    requestBodyWithUsername = {
      "username": users.usernameUser,
      "password": users.password
    }

  })

  it('should return 200 Response when user tries to login with valid username and password', async () => {

    const req = new Request('http://localhost:5000/login', {
      method: "POST",
      body: JSON.stringify(requestBodyWithUsername),
    })

    const res      = await app.fetch(req)
    const contents = await res.json()
    
    expect(res.status).toBe(200)    
    expect(contents.success).toBe(true)
    
  })

  it('should return 200 Response when user tries to login with valid email and password', async () => {

    const req = new Request('http://localhost:5000/login', {
      method: "POST",
      body: JSON.stringify(requestBodyWithEmail),
    })

    const res = await app.fetch(req)
    const contents = await res.json()
    console.log(contents)

    expect(res.status).toBe(200)   
    expect(contents.success).toBe(true)
    
  })

  describe('with graceful error handling when signing up with invalid/malformed details', async () => {

    it("when Username is empty ", async () => {
          const malformedBody: LoginRequestForm = {
            username: "",
            password: "erereere"
          }

          const req = new Request('http://localhost:5000/login', {
            method: "POST",
            body: JSON.stringify(malformedBody)
          })

          const res = await app.fetch(req)
          const contents = await res.json()
    
          expect(res.status).toBe(200)
          expect(contents.success).toBe(false)

    })

    it("when email is invalid", async () => {
        const malformedBody: LoginRequestForm = {
          email: "test-=gmailcom",
          password: "erereere"
        }

        const req = new Request('http://localhost:5000/login', {
          method: "POST",
          body: JSON.stringify(malformedBody),
        })

        const res = await app.fetch(req)
        const contents = await res.json()
  
        expect(res.status).toBe(200)
        expect(contents.data.reason).toBe("Invalid email format")
        expect(contents.success).toBe(false)
    })


    it("password must be at least 6 characters", async () => {
        const malformedBody: LoginRequestForm = {
          username: "Test User name",
          password: "erer"
        }

        const req = new Request('http://localhost:5000/login', {
          method: "POST",
          body: JSON.stringify(malformedBody),
           
        })

        const res = await app.fetch(req)
        const contents = await res.json()
  
        expect(res.status).toBe(200)
        expect(contents.data.reason).toBe("Password must be at least 6 characters")
        expect(contents.success).toBe(false)
    })

  })

})