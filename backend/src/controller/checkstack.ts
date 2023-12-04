import * as AWS from 'aws-sdk';
import { Request, Response } from 'express';
import * as dotenv from "dotenv";
dotenv.config();

export async function checkStackHandler(req: Request, res: Response) {
  const { stackName, roleArn, externalId } = req.body as {
    stackName: string;
    // region: string;
    roleArn: string;
    externalId: string;
  };

  // We will use the region provided in the body. If not provided, we will use the region from environment variables
  // const region = reqRegion || process.env.AWS_REGION;

  // Create initial credentials object for your account
  const myCredentials = new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  });

  const sts = new AWS.STS({ credentials: myCredentials});
  const assumeRoleParams: AWS.STS.AssumeRoleRequest = {
    RoleArn: roleArn,
    RoleSessionName: 'AssumeRoleSession',
    ExternalId: externalId
  };

  try {
    // Assume the desired role
    const data = await sts.assumeRole(assumeRoleParams).promise();
    const credentials = data.Credentials;

    // Create a new CloudFormation client with the assumed role credentials
    const assumedCredentials = new AWS.Credentials({
      accessKeyId: credentials?.AccessKeyId as string,
      secretAccessKey: credentials?.SecretAccessKey as string,
      sessionToken: credentials?.SessionToken
    });
    const cloudFormation = new AWS.CloudFormation({ credentials: assumedCredentials });

    const checkStackStatusParams: AWS.CloudFormation.DescribeStacksInput = {
      StackName: stackName
    };

    // Check the CloudFormation stack status
    const stackData = await cloudFormation.describeStacks(checkStackStatusParams).promise();
    const stack = stackData.Stacks?.[0];
    const stackStatus = stack?.StackStatus;

    console.log('Stack Status:', stackStatus);
    
    // Reset credentials after the operation
    assumedCredentials.expireTime = new Date();
    
    return res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
}
