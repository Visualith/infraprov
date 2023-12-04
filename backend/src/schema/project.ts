import { object, string, TypeOf } from "zod";

/**
 * @openapi
 * components:
 *   schema:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - userId
 *         - orgId
 *       properties:
 *         name:
 *           type: string
 *         orgId:
 *           type: string
 *         userId:
 *           type: string
 *         role:
 *           type: string
 *         collaborator:
 *           type: string
 *         service:
 *           type: string
 *         environment:
 *           type: string
 *         price:
 *           type: number
 */


const payload = {
  body: object({
    name: string({
      required_error: "Name is required",
    }),   
    userId: string({
      required_error: "UserId is required",
    }),
    orgId: string({
        required_error: "OrgId is required",
      }),
  }),
};

const params = {
  params: object({
    projId: string({
      required_error: "ProjId is required",
    }),
  }),
};

export const createProjectSchema = object({
  ...payload,
});

export const updateProjectSchema = object({
  ...params,
});

export const deleteProjectSchema = object({
  ...params,
});

export const getProjectSchema = object({
  ...params,
});

export type CreateProjectInput = TypeOf<typeof createProjectSchema>;
export type UpdateProjectInput = TypeOf<typeof updateProjectSchema>;
export type ReadProjectInput = TypeOf<typeof getProjectSchema>;
export type DeleteProjectInput = TypeOf<typeof deleteProjectSchema>;