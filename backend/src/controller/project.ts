import { Request, Response } from "express";
import { get } from "lodash";
import {
  createProject,
  findAndUpdate,
  deleteProject,
  findProject,
  findAllProjects,
  findUser,
  findOrg,
  countProjectsByOwner
} from "../service/project";

import {

  findUser as findOwner,

} from "../service/user";

import {
  findProject as findCluster
} from "../service/cluster";

// export async function createProjectHandler(req: Request, res: Response) {
//   const body = req.body;

//   console.log(req.body);

//   const Project = await createProject({ ...body });

//   return res.send(Project);
// }

import * as dotenv from 'dotenv';
dotenv.config();

const freeCode = process.env.FREE_CODE as string;

export async function createProjectHandler(req: Request, res: Response) {
  const body = req.body;
  const userId = req.body.userId;

  const User = await findOwner({ userId });

  if (!User) {
      return res.status(404).send("User not found");
  }

  const isFree = User.billing === freeCode;

  if (isFree) {
      const projectsCount = await countProjectsByOwner(userId);
      if (projectsCount >= 1) {
          return res.status(403).send("Free users are not allowed to create more than 1 project.");
      }
  }

  const Project = await createProject({ ...body });

  return res.send(Project);
}

export async function updateProjectHandler(req: Request, res: Response) {
  const projId = get(req, "params.projId");
  const update = req.body;
  const Project = await findProject({ projId });

  if (!Project) {
    return res.sendStatus(404);
  }

  const updatedProject = await findAndUpdate({ projId }, update, {
    new: true,
  });

  return res.send(updatedProject);
}

export async function getProjectHandler(req: Request, res: Response) {
  const projId = get(req, "params.projId");
  const Project = await findProject({ projId });

  if (!Project) {
    return res.sendStatus(404);
  }

  return res.send(Project);
}

export async function deleteProjectHandler(req: Request, res: Response) {

  
  const projId = get(req, "params.projId");

  const Project = await findProject({ projId });

   //Find clusters for the projectId
   const cluster = await findCluster(projId);
 
   if(cluster.length!=0){
     return res.status(400).send({ message: "Project has clusters. Delete clusters first." });
   }

  if (!Project) {
    return res.sendStatus(404);
  }

  await deleteProject({ projId });

  return res.send(Project);
}

export async function getUserHandler(req: Request, res: Response) {

  
  const ownerId = get(req, "params.userId");
  const owner = await findUser(ownerId);

  

  if (!owner) {
    return res.sendStatus(404);
  }

  return res.send(owner);
}

export async function getOrgHandler(req: Request, res: Response) {

  
  const orgId = get(req, "params.orgId");
  const org = await findOrg(orgId);

  

  if (!org) {
    return res.sendStatus(404);
  }

  return res.send(org);
}

export async function getAllProjectsHandler(req: Request, res: Response) {
  const Project = await findAllProjects();

  if (!Project) {
    return res.sendStatus(404);
  }

  return res.send(Project);
}


