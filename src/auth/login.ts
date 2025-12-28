// validate the details using zod, 
import * as z from "zod";
import { logger } from '../logger'

type LoginRequestForm = LoginRequestWithEmailForm | LoginFormError | LoginRequestWithUsernameForm

type LoginRequestWithUsernameForm = {
    username: string,
    password: string
}

type LoginRequestWithEmailForm = {
    email: string,
    password: string
}

type LoginFormError = {
    status: number
    reason: string
}

function validate_login_request_form(formdata: any): LoginRequestForm {

    if ("username" in formdata){
        
        const UserLoginSchema = z.object({
            username: z.string("Username is required"),
            password: z.string("Password is required").min(6, "Password must be at least 6 characters")
        })

        try {
            const parsedSchema = UserLoginSchema.parse(formdata) 

            const formData: LoginRequestForm = {
                username: parsedSchema.username,
                password: parsedSchema.password
            } 

            // add a logger for validating?
            logger.info("Successfully validated login details of user with username " + formData.username)
            return formData
        } catch (error) {
        
            const err = error as z.ZodError
            
            if (error instanceof z.ZodError) {

                const errorResp: LoginRequestForm = {
                    status: 400,
                    reason: JSON.parse(err.message)[0].message
                }

                logger.error("One of the inputs(username / password / email) is missing. Returning a 400 repsonse. Cause is " + errorResp)
                return errorResp
            }
        }

    } else {

        const UserLoginSchema = z.object({
            email: z.email("Invalid email format"),
            password: z.string().min(6, "Password must be at least 6 characters")
        })

        try {
            const parsedSchema = UserLoginSchema.parse(formdata) 

            const formData: LoginRequestWithEmailForm = {
                email: parsedSchema.email,
                password: parsedSchema.password
            } 

            // add a logger for validating?
            logger.info("Successfully validated login details of user with email " + formData.email)
            return formData
        } catch (error) {
        
            const err = error as z.ZodError
            
            if (error instanceof z.ZodError) {
                const msg = JSON.parse(err.message)[0].message as string

                if (msg.includes("undefined")){

                    const errorResp: LoginRequestForm = {
                        status: 400,
                        reason: "Check inputs: (username / password / email) one is missing"
                    }
                    
                    logger.error("One of the inputs(username / password / email) is missing. Returning a 400 repsonse. Cause is " + errorResp)
                    return errorResp
                } else {
                    const errorResp: LoginRequestForm = {
                        status: 400,
                        reason: msg
                    }

                    logger.error("could not validate the login details. Cause is " + errorResp)
                    return errorResp
                }
            }
        }
    }
    
    const errorResp: LoginRequestForm = {
        status: 500,
        reason: "Internal server error"
    }
    
    logger.error("something went wrong, returning internal server error")
    return errorResp
}

export {
    validate_login_request_form,
    LoginRequestForm,
    LoginRequestWithEmailForm,
    LoginRequestWithUsernameForm
}

