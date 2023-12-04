import { object, string, TypeOf } from "zod";

/**
 * @openapi
 * components:
 *   schema:
 *     Organization:
 *       type: object
 *       required:
 *        - name
 *        - ownerId
 *       properties:
 *         name:
 *           type: string
 *         ownerId:
 *           type: string
 */

const payload = {
  body: object({
    name: string({
      required_error: "Name is required",
    }),   
    ownerId: string({
      required_error: "OwnerId is required",
    }),
  }),
};

const params = {
  params: object({
    orgId: string({
      required_error: "OrgId is required",
    }),
  }),
};

export const createOrganizationSchema = object({
  ...payload,
});

export const updateOrganizationSchema = object({
  ...params,
});

export const deleteOrganizationSchema = object({
  ...params,
});

export const getOrganizationSchema = object({
  ...params,
});

export type CreateOrganizationInput = TypeOf<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = TypeOf<typeof updateOrganizationSchema>;
export type ReadOrganizationInput = TypeOf<typeof getOrganizationSchema>;
export type DeleteOrganizationInput = TypeOf<typeof deleteOrganizationSchema>;