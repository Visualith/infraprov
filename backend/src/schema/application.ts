import { object, string, number, boolean, TypeOf } from "zod";

/**
 * @openapi
 * components:
 *   schema:
 *     Application:
 *       type: object
 *       required:
 *         - gitRepository
 *         - gitPath
 *         - gitBranch
 *         - ownerId
 *         - clusterId
 *         - projId
 *         - orgId
 * 
 *       properties:
 *         applicationId:
 *           type: string
 *         gitRepository:
 *           type: string
 *         env:
 *           type: object
 *           additionalProperties: true
 *           description: Environment variables for the application. This is an optional property.
 *         appName:
 *           type: string
 *         rootPath:
 *           type: string
 *         repoType:
 *           type: string
 *         gitPath:
 *           type: string
 *         gitBranch:
 *           type: string
 *         ownerId:
 *           type: string
 *         clusterId:
 *           type: string
 *         projId:
 *           type: string
 *         orgId:
 *           type: string
 *         buildMode:
 *           type: string
 *         port:
 *           type: number
 *         isInstalled:
 *           type: boolean
 *         installId:
 *           type: string
 *       example:
 *         gitRepository: "https://github.com/user/repo.git"
 *         gitPath: "/"
 *         gitBranch: "main"
 *         repoType: private
 *         appName: abc
 *         rootPath: xyz/abc
 *         ownerId: "user123"
 *         clusterId: "abcde12345"
 *         projId: "project123"
 *         orgId: "org123"
 *         buildMode: "debug"
 *         port: 3000
 *         isInstalled: true
 *         installId: hjhjkhasd89089
 */

const payload = {
  body: object({
    gitRepository: string({
      required_error: "Git repository is required",
    }),
    gitPath: string({
      required_error: "Git path is required",
    }),
    gitBranch: string({
      required_error: "Git branch is required",
    }),
    ownerId: string({
      required_error: "Owner ID is required",
    }),
    clusterId: string({
      required_error: "Cluster ID is required",
    }),
    projId: string({
      required_error: "Project ID is required",
    }),
    orgId: string({
      required_error: "Organization ID is required",
    }),
    buildMode: string({
      required_error: "Build mode is required",
    }),
    port: number({
      required_error: "Port is required",
    }),
    isInstalled: boolean({
      required_error: "isInstalled is required",
    }),
  }),
};

const params = {
  params: object({
    applicationId: string({
      required_error: "Application ID is required",
    }),
  }),
};

export const createApplicationSchema = object({
  ...payload,
});

export const updateApplicationSchema = object({
  ...params
});

export const deleteApplicationSchema = object({
  ...params,
});

export const getApplicationSchema = object({
  ...params,
});

export type CreateApplicationInput = TypeOf<typeof createApplicationSchema>;
export type UpdateApplicationInput = TypeOf<typeof updateApplicationSchema>;
export type ReadApplicationInput = TypeOf<typeof getApplicationSchema>;
export type DeleteApplicationInput = TypeOf<typeof deleteApplicationSchema>;
