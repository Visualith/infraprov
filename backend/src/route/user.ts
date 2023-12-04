import express from "express";
import validate from "../middleware/validateRequest";
import { createUserSchema, updateUserSchema,getUserSchema,deleteUserSchema } from "../schema/user";
import {
    getAllUsersHandler,
    getUserHandler,  
    createUserHandler,
    deleteUserHandler,
    updateUserHandler,
    getGithubHandler,
    getGoogleHandler,
    getInstallHandler
  } from "../controller/user";

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - User
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schema/User'
 */
 router.get("/users", getAllUsersHandler);

 /**
  * @openapi
  * /api/users/{userId}:
  *   get:
  *     tags:
  *       - User
  *     summary: Get a single user by the userId
  *     parameters:
  *       - name: userId
  *         in: path
  *         description: The id of the user
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/User'
  *       404:
  *         description: User not found
  */
 router.get("/users/:userId", getUserHandler);

 /**
  * @openapi
  * /api/users/google/{googleId}:
  *   get:
  *     tags:
  *       - User
  *     summary: Get user belonging to a googleID
  *     parameters:
  *       - in: path
  *         name: googleId
  *         required: true
  *         description: The ID of the user to filter by
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 $ref: '#/components/schema/User'
  */
  router.get("/users/google/:googleId", getGoogleHandler);

 /**
  * @openapi
  * /api/users/github/{githubId}:
  *   get:
  *     tags:
  *       - User
  *     summary: Get user belonging to a githubID
  *     parameters:
  *       - in: path
  *         name: googleId
  *         required: true
  *         description: The ID of the user to filter by
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 $ref: '#/components/schema/User'
  */
    router.get("/users/github/:githubId", getGithubHandler);

    /**
  * @openapi
  * /api/users/github/{installId}:
  *   get:
  *     tags:
  *       - User
  *     summary: Get user belonging to a installId
  *     parameters:
  *       - in: path
  *         name: googleId
  *         required: true
  *         description: The ID of the user to filter by
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 $ref: '#/components/schema/User'
  */
     router.get("/users/github/:installId", getInstallHandler);
    
 
 /**
  * @openapi
  * /api/createuser:
  *   post:
  *     tags:
  *       - User
  *     summary: Create a new user
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schema/User'
  *     responses:
  *       201:
  *         description: Created
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/User'
  *       400:
  *         description: Bad Request
  */
 router.post(
   "/createuser",
   validate(createUserSchema),
   createUserHandler
 );
 
 /**
  * @openapi
  * /api/users/{userId}:
  *   put:
  *     tags:
  *       - User
  *     summary: Update a user by userId
  *     parameters:
  *       - name: userId
  *         in: path
  *         description: The id of the user
  *         required: true
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schema/User'
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/User'
  *       400:
  *         description: Bad Request
  *       404:
  *         description: Not Found
  */
 router.put(
   "/users/:userId",
   validate(updateUserSchema),
   updateUserHandler
 );
 
 /**
  * @openapi
  * /api/users/{userId}:
  *   delete:
  *     tags:
  *       - User
  *     summary: Delete a user by userId
  *     parameters:
  *       - name: userId
  *         in: path
  *         description: The id of the user
  *         required: true
  *     responses:
  *       204:
  *         description: No Content
  *       404:
  *         description: Not Found
  */
 router.delete("/users/:userId", deleteUserHandler);
export default router;