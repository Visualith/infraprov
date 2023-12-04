import AWS from 'aws-sdk';
import { S3, ECR, DynamoDB, STS, KMS } from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;

const myCredentials = new AWS.Credentials({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class LogCollector {
    logs: string[] = [];
    errors: string[] = [];

    log(message: string) {
        this.logs.push(message);
    }

    error(message: string) {
        this.errors.push(message);
    }
}

async function assumeRole(roleArn: string, externalId: string, region: string, logger: LogCollector): Promise<AWS.STS.Credentials> {
    const sts = new AWS.STS({ credentials: myCredentials, region });
    const params = {
        RoleArn: roleArn,
        RoleSessionName: 'cool_customer',
        ExternalId: externalId
    };
    const data = await sts.assumeRole(params).promise();
    if (!data.Credentials) {
        logger.error('Failed to get AWS STS credentials.');
        throw new Error('Failed to get AWS STS credentials.');
    }
    return data.Credentials;
}

async function deleteS3BucketsWithPrefix(prefix: string, s3: S3, logger: LogCollector): Promise<void> {
    const allBuckets = await s3.listBuckets().promise();
    const bucketsToDelete = allBuckets.Buckets?.filter(bucket => bucket.Name?.startsWith(prefix)) || [];
    
    for (const bucket of bucketsToDelete) {
        if (!bucket.Name) continue;

        try {
            await emptyS3Bucket(bucket.Name, s3);
            await s3.deleteBucket({ Bucket: bucket.Name }).promise();
            logger.log(`Deleted S3 bucket: ${bucket.Name}`);
        } catch (error:any) {
            logger.log(`Skipped deletion of S3 bucket ${bucket.Name} because it is not empty or an error occurred: ${error.message}`);
        }
    }
}

// async function isEmptyBucket(bucketName: string, s3: S3): Promise<boolean> {
//     const objects = await s3.listObjectsV2({ Bucket: bucketName }).promise();
//     return !objects.Contents || objects.Contents.length === 0;
// }

async function emptyS3Bucket(bucketName: string, s3: S3): Promise<void> {
    // Check for objects in the current version
    const currentVersionObjects = await s3.listObjectsV2({ Bucket: bucketName }).promise();
    if (currentVersionObjects.Contents && currentVersionObjects.Contents.length > 0) {
        throw new Error(`Bucket ${bucketName} has objects in the current version. Can't delete.`);
    }

    // Handle versioning: Delete non-current versions and delete markers
    let isTruncated = true;
    let versionIdMarker: string | undefined;
    while (isTruncated) {
        const versionedObjects = await s3.listObjectVersions({ Bucket: bucketName, VersionIdMarker: versionIdMarker }).promise();
        
        if (versionedObjects.Versions && versionedObjects.Versions.length > 0) {
            await s3.deleteObjects({
                Bucket: bucketName,
                Delete: {
                    Objects: versionedObjects.Versions.map(obj => ({ Key: obj.Key!, VersionId: obj.VersionId }))
                }
            }).promise();
        }

        if (versionedObjects.DeleteMarkers && versionedObjects.DeleteMarkers.length > 0) {
            await s3.deleteObjects({
                Bucket: bucketName,
                Delete: {
                    Objects: versionedObjects.DeleteMarkers.map(obj => ({ Key: obj.Key!, VersionId: obj.VersionId }))
                }
            }).promise();
        }

        isTruncated = versionedObjects.IsTruncated || false;
        versionIdMarker = versionedObjects.NextVersionIdMarker;
    }
}


// async function deleteKMSKey(aliasName: string, kms: KMS, logger: LogCollector): Promise<void> {
//     try {
//         const keyInfo = await kms.describeKey({ KeyId: aliasName }).promise();
//         const keyId = keyInfo.KeyMetadata!.KeyId;
//         await kms.scheduleKeyDeletion({ KeyId: keyId!, PendingWindowInDays: 7 }).promise();
//         logger.log(`Scheduled deletion for KMS Key with id ${keyId}`);
//     } catch (error: any) {
//         logger.error(`Failed to delete KMS key: ${error.message}`);
//     }
// }

async function deleteResources(region: string, credentials: STS.Credentials, logger: LogCollector): Promise<void> {
    const s3 = new S3({
        region: region,
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    });

    const ecr = new ECR({
        region: region,
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    });

    const dynamoDB = new DynamoDB({
        region: region,
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    });

    await deleteS3BucketsWithPrefix('visualith-', s3, logger);

    try {
        await ecr.deleteRepository({ repositoryName: 'visualith-repo', force: true }).promise();
        logger.log(`Deleted ECR repository: visualith-repo`);
    } catch (error: any) {
        logger.error(`Failed to delete ECR repository: ${error.message}`);
    }

    try {
        await dynamoDB.deleteTable({ TableName: 'terraform-state' }).promise();
        logger.log(`Deleted DynamoDB table: terraform-state`);
    } catch (error: any) {
        logger.error(`Failed to delete DynamoDB table: ${error.message}`);
    }

    // const kms = new KMS({
    //     region: region,
    //     accessKeyId: credentials.AccessKeyId,
    //     secretAccessKey: credentials.SecretAccessKey,
    //     sessionToken: credentials.SessionToken
    // });

    // await deleteKMSKey('alias/visualith-key', kms, logger);
}

export async function teardownResources(awsRoleArn: string, externalId: string, region: string): Promise<LogCollector> {
    const logger = new LogCollector();

    const credentials = await assumeRole(awsRoleArn, externalId, region, logger);
    await deleteResources(region, credentials, logger);
    logger.log('All specified resources have been deleted or skipped if not empty.');
    return logger;
}
