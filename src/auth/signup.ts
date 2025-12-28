// get the details, validate them, check if they are in the database, 
// authenticate them and redirect them to the login page

import * as z from "zod";
import { logger } from '../logger'

type SignupRequestForm = {
    username: string,
    fullname: string,
    lastname: string,
    email: string,
    phone_number: string,
    password: string
}

type SignupRequestFormError = {
    status: number
    reason: string
}

function validate_signup_request_form(formdata: any): SignupRequestForm | SignupRequestFormError {
    const UserSignUpSchema = z.object({
        username: z.string("Username is required"),
        fullname: z.string().min(2, "Full name is required"),
        lastname: z.string().min(2, "Last name is required"),
        email: z.email("Invalid email format"),
        phone_number: z.string()
            .min(1, "Phone number is required")
            .length(10, "Phone number must be equal to 10 digits")
            .regex(/^\d+$/, "Phone must be numbers only"),
        password: z.string().min(6, "Password must be at least 6 characters")
    })

    try {
        const parsedSchema = UserSignUpSchema.parse(formdata) 

        const formData: SignupRequestForm = {
            username: parsedSchema.username,
            fullname: parsedSchema.fullname,
            lastname: parsedSchema.lastname,
            email: parsedSchema.email,
            phone_number: parsedSchema.phone_number,
            password: parsedSchema.password
        } 

        logger.info("Successfully validated signup details of user with username " + formData.username)
        return formData
    } catch (error) {
    
        const err = error as z.ZodError
         
        if (error instanceof z.ZodError) {
            const errorResp: SignupRequestFormError = {
                status: 400,
                reason: JSON.parse(err.message)[0].message
            }
            logger.error("could not validate the signup details. Cause is " + errorResp)
            return errorResp
        }
        
        const errorResp: SignupRequestFormError = {
            status: 500,
            reason: "Internal server error"
        }
        
     
        logger.error("could not validate the signup form details. Cause is " + errorResp)
        return errorResp
    }
}

export {
    validate_signup_request_form,
    SignupRequestForm,
    SignupRequestFormError
}
