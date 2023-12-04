import { Request, Response } from "express";
import { get } from "lodash";
import {
  createOrganization,
  findAndUpdate,
  deleteOrganization,
  findOrganization,
  findAllOrganizations,
  findOwner,
  countOrganizationsByOwner
} from "../service/organization";

import {

  findUser,

} from "../service/user";

import {
  findOrg
} from "../service/project"

import * as dotenv from 'dotenv';
dotenv.config();

// export async function createOrganizationHandler(req: Request, res: Response) {
//   const body = req.body;

//   const organization = await createOrganization({ ...body });

//   return res.send(organization);
// }

const freeCode = process.env.FREE_CODE as string;

export async function createOrganizationHandler(req: Request, res: Response) {
  const body = req.body;
  const userId = req.body.ownerId;
  
  const User = await findUser({ userId });

  if (!User) {
    return res.status(404).send("User not found");
  }

  const isFree = User.billing === freeCode;

  // Check the number of (organizations) the user already has
  if (isFree) {
    const organizationsCount = await countOrganizationsByOwner(userId);
    if (organizationsCount >= 1) {
      return res.status(403).send("Free users are not allowed to create more than 1 organization.");
    }
  }

  const organization = await createOrganization({ ...body });

  return res.send(organization);
}

export async function updateOrganizationHandler(req: Request, res: Response) {
  const orgId = get(req, "params.orgId");
  const update = req.body;
  const organization = await findOrganization({ orgId });

  if (!organization) {
    return res.sendStatus(404);
  }

  const updatedOrganization = await findAndUpdate({ orgId }, update, {
    new: true,
  });

  return res.send(updatedOrganization);
}

export async function getOrganizationHandler(req: Request, res: Response) {
  const orgId = get(req, "params.orgId");
  const organization = await findOrganization({ orgId });

  if (!organization) {
    return res.sendStatus(404);
  }

  return res.send(organization);
}

export async function deleteOrganizationHandler(req: Request, res: Response) {

  const orgId = get(req, "params.orgId");

  const organization = await findOrganization({ orgId });

  //Find projects for the orgId
  const proj = await findOrg(orgId);
 
  if(proj.length!=0){
    return res.status(400).send({ message: "Organization has projects. Delete projects first." });
  }

  if (!organization) {
    return res.sendStatus(404).send({ message: "Organization not found." });;
  }

  await deleteOrganization({ orgId });

  return res.send(organization);
}

export async function getOwnerHandler(req: Request, res: Response) {

  
  const ownerId = get(req, "params.ownerId");
  const owner = await findOwner(ownerId);

  

  if (!owner) {
    return res.sendStatus(404);
  }

  return res.send(owner);
}

export async function getRoot(req: Request, res: Response) {
  return res.send("Welcome to the API ");
}

export async function getAllOrganizationsHandler(req: Request, res: Response) {
  const organization = await findAllOrganizations();

  if (!organization) {
    return res.sendStatus(404);
  }

  return res.send(organization);
}


