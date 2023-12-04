import mongoose from "mongoose";
import { nanoid } from "nanoid";

export interface ProjectDocument extends mongoose.Document {
  projId: string;
  name: string;
  orgId: string;
  userId: string;
  role:string;
  collaborator :string;
  service:string;
  environment:string;
  price:number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new mongoose.Schema(
  {
    projId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(10),
    },
    name: { type: String, required: true },
    orgId: { type: String, required: true },    
    userId: { type: String, required: true },
    role: { type: String },
    collaborator: { type: String },
    service: { type: String},
    environment: { type: String},
    price: { type: Number},
  },
  { timestamps: true }
);

const Project = mongoose.model<ProjectDocument>("Project", ProjectSchema);

export default Project;
