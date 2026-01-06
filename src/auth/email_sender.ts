// TODO - User CreateTemplate & SendEmail Actions in the docs 
// TODO - Verify email with EmailVerify before sending 

import { 
  SendEmailCommand, 
  CreateTemplateCommand, 
  SendTemplatedEmailCommand,
  ListTemplatesCommand,
  TemplateMetadata
} from "@aws-sdk/client-ses";
import { sesClient } from "../libs/sesClient";
import { getUniqueName } from "../auth/util";
import { logger } from "../logger";
import { User } from "../db/models";


export const LIST_OF_TEMPLATES = "ResetPassword, WelcomeUserEmail,"

// this must run where the app starts
async function createAndRegisterTemplate(template_name: string = ""){
  const TEMPLATE_NAME = "ResetPasswordNew";

  const TEXT_FORMAT_BODY = `
    <h1>Reset Password</h1>
    <p>You requested to reset your password, {{contact.firstName}}.</p>
    <p>Follow this link to reset your password: {{contact.emailResetLink}} </p>
    <p>If it wasn't you, please ignore this message.</p>
  `;

  const createResetPasswordTemplate =  
    new CreateTemplateCommand({
      Template: {
        TemplateName: TEMPLATE_NAME,
        HtmlPart: TEXT_FORMAT_BODY,
        SubjectPart: "POS Ninjas POS: Reset Your Password",
      }
    })
  

  try {
    await sesClient.send(createResetPasswordTemplate);
    console.log(`Template created: ${TEMPLATE_NAME}`);
    return TEMPLATE_NAME;

  } catch(err) {

     if (err === 'AlreadyExists') {
      logger.info('Template already exists');
    } else {
      logger.error("Failed to create template.", err);
      throw err;
    }
    
  }

}

// check if template exists, other than that create it
async function checkIfTemplateExists(template_name: string){
  const createListTemplatesCommand = (maxItems: number) =>
  new ListTemplatesCommand({ MaxItems: maxItems });

  const listTemplatesCommand = createListTemplatesCommand(10);

  try {
    const res = await sesClient.send(listTemplatesCommand);
    const templatesList: TemplateMetadata[] | undefined  = res['TemplatesMetadata']
    
    if (templatesList) {
      return templatesList.some(template => template.Name === template_name)
    } else {
       throw new Error(`Template ${template_name} does not exist, create the password`)
    }

  } catch (err) {
    logger.error("Failed to list templates.", err);
    return err;
  }
  
}

async function sendResetPasswordEmail(email: string, name: string, resetLink: string, template_name: string) {
  
  const cmd = new SendTemplatedEmailCommand({
    Source: "sailewalderbs@gmail.com",  
    Destination: { ToAddresses: [email] },
    Template: template_name,
    TemplateData: JSON.stringify({ 
      contact: { firstName: name, emailResetLink: resetLink },
    })
  });
  
  try {
    const response = await sesClient.send(cmd);
    logger.info(`Email sent to ${email}`);
    return response;
  } catch (err: any) {
    if (err.name === "MessageRejected") {
      logger.error(`Email rejected for ${email}:`, err.message);
    }
    throw err;
  }
}


// create templated email 


const run = async () => {


  // await createAndRegisterTemplate()

  const res = await checkIfTemplateExists("ResetPasswordNew") as boolean

  if (res){
    await sendResetPasswordEmail("sailewalderbs@gmail.com", "Test Name", "/reset-link", "ResetPasswordNew");
  } else {
    logger.error(`Template does not exist, use the list of available Templates ${LIST_OF_TEMPLATES}`)
  }
  
} 

export async function sendPasswordResetEmail(user: User, token: string){

  const res = await checkIfTemplateExists("ResetPasswordNew") as boolean

  // ADD the BASE_URL to the constructed link
  if (res){
    const construct_reset_link = `/reset-link/${token}`
    await sendResetPasswordEmail(user.email, user.first_name, construct_reset_link, "ResetPasswordNew");
  } else {
    logger.error(`Template does not exist, use the list of available Templates ${LIST_OF_TEMPLATES}`)
    // should i throw an error here?
  }

}
