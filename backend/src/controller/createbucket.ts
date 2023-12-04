import AWS from 'aws-sdk';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { S3, ECR, DynamoDB ,STS} from 'aws-sdk';

dotenv.config();

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;

// Set the default credentials
const myCredentials = new AWS.Credentials({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

async function assumeRole(roleArn: string, externalId: string, region: string): Promise<AWS.STS.Credentials> {
    const sts = new AWS.STS({ credentials: myCredentials, region });
    const params = {
        RoleArn: roleArn,
        RoleSessionName: 'cool_customer',
        ExternalId: externalId
    };
    const data = await sts.assumeRole(params).promise();
    if (!data.Credentials) {
        throw new Error('Failed to get AWS STS credentials.');
    }
    return data.Credentials;
}

async function checkBucketWithPrefix(prefix: string, region: string, s3: S3): Promise<AWS.S3.Bucket[]> {
    
    const data = await s3.listBuckets().promise();
    return data.Buckets!.filter(bucket => bucket.Name!.startsWith(prefix));
}

async function checkECRRepo(repositoryName: string, region: string,ecr:ECR): Promise<boolean> {
     
    try {
        await ecr.describeRepositories({ repositoryNames: [repositoryName] }).promise();
        return true;  // If repository exists
    } catch (error: any) {
        if (error.code === 'RepositoryNotFoundException') {
            return false;  // If repository doesn't exist
        }
        throw error;
    }
}

async function createECRRepo(repositoryName: string, region: string,ecr:ECR): Promise<void> {
    await ecr.createRepository({ repositoryName }).promise();
    console.log(`ECR Repository: ${repositoryName} created.`);
}

async function createResources(region: string,s3:S3,credentials:STS.Credentials): Promise<string> {
   
    const randomName = crypto.randomBytes(5).toString('hex');
    const bucketName = `visualith-${randomName}`;

    await s3.createBucket({
        Bucket: bucketName,
        ACL: 'private'
    }).promise();

    await s3.putBucketVersioning({
        Bucket: bucketName,
        VersioningConfiguration: {
            Status: 'Enabled'
        }
    }).promise();

    // await s3.putBucketEncryption({
    //     Bucket: bucketName,
    //     ServerSideEncryptionConfiguration: {
    //         Rules: [{
    //             ApplyServerSideEncryptionByDefault: {
    //                 KMSMasterKeyID: kmsKey.KeyMetadata.Arn,
    //                 SSEAlgorithm: 'aws:kms'
    //             }
    //         }]
    //     }
    // }).promise();

    // DynamoDB table creation
    // await dynamoDB.createTable({
    //     TableName: 'terraform-state',
    //     KeySchema: [{
    //         AttributeName: 'LockID',
    //         KeyType: 'HASH'
    //     }],
    //     AttributeDefinitions: [{
    //         AttributeName: 'LockID',
    //         AttributeType: 'S'
    //     }],
    //     ProvisionedThroughput: {
    //         ReadCapacityUnits: 20,
    //         WriteCapacityUnits: 20
    //     }
    // }).promise();

    // Create an alias for the KMS key
        // await kms.createAlias({
        //     AliasName: aliasName,
        //     TargetKeyId: kmsKey.KeyMetadata.KeyId
        // }).promise();
    
    console.log(`Bucket: ${bucketName}`);
    return bucketName;
}

async function checkDynamoDBTable(tableName: string, region: string,dynamoDB: DynamoDB): Promise<boolean> {
    

    try {
        await dynamoDB.describeTable({ TableName: tableName }).promise();
        return true;  // If table exists
    } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
            return false;  // If table doesn't exist
        }
        throw error;
    }
}

async function createDynamoDBTable(region: string,dynamoDB: DynamoDB): Promise<void> {

    
    await dynamoDB.createTable({
        TableName: 'terraform-state',
        KeySchema: [{
            AttributeName: 'LockID',
            KeyType: 'HASH'
        }],
        AttributeDefinitions: [{
            AttributeName: 'LockID',
            AttributeType: 'S'
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 20,
            WriteCapacityUnits: 20
        }
    }).promise();

    console.log('DynamoDB table "terraform-state" has been created.');
}



export async function initializeResources(awsRoleArn: string, externalId: string, region: string): Promise<string> {
    const credentials = await assumeRole(awsRoleArn, externalId, region);
    
    const s3 = new S3({
        region: region,
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    });

    let bucketName: string;

    const existingBuckets = await checkBucketWithPrefix('visualith', region, s3);
    if (existingBuckets.length) {
        bucketName = existingBuckets[0].Name!;
        console.log(`Found existing bucket: ${bucketName}`);
    } else {
        bucketName = await createResources(region, s3,credentials);
    }

    const ecr = new ECR({
        region: region,
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    });

    const ecrRepoExists = await checkECRRepo('visualith-repo', region, ecr);
    if (!ecrRepoExists) {
        await createECRRepo('visualith-repo', region, ecr);
        await setECRLifecyclePolicy('visualith-repo', region, ecr);
    } else {
        console.log('ECR Repository "visualith-repo" already exists.');
        await setECRLifecyclePolicy('visualith-repo', region, ecr);  // Set the policy even if the repo already exists
    }

    const dynamoDB = new DynamoDB({
        region: region,
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    });

    const dynamoDBTableExists = await checkDynamoDBTable('terraform-state', region, dynamoDB);
    if (!dynamoDBTableExists) {
        await createDynamoDBTable(region, dynamoDB);
    } else {
        console.log('DynamoDB table "terraform-state" already exists.');
    }

    return bucketName;
}

async function setECRLifecyclePolicy(repositoryName: string, region: string, ecr: ECR): Promise<void> {
    const lifecyclePolicyText = JSON.stringify({
        rules: [{
            rulePriority: 1,
            description: "Delete images after 1 day",
            selection: {
                tagStatus: "any",
                countType: "sinceImagePushed",
                countUnit: "days",
                countNumber: 1
            },
            action: {
                type: "expire"
            }
        }]
    });

    await ecr.putLifecyclePolicy({
        repositoryName: repositoryName,
        lifecyclePolicyText: lifecyclePolicyText
    }).promise();

    console.log(`Lifecycle policy set for ECR Repository: ${repositoryName}. Images will be deleted after 24 hours.`);
}


