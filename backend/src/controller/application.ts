import { Request, Response } from "express";
import { get } from "lodash";
import {
  createApplication,
  findAndUpdate,
  deleteApplication,
  findApplication,
  findAllApplications,
  findOwner,
  findProject,
  findCluster,
  updateEnvVariable,
  increasedeploycount
} from "../service/application";

import {

  findCluster as discoverCluster,

} from "../service/cluster";

 import {executeScriptAndGetVPA} from "../utils/cron";

import axios, { AxiosResponse } from 'axios';
import AWS from 'aws-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

interface JenkinsResponseData {
  queueItem?: {
    executable?: {
      number?: number;
    };
  };
}

// Configure AWS credentials
const credentials = new AWS.Credentials({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
});

const ec2 = new AWS.EC2({
  credentials,
  region: process.env.AWS_REGION,
  apiVersion: '2016-11-15'
});

  // Configure Jenkins credentials and URL
  const username = process.env.JENKINS_USERNAME as string;
  const password: string = process.env.JENKINS_PASSWORD as string;
  const jobName: string = process.env.JENKINS_DEPLOY_JOB_NAME as string;


  
  export async function getPublicIpAddress(instanceId: string): Promise<string> {

    const params: AWS.EC2.DescribeInstanceStatusRequest = {
      InstanceIds: [instanceId],
      IncludeAllInstances: true,
    };
  
    try {
      const response = await ec2.describeInstanceStatus(params).promise();
      const instanceStatuses = response.InstanceStatuses;
  
      if (instanceStatuses && instanceStatuses.length > 0) {
        const instanceId = instanceStatuses[0].InstanceId;
  
        if (instanceId) {
          const descParams: AWS.EC2.DescribeInstancesRequest = {
            InstanceIds: [instanceId],
          };
          const descResponse = await ec2.describeInstances(descParams).promise();
          const ipAddress = descResponse.Reservations?.[0].Instances?.[0].PublicIpAddress;
  
          if (ipAddress) {
            return "http://"+ipAddress+":8080";
          }
        }
      }
  
      throw new Error('Public IP address not found for the instance');
    } catch (error) {
      console.error('Error retrieving public IP address:', error);
      throw error;
    }
  }
  

  export async function isJenkinsUrlValid(jenkinsUrl: string): Promise<boolean> {
    try {
      const instanceId:string =  process.env.INSTANCE_ID as string;
      await getPublicIpAddress(instanceId);
      return true;
    } catch (error: any) {
      if (error.response) {
        // Response received with non-2xx status code
        return false;
      } else if (error.request) {
        // No response received
        return false;
      } else {
        // Other error occurred
        return false;
      }
    }
  }

  function createParametersQueryString(parameters: Record<string, string | number | object>): string {
    const parameterPairs = Object.entries(parameters)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      });
    return parameterPairs.join('&');
}

  // export async function getQueueItemDetails(itemNumber: number,jenkinsUrl:string) {
  //   try {
  //     const url = `${jenkinsUrl}/queue/item/${itemNumber}/api/json`;
  //     console.log(url);
  //     const response = await axios.get(url, {
  //       auth: {
  //         username: username,
  //         password: password
  //       },
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });
  
  //     const queueItemDetails = response.data.executable.url;
  
  //     const regex = /\/(\d+)\/$/;
  //     const match = regex.exec(queueItemDetails);
  //     const buildNumber = match ? match[1] : null;
  //     console.log(buildNumber);
  //     return buildNumber;
  //   } catch (error : any) {
  //     console.error('Error getting queue item details:', error.message);
  //   }  
  // }

  export async function getQueueItemDetails(itemNumber: number, jenkinsUrl: string) {
    const maxAttempts = 5;
    const delayBetweenAttempts = 5000; // in milliseconds
  
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const url = `${jenkinsUrl}/queue/item/${itemNumber}/api/json`;
        console.log(`Attempt ${attempt}: ${url}`);
        const response = await axios.get(url, {
          auth: {
            username: username,
            password: password
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        if (response.data.executable && response.data.executable.url) {
          const queueItemDetails = response.data.executable.url;
          const regex = /\/(\d+)\/$/;
          const match = regex.exec(queueItemDetails);
          return match ? match[1] : null;
        } else {
          console.log('Executable not available yet, retrying...');
          await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        }
      } catch (error : any) {
        console.error('Error getting queue item details:', error.message);
        // Optional: You may choose to retry even in case of error or break out of the loop
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
      }
    }
  
    console.error('Failed to retrieve the build number after several attempts');
    return null;
  }
  


export async function createApplicationHandler(req: Request, res: Response) {
  const body: any = req.body;
  const action: string = 'Apply';
  const clusterId = req.body.clusterId;
  const Cluster = await discoverCluster( {clusterId} );
  if (!Cluster) {
     return res.status(404).send("Cluster Not Found");
  }
  const bucketName = Cluster.bucketName;

  const accountId = body.arn;
  const arnSuffix = ":role/cool_customer";
  const arn = `arn:aws:iam::${accountId}${arnSuffix}`;

  const parameters: Record<string, string | number | object > = {
    appName: req.body.appName,
    gitRepository: req.body.gitRepository,
    gitPath: req.body.gitPath,
    repoType: req.body.repoType,
    rootPath: req.body.rootPath,
    gitBranch: req.body.gitBranch,
    region: req.body.region,
    clusterId: req.body.clusterId,
    projId: req.body.projId,
    orgId: req.body.orgId,
    replicas : req.body.replicas,
    installId: req.body.installId,
    memory: req.body.memory + 'Mi',
    envVariables:req.body.envVariables || {},
    cpu: req.body.cpu + 'm',
    buildMode: req.body.buildMode,
    port: req.body.port,
    env: req.body.env,
    isInstalled: req.body.isInstalled,
    username_github: req.body.username_github,
    arn: arn,
    bucketName : bucketName,
    clusterName : req.body.clusterName,
    external_id: req.body.external_id,
    registry: req.body.registry,
    ownerId: req.body.ownerId,
    github_token :req.body.github_token,
    ACTION: action
  };

  const parametersQueryString = createParametersQueryString(parameters);

  // console.log(parametersQueryString);

  const canDeployResult = await increasedeploycount(req.body.ownerId);
  console.log(canDeployResult, "canDeploy");
 
  const instanceId:string =  process.env.INSTANCE_ID as string;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);

  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    // Handle error response
    return res.status(500).send('Invalid Jenkins URL');
  }
  

  const buildTriggerUrl: string = `${jenkinsUrl}/job/${jobName}/buildWithParameters?${parametersQueryString}`;
  try {
    const response: AxiosResponse<JenkinsResponseData> = await axios.post(buildTriggerUrl, {}, {
      auth: {
        username,
        password
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    const url = response.headers.location;
    console.log('Build triggered successfully',url);
    const regex = /\/queue\/item\/(\d+)\//;
    const matches = url.match(regex);
    const itemNumber = matches ? matches[1] : null;
    console.log('Item Number:', itemNumber);
    
    const buildNumber = await getQueueItemDetails(itemNumber,jenkinsUrl);

    if (buildNumber) {
      // Add buildNumber to the body object
    
      body.buildNumber = buildNumber;
      const envVariables : object = req.body.envVariables || {};
      const updatedBody = {
        ...body,
        envVariables:envVariables        
      };

      console.log('Updated Body:', updatedBody);
      // Create cluster
      const Application = await createApplication(updatedBody);

      const webhookId = await createWebhook(req.body.github_token, req.body.username_github,req.body.gitRepository, Application.applicationId);
      //Add cron job
      // addCronJob(Application.applicationId, [req.body.arn, req.body.external_id, req.body.region,req.body.clusterName,req.body.username_github,req.body.appName,req.body.installId,Application.applicationId]);
      
      const updatedBody1 = {
        ...body,
        webhookId:webhookId        
      };

      const applicationId = Application.applicationId;

      const updatedApplication = await findAndUpdate({ applicationId }, updatedBody1, {
        new: true,
      });

      // Return the cluster as the response
      return res.status(200).send(updatedApplication);
    } else {
      // Handle case when build number is not available
      console.error('Build number not found');
      // Handle error response
      return res.status(500).send('Build number not found');
    }
  } catch (error: any) {
    console.error('Error triggering pipeline:', error.message);
    // Handle error response
    return res.status(500).send('Error triggering pipeline');
  }
}

export async function getVpaRecommendationController(req: Request, res: Response) {
  try {
      // Call executeScriptAndGetVPA and wait for the result
      const vpaDetails = await executeScriptAndGetVPA([
          req.body.arn,
          req.body.external_id,
          req.body.region,
          req.body.clusterName,
          req.body.username_github,
          req.body.appName,
          req.body.installId
      ]);

      // Send the response back to the client
      res.json(vpaDetails);
  } catch (error) {
      console.error('Error in getVpaRecommendationController: ', error);
      // Send an error response back to the client
      res.status(500).send('Internal Server Error');
  }
}

export async function createWebhook(githubToken:string, username: string, repository:string, applicationId:string) {
  const webhookUrl = `https://apip.visualith.com/webhook/applicationId/${applicationId}`;
  const events = ['push'];

  const apiUrl = `https://api.github.com/repos/${username}/${repository}/hooks`;

  try {
    const response = await axios.post(apiUrl, {
          name: 'web',
          active: true,
          events: events,
          config: {
              url: webhookUrl,
              content_type: 'json'           
          }
      }, {
          headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
          }
      });

        const webhookId = response.data.id;
        console.log('Webhook created with ID:', webhookId);
        return webhookId;
  } catch (error:any) {
      console.error('Error creating webhook:', error);
      throw error;
  }
}

export async function removeWebhook(githubToken: string, username: string, repository: string, webhookId: string): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${username}/${repository}/hooks/${webhookId}`;

  try {
      await axios.delete(apiUrl, {
          headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
          }
      });

      console.log('Webhook removed successfully');
      // You might want to return a success message or handle the success response here.

  } catch (error) {
      console.error('Error removing webhook:', error);
      // You might want to throw the error or handle it accordingly.
  }
}



export async function webhookListener(req: Request, res: Response) {
  try {
      // Log the webhook payload for debugging
      // Check the GitHub event type
    const githubEventType = req.headers['x-github-event'];

    // Proceed only if the event is 'push' (or any other relevant event type)
    if (githubEventType !== 'push') {
        console.log(`Received '${githubEventType}' event. Ignoring.`);
        return res.status(200).send(`Ignored '${githubEventType}' event.`);
    }


  const applicationId = get(req, "params.applicationId");
  const Application = await findApplication({ applicationId });
  const action: string = 'Apply';
  const envVariables : object = req.body.envVariables || {};

  if (!Application) {
    return res.sendStatus(404);
  }

  const clusterId = Application.clusterId;
  const Cluster = await discoverCluster( {clusterId} );
  if (!Cluster) {
     return res.status(404).send("Cluster Not Found");
  }
  const bucketName = Cluster.bucketName;

  const accountId = Application.arn;
  const arnSuffix = ":role/cool_customer";
  const arn = `arn:aws:iam::${accountId}${arnSuffix}`;

  // const bucketName = await initializeResources(arn, Cluster.external_id, Cluster.region);

  const parameters: Record<string, string | number | object > = {
    appName: Application.appName,
    gitRepository: Application.gitRepository,
    gitPath: Application.gitPath,
    repoType: Application.repoType,
    rootPath: Application.rootPath,
    gitBranch: Application.gitBranch,
    region: Application.region,
    clusterId: Application.clusterId,
    projId: Application.projId,
    orgId: Application.orgId,
    installId: Application.installId,
    replicas : Application.replicas,
    memory: Application.memory + 'Mi',
    cpu: Application.cpu + 'm',
    buildMode: Application.buildMode,
    port: Application.port,
    env: Application.env,
    clusterName : Application.clusterName,
    username_github: Application.username_github,
    arn: arn,
    bucketName : bucketName,
    envVariables:envVariables,
    external_id: Application.external_id,
    registry: Application.registry,
    ownerId: Application.ownerId,
    github_token :Application.github_token,
    ACTION: action
  };


  const parametersQueryString = createParametersQueryString(parameters);

 // console.log(parametersQueryString);
  const instanceId:string =  process.env.INSTANCE_ID as string;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);

  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    // Handle error response
    return res.status(500).send('Invalid Jenkins URL');
  }
  

  const buildTriggerUrl: string = `${jenkinsUrl}/job/${jobName}/buildWithParameters?${parametersQueryString}`;
  //const buildTriggerUrl: string = `${jenkinsUrl}/job/${jobName}/build`;
  try {
    const response: AxiosResponse<JenkinsResponseData> = await axios.post(buildTriggerUrl, {}, {
      auth: {
        username,
        password
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    const url = response.headers.location;
    console.log('Build triggered successfully',url);
    const regex = /\/queue\/item\/(\d+)\//;
    const matches = url.match(regex);
    const itemNumber = matches ? matches[1] : null;
    console.log('Item Number:', itemNumber);
    
    const buildNumber = await getQueueItemDetails(itemNumber,jenkinsUrl);
    if (buildNumber) {
      
      res.status(200).json({ message: 'Webhook processed successfully' });

    } else {
      console.error('Build number not found');
      return res.status(500).send('Build number not found');
    }

  } catch (error: any) {
    console.error('Error triggering pipeline:', error.message);
    return res.status(500).send('Error triggering pipeline');
  }
     
  } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ message: 'Error processing webhook' });
  }
}


export async function updateEnvVariableHandler(req: Request, res: Response) {
  const applicationId = get(req, "params.applicationId");
  const envData = req.body;

  const Application = await findApplication({ applicationId });

  if (!Application) {
    return res.sendStatus(404);
  }

  const updatedApplication = await updateEnvVariable({ applicationId }, envData);

  return res.send(updatedApplication);
}



export async function getBuildLogHandler(req: Request, res: Response) {
  const applicationId = req.params.applicationId;
  const instanceId: string = process.env.INSTANCE_ID as string;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);
  let responseSent = false;
 
  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    return res.status(500).send('Invalid Jenkins URL');
  }

  const Application = await findApplication({ applicationId });
  if (!Application) {
    return res.status(404).send("Application Not Found");
  }

  const buildNumber = Application.buildNumber;
  const url = `${jenkinsUrl}/job/${jobName}/${buildNumber}/consoleText`;
  const buildStatusUrl = `${jenkinsUrl}/job/${jobName}/${buildNumber}/api/json`;

  const getBuildStatus = async (): Promise<string> => {
    try {
      const response = await axios.get(buildStatusUrl, {
        auth: {
          username,
          password
        }
      });
      return response.data.result;
    } catch (error : any) {
      console.error('Error fetching build status:', error.message);
      return '';
    }
  };

  const currentStatus = await getBuildStatus();

  // If the current status matches any of the final states, return the entire log and end the response.
  if (['SUCCESS', 'UNSTABLE', 'FAILURE', 'NOT_BUILT', 'ABORTED'].includes(currentStatus)) {
    console.log("Status is a final state. Fetching the entire log.");
    try {
      const response = await axios.get(url, {
        auth: {
          username,
          password
        }
      });
     
      res.send({ status: 'completed', log: response.data });
      responseSent = true;
      return res.end();
    } catch (error: any) {
      console.error('Error getting the entire build log:', error.message);
      responseSent = true;
      return res.status(500).send(`Error: ${error.message}`);
    }
  }

  // If the build is still in progress, proceed with the long-polling.
  let lastLogSizeHeader = req.headers['x-last-log-size'];
  let lastLogSize = typeof lastLogSizeHeader === 'string' ? parseInt(lastLogSizeHeader, 10) : 0;

  const checkForNewLogData = async () => {
    const currentStatus = await getBuildStatus();

    // If the current status matches any of the final states, stop the long-polling and close the connection.
    if (['SUCCESS', 'UNSTABLE', 'FAILURE', 'NOT_BUILT', 'ABORTED'].includes(currentStatus)) {
      if (!responseSent) {
      res.send('Build completed.');
      return res.end();
    }
  }

    try {
      const response = await axios.get(url, {
        auth: {
          username,
          password
        },
        headers: {
          'Range': `bytes=${lastLogSize}-`
        }
      });

      const newLogData = response.data;
      if (newLogData.length > 0) {
        lastLogSize += newLogData.length;
        res.setHeader('X-Current-Log-Size', lastLogSize.toString());
        res.send(newLogData);
      } else {
        setTimeout(checkForNewLogData, 5000);
      }
    } catch (error:any) {
      console.error('Error getting build log:', error.message);
      res.status(500).send(`Error: ${error.message}`);
    }
  };

  await checkForNewLogData();
}

// export async function updateApplicationHandler(req: Request, res: Response) {
//   const applicationId = get(req, "params.applicationId");
//   const update = req.body;
//   const Application = await findApplication({ applicationId });

//   if (!Application) {
//     return res.sendStatus(404);
//   }

//   const updatedApplication = await findAndUpdate({ applicationId }, update, {
//     new: true,
//   });

//   return res.send(updatedApplication);
// }

export async function updateApplicationHandler(req: Request, res: Response) {
  const applicationId = get(req, "params.applicationId");
  const Application = await findApplication({ applicationId });
  const action: string = 'Apply';
  const envVariables : object = req.body.envVariables || {};

  if (!Application) {
    return res.sendStatus(404);
  }

  const clusterId = req.body.clusterId;
  const Cluster = await discoverCluster( {clusterId} );
  if (!Cluster) {
     return res.status(404).send("Cluster Not Found");
  }
  const bucketName = Cluster.bucketName;

  const accountId = Application.arn;
  const arnSuffix = ":role/cool_customer";
  const arn = `arn:aws:iam::${accountId}${arnSuffix}`;

  // const bucketName = await initializeResources(arn, Cluster.external_id, Cluster.region);

  const parameters: Record<string, string | number | object > = {
    appName: Application.appName,
    gitRepository: Application.gitRepository,
    gitPath: Application.gitPath,
    repoType: Application.repoType,
    rootPath: Application.rootPath,
    gitBranch: Application.gitBranch,
    region: Application.region,
    clusterId: Application.clusterId,
    projId: Application.projId,
    orgId: Application.orgId,
    installId: req.body.installId,
    replicas : req.body.replicas,
    memory: req.body.memory + "Mi",
    cpu: req.body.cpu + "m",
    buildMode: Application.buildMode,
    port: req.body.port,
    env: Application.env,
    clusterName : Application.clusterName,
    username_github: Application.username_github,
    arn: arn,
    bucketName : bucketName,
    envVariables:envVariables,
    external_id: Application.external_id,
    registry: Application.registry,
    ownerId: Application.ownerId,
    github_token :req.body.github_token,
    ACTION: action
  };


  const parametersQueryString = createParametersQueryString(parameters);

 // console.log(parametersQueryString);
  const instanceId:string =  process.env.INSTANCE_ID as string;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);

  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    // Handle error response
    return res.status(500).send('Invalid Jenkins URL');
  }
  

  const buildTriggerUrl: string = `${jenkinsUrl}/job/${jobName}/buildWithParameters?${parametersQueryString}`;
  //const buildTriggerUrl: string = `${jenkinsUrl}/job/${jobName}/build`;
  try {
    const response: AxiosResponse<JenkinsResponseData> = await axios.post(buildTriggerUrl, {}, {
      auth: {
        username,
        password
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    const url = response.headers.location;
    console.log('Build triggered successfully',url);
    const regex = /\/queue\/item\/(\d+)\//;
    const matches = url.match(regex);
    const itemNumber = matches ? matches[1] : null;
    console.log('Item Number:', itemNumber);
    
    const buildNumber = await getQueueItemDetails(itemNumber,jenkinsUrl);
    if (buildNumber) {
      Application.buildNumber = buildNumber;
      Application.memory = req.body.memory;
      Application.cpu = req.body.cpu;
      Application.port = req.body.port;
      Application.envVariables = req.body.envVariables;
      Application.replicas = req.body.replicas;
      Application.github_token = req.body.github_token;
      Application.installId = req.body.installId;
      console.log(Application.replicas,"replicas");

      const updatedApplication = await findAndUpdate({ applicationId }, Application, {
        new: true,
      });

      return res.status(200).send(updatedApplication);

    } else {
      console.error('Build number not found');
      return res.status(500).send('Build number not found');
    }

  } catch (error: any) {
    console.error('Error triggering pipeline:', error.message);
    return res.status(500).send('Error triggering pipeline');
  }
}

export async function getApplicationHandler(req: Request, res: Response) {
  
  const applicationId = get(req, "params.applicationId");
  const Application = await findApplication({ applicationId });
  
  if (!Application) {
 
    return res.sendStatus(404);
  }

  return res.send(Application);
}

export async function deleteApplicationHandler(req: Request, res: Response) {

  const applicationId = get(req, "params.applicationId");

  const Application = await findApplication({ applicationId });

  if (!Application) {
    return res.sendStatus(404);
  }

  const webhookId = Application.webhookId;
  //Remove cron job:
  // removeCronJob(Application.applicationId);

  await removeWebhook(Application.github_token, Application.username_github,Application.gitRepository, webhookId);


  const accountId = Application.arn;
  const arnSuffix = ":role/cool_customer";
  const arn = `arn:aws:iam::${accountId}${arnSuffix}`;
 
  const action: string = 'Destroy';

  const parameters: Record<string, string | number > = {
    appName: Application.appName,
    gitRepository: Application.gitRepository,
    gitPath: Application.gitPath,
    repoType: Application.repoType,
    rootPath: Application.rootPath,
    gitBranch: Application.gitBranch,
    region: Application.region,
    clusterId: Application.clusterId,
    projId: Application.projId,
    orgId: Application.orgId,
    replicas : Application.replicas,
    installId: Application.installId,
    memory: Application.memory,
    cpu: Application.cpu,
    buildMode: Application.buildMode,
    port: Application.port,
    env: Application.env,
    username_github: Application.username_github,
    arn: arn,
    clusterName : Application.clusterName,
    external_id: Application.external_id,
    registry: Application.registry,
    ownerId: Application.ownerId,
    github_token :Application.github_token,
    ACTION: action
  };

  const parametersQueryString = createParametersQueryString(parameters);

 // console.log(parametersQueryString);
  const instanceId:string =  process.env.INSTANCE_ID as string;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);

  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    // Handle error response
    return res.status(500).send('Invalid Jenkins URL');
  }
  

  const buildTriggerUrl: string = `${jenkinsUrl}/job/${jobName}/buildWithParameters?${parametersQueryString}`;
  //const buildTriggerUrl: string = `${jenkinsUrl}/job/${jobName}/build`;
  try {
    const response: AxiosResponse<JenkinsResponseData> = await axios.post(buildTriggerUrl, {}, {
      auth: {
        username,
        password
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    const url = response.headers.location;
    console.log('Build triggered successfully',url);
    const regex = /\/queue\/item\/(\d+)\//;
    const matches = url.match(regex);
    const itemNumber = matches ? matches[1] : null;
    console.log('Item Number:', itemNumber);
    
    const buildNumber = await getQueueItemDetails(itemNumber,jenkinsUrl);

    if (buildNumber) {
      // Destroy cluster
      
      await deleteApplication({ applicationId });

      // Return the cluster as the response
      return res.status(200).send(Application);
    } else {
      // Handle case when build number is not available
      console.error('Build number not found');
      // Handle error response
      return res.status(500).send('Build number not found');
    }
  } catch (error: any) {
    console.error('Error triggering pipeline:', error.message);
    // Handle error response
    return res.status(500).send('Error triggering pipeline');
  }
}



export async function getOwnerHandler(req: Request, res: Response) {

  const ownerId = get(req, "params.ownerId");
 
  const owner = await findOwner(ownerId);

  if (!owner) {
    return res.sendStatus(404);
  }

  return res.send(owner);
}

export async function getProjectHandler(req: Request, res: Response) {

  const projId = get(req, "params.projId");
 
  const project = await findProject(projId);

  if (!project) {
    return res.sendStatus(404);
  }

  return res.send(project);
}

export async function checkBuildStatusHandler(req: Request, res: Response) {
  const instanceId:string =  process.env.INSTANCE_ID as string;
  const applicationId = req.params.applicationId;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);

  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    // Handle error response
    return res.status(500).send('Invalid Jenkins URL');
  }

  const Application = await findApplication({ applicationId });
  if (!Application) {
     return res.status(404).send("Application Not Found");
  }
  const buildNumber = Application.buildNumber;

  const triggerUrl: string = `${jenkinsUrl}/job/${jobName}/${buildNumber}/api/json`;

  try {
    const response: AxiosResponse<any> = await axios.post(triggerUrl, {}, {
      auth: {
        username,
        password
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    const result = response.data.result;
    
    if(result === "SUCCESS"){
      Application.isActive = true;
      const updatedApplication = await findAndUpdate({ applicationId }, Application, {
        new: true,
      });

      console.log(updatedApplication);

      return res.status(200).send(result);
    }

    if (result === "FAILURE" || result === "UNSTABLE" || result ==="ABORTED" || result === "NOT BUILT") {
      Application.isActive = false;
      const updatedApplication = await findAndUpdate({ applicationId }, Application, {
        new: true,
      });

      console.log(updatedApplication);
      return res.status(200).send(result);
    }
 
    Application.isActive = false;
      const updatedApplication = await findAndUpdate({ applicationId }, Application, {
        new: true,
      });

    console.log(updatedApplication);
  
    return res.status(200).send("PENDING");

  } catch (error: any) {
    console.error('Error triggering build or getting build number:', error.message);
    throw error;
  }
}

export async function getClusterHandler(req: Request, res: Response) {

  const clusterId = get(req, "params.clusterId");
 
  const cluster = await findCluster(clusterId);

  if (!cluster) {
    return res.sendStatus(404);
  }

  return res.send(cluster);
}

export async function getProjHandler(req: Request, res: Response) {

  const projId = get(req, "params.projId");
 
  const project = await findOwner(projId);

  if (!project) {
    return res.sendStatus(404);
  }

  return res.send(project);
}


export async function getAllApplicationsHandler(req: Request, res: Response) {
  const Application = await findAllApplications();

  if (!Application) {
    return res.sendStatus(404);
  }

  return res.send(Application);
}