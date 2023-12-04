import express from "express";
import validate from "../middleware/validateRequest";
import { createProjectSchema, updateProjectSchema,getProjectSchema,deleteProjectSchema } from "../schema/project";
import {
    getAllProjectsHandler,
    getUserHandler,
    getProjectHandler,
    createProjectHandler,
    deleteProjectHandler,
    updateProjectHandler,
    getOrgHandler
  } from "../controller/project";

const router = express.Router();
/**
  * @openapi
  * /api/projects/user/{userId}:
  *   get:
  *     tags:
  *       - Project
  *     summary: Get projects belonging to a specific user
  *     parameters:
  *       - in: path
  *         name: userId
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
  *                 $ref: '#/components/schema/Project'
  */
 router.get("/projects/user/:userId", getUserHandler);

/**
  * @openapi
  * /api/projects/org/{orgId}:
  *   get:
  *     tags:
  *       - Project
  *     summary: Get projects belonging to a specific org
  *     parameters:
  *       - in: path
  *         name: orgId
  *         required: true
  *         description: The ID of the proj to filter by org
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
  *                 $ref: '#/components/schema/Project'
  */
  router.get("/projects/org/:orgId", getOrgHandler);
 
 /**
  * @openapi
  * /api/projects/{projId}:
  *   get:
  *     tags:
  *       - Project
  *     summary: Get a single project by the projId
  *     parameters:
  *       - name: projId
  *         in: path
  *         description: The id of the project
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/Project'
  *       404:
  *         description: Project not found
  */
 router.get("/projects/:projId", getProjectHandler);
 
 /**
  * @openapi
  * /api/createproject:
  *   post:
  *     tags:
  *       - Project
  *     summary: Create a new project
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schema/Project'
  *     responses:
  *       201:
  *         description: Created
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/Project'
  *       400:
  *         description: Bad Request
  */
 router.post(
   "/createproject",
   validate(createProjectSchema),
   createProjectHandler
 );
  
 /**
  * @openapi
  * /api/projects:
  *   get:
  *     tags:
  *       - Project
  *     summary: Get all projects
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 $ref: '#/components/schema/Project'
  */
 router.get("/projects", getAllProjectsHandler);
 
 /**
  * @openapi
  * /api/projects/{projId}:
  *   get:
  *     tags:
  *       - Project
  *     summary: Get a single project by the projId
  *     parameters:
  *       - name: projId
  *         in: path
  *         description: The id of the project
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/Project'
  *       404:
  *         description: Project not found
  */
 router.get("/projects/:projId", getProjectHandler);
 
 
 /**
  * @openapi
  * /api/projects/{projId}:
  *   put:
  *     tags:
  *       - Project
  *     summary: Update a project
  *     parameters:
  *       - name: projId
  *         in: path
  *         description: The id of the project
  *         required: true
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schema/Project'
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/Project'
  *       400:
  *         description: Bad Request
  *       404:
  *         description: Not Found
  */
 router.put(
   "/projects/:projId",
   validate(updateProjectSchema),
   updateProjectHandler
 );



 /**
  * @openapi
  * /api/projects/{projId}:
  *   delete:
  *     tags:
  *       - Project
  *     summary: Delete a project by projId
  *     parameters:
  *       - name: projId
  *         in: path
  *         description: The id of the project
  *         required: true
  *     responses:
  *       204:
  *         description: No Content
  *       404:
  *         description: Not Found
  */

router.delete("/projects/:projId", deleteProjectHandler);

export default router;