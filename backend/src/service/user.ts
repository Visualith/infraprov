import {
    DocumentDefinition,
    FilterQuery,
    UpdateQuery,
    QueryOptions,
  } from "mongoose";
  import User, { UserDocument } from "../model/user";
  
  export function createUser(input: DocumentDefinition<UserDocument>) {
    return User.create(input);
  }
  
  export function findUser(
    query: FilterQuery<UserDocument>,
    options: QueryOptions = { lean: true }
  ) {
    
    return User.findOne(query, {}, options);
  }

  export function findGoogle(query: string) {
    return User.find({ googleId: query });
  }

  export function findGithub(query: string) {
    return User.find({ githubId: query });
  }

  export function findInstall(query: string) {
    return User.find({ installId: query });
  }
    
  export function findAllUsers() {
    return User.find({});
  }
  
  export function findAndUpdate(
    query: FilterQuery<UserDocument>,
    update: UpdateQuery<UserDocument>,
    options: QueryOptions
  ) {
    return User.findOneAndUpdate(query, update, options);
  }
  
  export function deleteUser(query: FilterQuery<UserDocument>) {
    return User.deleteOne(query);
  }
  