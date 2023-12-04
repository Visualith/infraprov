import {Express, Request, Response } from "express";

import organization from "./route/organization";
import cluster from "./route/cluster";
import user from "./route/user";
import project from "./route/project"
import applctn from "./route/application"
import aws from "./route/aws"
// import webhook from "./route/webhook"
import token from "./route/token"
//import validate from "./middleware/validateRequest";
import authenticateJWT from './middleware/authentication';
import { createStackHandler } from "./controller/awscreatestack";
import {generateUniqueId} from "./controller/awsidgenerate";
import {
  webhookListener
} from "../src/controller/application";

export default function (app: Express) {

  app.get("/", (req: Request, res: Response) => {
    res.send("Api is working properly");
  });
  
  app.get("/uniqueid/:accountid", (req: Request, res: Response)=>{
    generateUniqueId(req, res);
  });
  
  app.get("/create-stack",(req: Request, res: Response)=>{
    createStackHandler(req, res);
  });
  console.log("route removed");

  app.post("/webhook/applicationId/:applicationId", webhookListener);

  app.use('/api', authenticateJWT);

  app.use('/api', organization);

  app.use('/api', user);

  app.use('/api',project);

  app.use('/api',cluster);

  app.use('/api',applctn);

  app.use('/api',aws);

  app.use('/api',token);
 
}
