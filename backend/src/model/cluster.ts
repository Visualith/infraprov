import mongoose from "mongoose";
import { nanoid } from "nanoid";

export interface ClusterDocument extends mongoose.Document { 
  clusterId: string;
  name: string;
  cloud:string;
  region: string;
  ownerId:string;
  orgId:string;
  clusterStatus: string;
  arn:string;
  min:number;
  max:number;
  accessKeyId:string;
  secretAccessKey:string;
  description:string;
  iscredentials : string;
  createdAt: Date;
  updatedAt: Date;
  credentials: string;
  external_id:string;
  instance_type:string;
  disk_size:string;
  node_autoscaling: string;
  vpc_subnet:string;
  projId:string;
  environment:string;
  isActive:boolean;
  buildNumber:string;
  bucketName:string;
}

const ClusterSchema = new mongoose.Schema(
  {
    clusterId: { type: String, required: true, unique: true ,default: () => nanoid(10)},
    name: { type: String, required: true },
    cloud: { type: String, required: true },
    region: { type: String, required: true },
    projId: { type: String, required: true },
    ownerId: { type: String ,required: true},
    orgId: { type: String ,required: true},
    accessKeyId:{ type: String},
    secretAccessKey:{type:String},
    description: { type: String },
    environment: { type: String },
    iscredentials: { type: String },
    arn: { type: String },
    credentials: { type: String },
    buildNumber: { type: String },
    external_id: { type: String },
    isActive: { type: Boolean },
    clusterStatus: { type: String },
    instance_type: { type: String },
    disk_size: { type: String },
    node_autoscaling: { type: String },
    bucketName: { type: String },
    vpc_subnet: { type: String },
    max:{type:Number},
    min:{type:Number}
  },
  { timestamps: true }
);

const Cluster = mongoose.model<ClusterDocument>("Cluster", ClusterSchema);

export default Cluster;