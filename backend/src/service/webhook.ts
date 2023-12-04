import {
    DocumentDefinition,
    FilterQuery,
    UpdateQuery,
    QueryOptions,
  } from "mongoose";
  import Webhook, { WebhookDocument } from "../model/webhook";
  
  export function createWebhook(installId: string, data: any) {
    return Webhook.create({ installId, data });
  }
  
  export function findInstallId(query: string) {
    return Webhook.find({ installId: query })
                  .sort({ createdAt: -1 })
                  .limit(3);
  }
  
  export function findAllWebhooks() {
    return Webhook.find({});
  }
  