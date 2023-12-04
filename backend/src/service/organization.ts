import {
    DocumentDefinition,
    FilterQuery,
    UpdateQuery,
    QueryOptions,
  } from "mongoose";
  import Organization, { OrganizationDocument } from "../model/organization";
  
  export function createOrganization(input: DocumentDefinition<OrganizationDocument>) {
    return Organization.create(input);
  }
  
  export function findOrganization(
    query: FilterQuery<OrganizationDocument>,
    options: QueryOptions = { lean: true }
  ) {
    return Organization.findOne(query, {}, options);
  }
  
  export function findOwner(query: string) {
    return Organization.find({ ownerId: query });
  }
  
  export function findAllOrganizations() {
    return Organization.find({});
  }
  
  export function findAndUpdate(
    query: FilterQuery<OrganizationDocument>,
    update: UpdateQuery<OrganizationDocument>,
    options: QueryOptions
  ) {
    return Organization.findOneAndUpdate(query, update, options);
  }
  
  export function deleteOrganization(query: FilterQuery<OrganizationDocument>) {
    return Organization.deleteOne(query);
  }
  
  export function countOrganizationsByOwner(ownerId: string) {
    return Organization.countDocuments({ ownerId });
}