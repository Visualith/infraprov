import mongoose from "mongoose";
import { nanoid } from "nanoid";

export interface OrganizationDocument extends mongoose.Document {
  orgId: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(10),
    },
    name: { type: String, default: "default" },
    ownerId: { type: String },    
  },
  { timestamps: true }
);

const Organization = mongoose.model<OrganizationDocument>("organization", OrganizationSchema);

export default Organization;
