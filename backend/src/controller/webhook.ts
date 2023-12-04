import { Request, Response } from "express";
import { get } from "lodash";
import {
  createWebhook,
  findInstallId,
  findAllWebhooks,
} from "../service/webhook";

export async function createWebhookHandler(req: Request, res: Response) {
    const data = req.body;
    const installId = data.installation.id;
  
    try {
      const webhook = await createWebhook(installId, data);
      return res.send(webhook);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
  }


export async function getWebhookHandler(req: Request, res: Response) {
  const installId = get(req, "params.installId");
  
  const Webhook = await findInstallId(installId );

  if (!Webhook) {
    return res.sendStatus(404);
  }

  return res.send(Webhook);
}

export async function getAllWebhooksHandler(req: Request, res: Response) {
  const Webhook = await findAllWebhooks();

  if (!Webhook) {
    return res.sendStatus(404);
  }

  return res.send(Webhook);
}

