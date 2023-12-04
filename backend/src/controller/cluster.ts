import { Request, Response } from "express";
import { get } from "lodash";
import axios, { AxiosResponse } from 'axios';
import {
  createCluster,
  findAndUpdate,
  deleteCluster,
  findCluster,
  findAllClusters,
  findOwner,
  findProject,
  increasedeploycount,
  countClustersByOwner
} from "../service/cluster";

import {

  findUser,

} from "../service/user";


import {initializeResources} from './createbucket';
import {teardownResources} from './teardown';


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
  const jobName: string = process.env.JENKINS_JOB_NAME as string;
  const freeCode = process.env.FREE_CODE as string;


  
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

  function createParametersQueryString(parameters: Record<string, string | number>): string {
    const parameterPairs = Object.entries(parameters)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    return parameterPairs.join('&');
  }

export async function createClusterHandler(req: Request, res: Response) {
  const body: any = req.body;
  const action: string = 'Apply';

  const User = await findUser({ userId: body.ownerId });
  if (!User) {
      return res.status(404).send("User not found");
  }

  const github_username = User.userName.toLowerCase();

     // Check if the user is a free user
     const isFree = User.billing === freeCode;
     if (isFree) {
         const clustersCount = await countClustersByOwner(body.ownerId);
         if (clustersCount >= 1) {
             return res.status(403).send("Free users are not allowed to create more than 1 cluster.");
         }
     }
 
   const accountId = body.arn;
   const arnSuffix = ":role/cool_customer";
   const arn = `arn:aws:iam::${accountId}${arnSuffix}`;
  
   const bucketName = await initializeResources(arn, req.body.external_id, req.body.region);

  const parameters: Record<string, string | number> = {
    name: req.body.name,
    cloud: req.body.cloud,
    region: req.body.region,
    ownerId: req.body.ownerId,
    accessKeyId: req.body.accessKeyId,
    secretAccessKey: req.body.secretAccessKey,
    min: req.body.min,
    max: req.body.max,
    description: req.body.description,
    iscredentials: req.body.iscredentials,
    credentials: req.body.credentials,
    external_id: req.body.external_id,
    arn: arn,
    environment: req.body.environment,
    instance_type: req.body.instance_type,
    disk_size: req.body.disk_size,
    node_autoscaling: req.body.node_autoscaling,
    vpc_subnet: req.body.vpc_subnet,
    orgId: req.body.orgId,
    projId: req.body.projId,
    github_username:github_username,
    bucketName: bucketName,
    ACTION: action
  };
  const canDeployResult = await increasedeploycount(req.body.ownerId);
  console.log(canDeployResult, "canDeploy");
  
  // if (!canDeployResult) {
  //     return res.status(400).send("200 deployment credits used for the month");
  // }


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
      // Add buildNumber to the body object
      body.buildNumber = buildNumber;
      const isActive = false;
      const updatedBody = {
        ...body,
        isActive : isActive,
        bucketName : bucketName
      };

      console.log('Updated Body:', updatedBody);

   

      // Create cluster
      const Cluster = await createCluster(updatedBody);

      // Return the cluster as the response
      return res.status(200).send(Cluster);
      
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

export async function checkBuildStatusHandler(req: Request, res: Response) {
  const instanceId:string =  process.env.INSTANCE_ID as string;
  const clusterId = req.params.clusterId;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);

  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    // Handle error response
    return res.status(500).send('Invalid Jenkins URL');
  }

  const Cluster = await findCluster({ clusterId });
  if (!Cluster) {
     return res.status(404).send("Cluster Not Found");
  }
  const buildNumber = Cluster.buildNumber;

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
      Cluster.isActive = true;
      const updatedCluster = await findAndUpdate({ clusterId }, Cluster, {
        new: true,
      });

      console.log(updatedCluster);

      return res.status(200).send(result);
    }

    if (result === "FAILURE" || result === "UNSTABLE" || result ==="ABORTED" || result === "NOT BUILT") {
      Cluster.isActive = false;
      const updatedCluster = await findAndUpdate({ clusterId }, Cluster, {
        new: true,
      });

      console.log(updatedCluster);
      return res.status(200).send(result);
    }
 
    Cluster.isActive = false;
      const updatedCluster = await findAndUpdate({ clusterId }, Cluster, {
        new: true,
      });

    console.log(updatedCluster);
  
    return res.status(200).send("PENDING");

  } catch (error: any) {
    console.error('Error triggering build or getting build number:', error.message);
    throw error;
  }
}

export async function getBuildLogHandler(req: Request, res: Response) {
  const clusterId = req.params.clusterId;
  const instanceId: string = process.env.INSTANCE_ID as string;
  const jenkinsUrl = await getPublicIpAddress(instanceId);
  const isValidUrl = await isJenkinsUrlValid(jenkinsUrl);
  let responseSent = false;
 
  if (!isValidUrl) {
    console.error('Invalid Jenkins URL');
    return res.status(500).send('Invalid Jenkins URL');
  }

  const Cluster = await findCluster({ clusterId });
  if (!Cluster) {
    return res.status(404).send("Cluster Not Found");
  }

  const buildNumber = Cluster.buildNumber;
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


export async function updateClusterHandler(req: Request, res: Response) {
  const clusterId = get(req, "params.clusterId");
  const Cluster = await findCluster({ clusterId });
  const action: string = 'Apply';

  if (!Cluster) {
    return res.sendStatus(404);
  }
  
  const accountId = Cluster.arn;
  const arnSuffix = ":role/cool_customer";
  const arn = `arn:aws:iam::${accountId}${arnSuffix}`;

  const User = await findUser({ userId: req.body.ownerId });
  if (!User) {
      return res.status(404).send("User not found");
  }

  const github_username = User.userName.toLowerCase();

  const bucketName = await initializeResources(arn, Cluster.external_id, Cluster.region);

  const parameters: Record<string, string | number> = {
    name: Cluster.name,
    cloud: Cluster.cloud,
    region: Cluster.region,
    ownerId: Cluster.ownerId,
    accessKeyId: Cluster.accessKeyId,
    secretAccessKey: Cluster.secretAccessKey,
    min: req.body.min,
    max: req.body.max,
    description: req.body.description,
    iscredentials: req.body.iscredentials,
    credentials: req.body.credentials,
    external_id: Cluster.external_id,
    arn: arn,
    environment: req.body.environment,
    instance_type: req.body.instance_type,
    disk_size: req.body.disk_size,
    node_autoscaling: req.body.node_autoscaling,
    vpc_subnet: req.body.vpc_subnet,
    orgId: Cluster.orgId,
    projId: Cluster.projId,
    github_username : github_username,
    bucketName : bucketName,
    ACTION: action
  };

  const canDeployResult = await increasedeploycount(req.body.ownerId);
  console.log(canDeployResult, "canDeploy");
  
  // const parameters: Record<string, string | number> = {
  //   name: Cluster.name,
  //   cloud: Cluster.cloud,
  //   region: Cluster.region,
  //   ownerId: Cluster.ownerId,
  //   accessKeyId: Cluster.accessKeyId,
  //   secretAccessKey: Cluster.secretAccessKey,
  //   min: Cluster.min,
  //   max: Cluster.max,
  //   description: Cluster.description,
  //   iscredentials: Cluster.iscredentials,
  //   credentials: Cluster.credentials,
  //   external_id: Cluster.external_id,
  //   arn: arn,
  //   environment: Cluster.environment,
  //   instance_type: Cluster.instance_type,
  //   disk_size: Cluster.disk_size,
  //   node_autoscaling: Cluster.node_autoscaling,
  //   vpc_subnet: Cluster.vpc_subnet,
  //   orgId: Cluster.orgId,
  //   projId: Cluster.projId,
  //   ACTION: action
  // };


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
      Cluster.buildNumber = buildNumber;
      Cluster.min = req.body.min;
      Cluster.max = req.body.max;
      Cluster.description = req.body.description;
      Cluster.iscredentials = req.body.iscredentials;
      Cluster.credentials = req.body.credentials;
      Cluster.environment = req.body.environment;
      Cluster.instance_type = req.body.instance_type;
      Cluster.disk_size = req.body.disk_size;
      Cluster.node_autoscaling = req.body.node_autoscaling;
      Cluster.vpc_subnet = req.body.vpc_subnet;

      const updatedCluster = await findAndUpdate({ clusterId }, Cluster, {
        new: true,
      });

      return res.status(200).send(updatedCluster);

    } else {
      console.error('Build number not found');
      return res.status(500).send('Build number not found');
    }

  } catch (error: any) {
    console.error('Error triggering pipeline:', error.message);
    return res.status(500).send('Error triggering pipeline');
  }
}

export async function getClusterHandler(req: Request, res: Response) {
  const clusterId = get(req, "params.clusterId");
  const Cluster = await findCluster({ clusterId });

  if (!Cluster) {
    return res.sendStatus(404);
  }

  return res.send(Cluster);
}

export async function teardownController(req: Request, res: Response){

  const awsRoleArn :string= req.body.arn;
   const externalId :string = req.body.external_id; 
   const region :string =  req.body.region

   console.log(awsRoleArn);
   console.log(externalId);
   console.log(region);

  
  const resourceDelete = await teardownResources(awsRoleArn, externalId, region);

  return res.json({
    status: 'success',
    logs: resourceDelete.logs,
    errors: resourceDelete.errors
  });
}

export async function deleteClusterHandler(req: Request, res: Response) {

  const clusterId = get(req, "params.clusterId");

  const Cluster = await findCluster({ clusterId });

  if (!Cluster) {
    return res.sendStatus(404);
  }

  
  const github_username = "default";

 
  const action: string = 'Destroy';

  const accountId = Cluster.arn;
  const arnSuffix = ":role/cool_customer";
  const arn = `arn:aws:iam::${accountId}${arnSuffix}`;
 
  const bucketName = await initializeResources(arn, Cluster.external_id, Cluster.region);

  const parameters: Record<string, string | number> = {
    name: Cluster.name,
    cloud: "aws",
    region: Cluster.region,
    ownerId: Cluster.ownerId,
    accessKeyId: Cluster.accessKeyId,
    secretAccessKey: Cluster.secretAccessKey,
    min: Cluster.min,
    max: Cluster.max,
    description: Cluster.description,
    iscredentials: Cluster.iscredentials,
    credentials: Cluster.credentials,
    external_id: Cluster.external_id,
    arn: arn,
    environment: Cluster.environment,
    instance_type: Cluster.instance_type,
    disk_size: Cluster.disk_size,
    node_autoscaling: Cluster.node_autoscaling,
    vpc_subnet: Cluster.vpc_subnet,
    orgId: Cluster.orgId,
    projId: Cluster.projId,
    github_username:github_username,
    bucketName:bucketName,
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
      
      await deleteCluster({ clusterId });

      // Return the cluster as the response
      return res.status(200).send(Cluster);
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

export async function getProjHandler(req: Request, res: Response) {

  const projId = get(req, "params.projId");
 
  const project = await findOwner(projId);

  if (!project) {
    return res.sendStatus(404);
  }

  return res.send(project);
}


export async function getAllClustersHandler(req: Request, res: Response) {
  const Cluster = await findAllClusters();

  if (!Cluster) {
    return res.sendStatus(404);
  }

  return res.send(Cluster);
}
