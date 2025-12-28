import { SESClient } from "@aws-sdk/client-ses";

// Set the AWS Region - replace with your preferred region
const REGION = "us-east-1"; // Change this to your AWS region

// Create SES service object
const sesClient = new SESClient({ region: REGION });

export { sesClient };
