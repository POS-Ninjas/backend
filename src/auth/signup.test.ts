import { describe, expect, it } from 'bun:test'
import app from '../index'
import { SignupRequestForm } from './signup'

describe('user signup flow', () => {

    const requestBody: SignupRequestForm = {
      username: "Test User name",
      fullname: "Test Full Name",
      lastname: "Test last name",
      email: "test@gmail.com",
      phone_number: "0244123456",
      password: "erereere"
    }

    const headers = {
      "Authorization": "Bearer honoiscool"
    }

  it('should return 200 Response when user tries to sign up with valid details', async () => {

    const req = new Request('http://localhost:5000/auth/signup', {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: headers
    })

    const res = await app.fetch(req)
    const contents = await res.json()
    expect(res.status).toBe(200)    
    expect(contents.success).toBe(true)
    
  })

  describe('with graceful error handling when signing up with invalid/malformed details', async () => {

    // check password, email, username individually,

    it("when Full Name is empty ", async () => {
          const malformedBody: SignupRequestForm = {
            username: "Test User name",
            fullname: "",
            lastname: "Test last name",
            email: "test@gmail.com",
            phone_number: "0244123456",
            password: "erereere"
          }

          const req = new Request('http://localhost:5000/auth/signup', {
            method: "POST",
            body: JSON.stringify(malformedBody),
            headers: headers
          })

          const res = await app.fetch(req)
          const contents = await res.json()
    
          expect(res.status).toBe(200)
          expect(contents.data.reason).toBe("Full name is required")
          expect(contents.success).toBe(false)

    })

    it("when Last Name is empty ", async () => {
          const malformedBody: SignupRequestForm = {
                  username: "Test User name",
            fullname: "Test Full Name",
            lastname: "",
            email: "test@gmail.com",
            phone_number: "0244123456",
            password: "erereere"
          }

          const req = new Request('http://localhost:5000/auth/signup', {
            method: "POST",
            body: JSON.stringify(malformedBody),
            headers: headers
          })

          const res = await app.fetch(req)
          const contents = await res.json()
    
          expect(res.status).toBe(200)
          expect(contents.data.reason).toBe("Last name is required")
          expect(contents.success).toBe(false)

    })

    it("when email is invalid", async () => {
        const malformedBody: SignupRequestForm = {
          username: "Test User name",
          fullname: "Test Full Name",
          lastname: "Test Last Name",
          email: "test-=gmailcom",
          phone_number: "0244123456",
          password: "erereere"
        }

        const req = new Request('http://localhost:5000/auth/signup', {
          method: "POST",
          body: JSON.stringify(malformedBody),
          headers: headers
        })

        const res = await app.fetch(req)
        const contents = await res.json()
  
        expect(res.status).toBe(200)
        expect(contents.data.reason).toBe("Invalid email format")
        expect(contents.success).toBe(false)
    })

    it("when phone number is not equal to 10-digits", async () => {

      const malformedBody: SignupRequestForm = {
        username: "Test User name",
        fullname: "Test Full Name",
        lastname: "Test Last Name",
        email: "test@gmail.com",
        phone_number: "024412",
        password: "erereere"
      }

      const req = new Request('http://localhost:5000/auth/signup', {
        method: "POST",
        body: JSON.stringify(malformedBody),
        headers: headers
      })

      const res      = await app.fetch(req)
      const contents = await res.json()

      expect(res.status).toBe(200)
      expect(contents.data.reason).toBe("Phone number must be equal to 10 digits")
      expect(contents.success).toBe(false)

    })

    it("phone number is empty", async () => {
        
        const malformedBody: SignupRequestForm = {
          username: "Test User name",
          fullname: "Test Full Name",
          lastname: "Test Last Name",
          email: "test@gmail.com",
          phone_number: "",
          password: "erereere"
        }

        const req = new Request('http://localhost:5000/auth/signup', {
          method: "POST",
          body: JSON.stringify(malformedBody),
          headers: headers
        })

        const res = await app.fetch(req)
        const contents = await res.json()
  
        expect(res.status).toBe(200)
        expect(contents.data.reason).toBe("Phone number is required")
        expect(contents.success).toBe(false)

    })

    it("password must be at least 6 characters", async () => {
        const malformedBody: SignupRequestForm = {
          username: "Test User name",
          fullname: "Test Full Name",
          lastname: "Test Last Name",
          email: "test@gmail.com",
          phone_number: "0244123456",
          password: "erer"
        }

        const req = new Request('http://localhost:5000/auth/signup', {
          method: "POST",
          body: JSON.stringify(malformedBody),
          headers: headers
        })

        const res = await app.fetch(req)
        const contents = await res.json()
  
        expect(res.status).toBe(200)
        expect(contents.data.reason).toBe("Password must be at least 6 characters")
        expect(contents.success).toBe(false)
    })

  })

})