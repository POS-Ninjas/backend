// define the Database Service with all the requied methods
import { SignupRequestForm } from '../auth/signup'
import { User } from './models'

// remove the functions in this and put it UserRepo, pass the db around
type RecordId = number
export interface Database {

    insertNewUser(user: SignupRequestForm): Promise<RecordId>
    // getAllUsers(): Promise<Array<User>>

}

