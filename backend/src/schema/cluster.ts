import { object, string, TypeOf } from "zod";

/**
 * @openapi
 * components:
 *   schema:
 *     Cluster:
 *       type: object
 *       required:
 *         - name
 *         - cloud
 *         - region
 *         - userId
 *         - orgId
 *         - ownerId
 *         - projId
 *         - secretAccessKey
 *       properties:
 *         name:
 *           type: string
 *         cloud:
 *           type: string
 *         region:
 *           type: string
 *         min:
 *           type: number
 *         max:
 *            type: number
 *         accessKeyId:
 *           type: string
 *         buildNumber:
 *           type: string
 *         secretAccessKey:
 *            type: string
 *         description:
 *           type: string
 *         iscredentials:
 *           type: string
 *         credentials:
 *           type: string
 *         external_id:
 *           type: string
 *         arn:
 *           type: string
 *         instance_type:
 *           type: string
 *         disk_size:
 *           type: string
 *         node_autoscaling:
 *           type: string
 *         vpc_subnet:
 *           type: string
 *         ownerId:
 *           type: string
 *         orgId:
 *           type: string
 *         projId:
 *           type: string
 *         isActive:
 *           type: boolean
 *       example:
 *         name: "My Cluster"
 *         cloud: "AWS"
 *         region: "us-west-1"
 *         ownerId: "user123"
 *         accessKeyId: AKIEXAMPLE123
 *         secretAccessKey: somesecretkey
 *         min: 1
 *         max: 10
 *         description: "This is my cluster"
 *         iscredentials: "false"
 *         credentials: "xyz123"
 *         external_id: "abc123"
 *         instance_type: "t2.micro"
 *         disk_size: "10GB"
 *         node_autoscaling: "false"
 *         vpc_subnet: "subnet-12345"
 *         orgId: "owner123"
 *         arn: "arn:aws:iam::497436922804:role/cool_customer"
 *         projId: "123"
 */

 const payload = {
  body: object({
    name: string({
      required_error: "Name is required",
    }),   
    cloud: string({
      required_error: "Cloud is required",
    }),
    region: string({
      required_error: "Region is required",
    }),
    ownerId: string({
      required_error: "OwnerId is required",
    }),
    orgId: string({
      required_error: "OrgId is required",
    }),
    projId: string({
      required_error: "ProjId is required",
    })
    // accessKeyId: string({
    //   required_error: "AccessKeyId is required",
    // }),
    // secretAccessKey: string({
    //   required_error: "SecretAccessKey is required",
    // }),
  }),
};

const params = {
  params: object({
    clusterId: string({
      required_error: "ClusterId is required",
    }),
  }),
};

export const createClusterSchema = object({
  ...payload,
});

export const updateClusterSchema = object({
  ...params,
});

export const deleteClusterSchema = object({
  ...params,
});

export const getClusterSchema = object({
  ...params,
});

export type CreateClusterInput = TypeOf<typeof createClusterSchema>;
export type UpdateClusterInput = TypeOf<typeof updateClusterSchema>;
export type ReadClusterInput = TypeOf<typeof getClusterSchema>;
export type DeleteClusterInput = TypeOf<typeof deleteClusterSchema>;