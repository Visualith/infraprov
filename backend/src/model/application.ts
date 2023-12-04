import mongoose from "mongoose";
import { nanoid } from "nanoid";

export interface ApplicationDocument extends mongoose.Document { 
  applicationId: string;
  appName:string;
  gitRepository: string;
  gitPath:string;
  repoType:string;
  rootPath:string;
  gitBranch: string;
  ownerId:string;
  replicas: string;
  clusterId:string;
  clusterName:string;
  projId:string;
  orgId:string;
  installId:string;
  buildMode:string;
  port:number;
  region:string;
  env: string;
  arn: string;
  external_id : string;
  github_token : string;
  registry :string;
  buildNumber: string;
  isInstalled : Boolean;
  memory : string;
  cpu : string;
  isActive: boolean;
  username_github: string;
  envVariables : Object;
  webhookId:string;
  createdAt: Date;
  updatedAt: Date; 
}

const ApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, required: true, unique: true, default: () => nanoid(10) },
    gitRepository: { type: String, required: true },
    gitPath: { type: String, required: true },
    gitBranch: { type: String, required: true },
    ownerId: { type: String, required: true },
    clusterId: { type: String, required: true },
    projId: { type: String, required: true },
    orgId: { type: String, required: true },
    rootPath: { type: String },
    webhookId:{type:String},
    repoType: { type: String},
    appName: { type: String},
    env:{type:String},
    username_github:{type:String},
    external_id :{type:String},
    arn:{type:String},
    buildMode: { type: String},
    isActive: { type: Boolean},
    replicas: { type: String},
    github_token : { type: String},
    region : { type: String},
    clusterName:{type:String},
    buildNumber : { type: String},
    envVariables :{type:Object,default : {}},
    registry :{type:String},
    memory :{type:String},
    cpu :{type:String},
    port: { type: Number },
    installId : {type:String},
    isInstalled: { type: Boolean},
  },
  { timestamps: true }
);

const Application = mongoose.model<ApplicationDocument>("Application", ApplicationSchema);

export default Application;