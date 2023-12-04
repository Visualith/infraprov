import mongoose from "mongoose";
import { nanoid } from "nanoid";

export interface WebhookDocument extends mongoose.Document {
  webhookId: string;
  data:{}
  installId:string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new mongoose.Schema(
  {
    webhookId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(10),
    },
    data: {
      type: Object,
      required: true,
    },
    installId: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

const Webhook = mongoose.model<WebhookDocument>("webhook", WebhookSchema);

export default Webhook;
