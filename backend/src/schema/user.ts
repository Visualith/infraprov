import { object, string, TypeOf } from "zod";

/**
 * @openapi
 * components:
 *   schema:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - email
 *       properties:     
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         userName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         website:
 *           type: string
 *         role:
 *           type: string
 *         billing:
 *           type: string
 *         googleId:
 *           type: string
 *         githubId:
 *           type: string
 *         installId:
 *           type: string
 *         permission:
 *           type: string
 *         access_token:
 *           type: string
 */

const payload = {
  body: object({
    firstName: string({
      required_error: "FirstName is required",
    }),   
    // email: string({
    //   required_error: "Email is required",
    // }),
  }),
};

const params = {
  params: object({
    userId: string({
      required_error: "userId is required",
    }),
  }),
};

export const createUserSchema = object({
  ...payload,
});

export const updateUserSchema = object({
  ...params,
});

export const deleteUserSchema = object({
  ...params,
});

export const getUserSchema = object({
  ...params,
});

export type CreateUserInput = TypeOf<typeof createUserSchema>;
export type UpdateUserInput = TypeOf<typeof updateUserSchema>;
export type ReadUserInput = TypeOf<typeof getUserSchema>;
export type DeleteUserInput = TypeOf<typeof deleteUserSchema>;