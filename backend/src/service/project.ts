import {
    DocumentDefinition,
    FilterQuery,
    UpdateQuery,
    QueryOptions,
  } from "mongoose";
  import Project, { ProjectDocument } from "../model/project";
  
  export function createProject(input: DocumentDefinition<ProjectDocument>) {
    return Project.create(input);
  }
  
  export function findProject(
    query: FilterQuery<ProjectDocument>,
    options: QueryOptions = { lean: true }
  ) {
    return Project.findOne(query, {}, options);
  }
  
  export function findUser(query: string) {
    return Project.find({ userId: query });
  }
  
  export function findAllProjects() {
    return Project.find({});
  }

  export function findOrg(query: string) {
    return Project.find({ orgId: query });
  }
  
  export function findAndUpdate(
    query: FilterQuery<ProjectDocument>,
    update: UpdateQuery<ProjectDocument>,
    options: QueryOptions
  ) {
    return Project.findOneAndUpdate(query, update, options);
  }
  
  export function deleteProject(query: FilterQuery<ProjectDocument>) {
    return Project.deleteOne(query);
  }

  export function countProjectsByOwner(userId: string) {
    return Project.countDocuments({ userId });
}
  