import mongoose from "mongoose";
import { nanoid } from "nanoid";
import * as dotenv from 'dotenv';
dotenv.config();

const freeCode = process.env.FREE_CODE as string;

export interface UserDocument extends mongoose.Document {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  website: string;
  githubId:string;
  installId:string;
  googleId:string;
  member_since: Date;
  role:string;
  access_token:string;
  userName:string;
  billing:string;
  deployment: number;
  permission: string;
  last_activity:Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(10),
    },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    userName:{ type: String },
    website: { type: String },
    member_since: { type: Date, default: Date.now },
    role: { type: String },
    billing: { type: String,default:freeCode },
    deployment : {type: Number, default: 0},
    googleId: { type: String },
    access_token:{type: String},
    githubId: { type: String },
    installId: { type: String },
    permission: { type: String },
    last_activity: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model<UserDocument>("user", UserSchema);

export default User;
