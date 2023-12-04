import {
    DocumentDefinition,
    FilterQuery,
    UpdateQuery,
    QueryOptions,
  } from "mongoose";
  import Cluster, { ClusterDocument } from "../model/cluster";
  import User, { UserDocument } from "../model/user";
  
  export function createCluster(input: DocumentDefinition<ClusterDocument>) {
    return Cluster.create(input);
  }

  export function countClustersByOwner(ownerId: string) {
    return Cluster.countDocuments({ ownerId });
}
  
  export function findCluster(
    query: FilterQuery<ClusterDocument>,
    options: QueryOptions = { lean: true }
  ) {
    return Cluster.findOne(query, {}, options);
  }

  export async function increasedeploycount(userId: string): Promise<boolean> {
    try {
        // Fetch the user with a given userId
        const user = await User.findOne({ userId });

        if (!user) {
          console.log("User not found");
          throw new Error('User not found');
        }

        const currentDeploymentCount: number = user.deployment ?? 0;
        console.log(currentDeploymentCount, "Current deployment count");

        // If user is an admin, bypass the deployment limit checks
        if (user.role === "admin") {
            await User.updateOne({ userId }, { $inc: { deployment: 1 } });
            return true;
        }

        // Calculate the number of months since account creation
        const now = new Date();
        const creationDate = new Date(user.member_since);
        const monthsSinceCreation = (now.getFullYear() - creationDate.getFullYear()) * 12 + now.getMonth() - creationDate.getMonth();

        // Calculate the total deployments allowed up to this month
        const allowedDeployments = 200 * (monthsSinceCreation + 1); // +1 because the user should have 200 deployments allowed in the month of creation as well

        // Check if current deployments are under the allowed limit
        const isDeploymentUnderLimit = currentDeploymentCount < allowedDeployments;

        // Check if all conditions are true
        if (isDeploymentUnderLimit) {
            await User.updateOne({ userId }, { $inc: { deployment: 1 } });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error: ', error);
        return false;
    }
}


export async function getDeploymentsLeft(userId: string): Promise<number | string> {
  try {
      // Fetch the user with a given userId
      const user = await User.findOne({ userId });

      if (!user) {
          console.log("User not found");
          throw new Error('User not found');
      }

      // If user is an admin, they have unlimited deployments
      if (user.role === "admin") {
          return "Unlimited";
      }

      const currentDeploymentCount: number = user.deployment ?? 0;

      // Calculate the number of months since account creation
      const now = new Date();
      const creationDate = new Date(user.member_since);
      const monthsSinceCreation = (now.getFullYear() - creationDate.getFullYear()) * 12 + now.getMonth() - creationDate.getMonth();

      // Calculate the total deployments allowed up to this month
      const allowedDeployments = 200 * (monthsSinceCreation + 1); // +1 because the user should have 200 deployments allowed in the month of creation as well

      // Calculate the number of deployments left for the user this month
      const deploymentsLeft = allowedDeployments - currentDeploymentCount;

      return deploymentsLeft;
  } catch (error) {
      console.error('Error: ', error);
      return "Error occurred";
  }
}

  
  export function findOwner(query: string) {
    return Cluster.find({ ownerId: query });
  }
  
  export function findProject(query: string) {
    return Cluster.find({ projId: query });
  }

  export function findAllClusters() {
    return Cluster.find({});
  }
  
  export function findAndUpdate(
    query: FilterQuery<ClusterDocument>,
    update: UpdateQuery<ClusterDocument>,
    options: QueryOptions
  ) {
    return Cluster.findOneAndUpdate(query, update, options);
  }
  
  export function deleteCluster(query: FilterQuery<ClusterDocument>) {
    return Cluster.deleteOne(query);
  }
  