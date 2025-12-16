import { MailSlurp } from "mailslurp-client"
import * as crossfetch from "cross-fetch"

const key = process.env.EMAIL_API_KEY as string

const mailslurp = new MailSlurp({ 
    fetchApi: crossfetch.fetch,
    apiKey: key 
})

async function getInbox() {
    const inbox = await mailslurp.createInbox();

    const options = {
        to: ["sailewalderbs@gmail.com"],
        subject: 'Hello',
        body: 'Welcome'
    };

    const sent = await mailslurp.sendEmail(inbox.id, options)
    return inbox
}

getInbox();





