import express from "express";
import validate from "../middleware/validateRequest";
import { createApplicationSchema, updateApplicationSchema,getApplicationSchema,deleteApplicationSchema } from "../schema/application";
import {
    getAllApplicationsHandler,
    getClusterHandler,
    getOwnerHandler,
    createApplicationHandler,
    deleteApplicationHandler,
    updateApplicationHandler,
    getProjectHandler,
    updateEnvVariableHandler,
    getApplicationHandler,
    getBuildLogHandler,
    checkBuildStatusHandler,
    getVpaRecommendationController
  } from "../controller/application";

const router = express.Router();


router.post("/applications/vpa", getVpaRecommendationController);
/**
 * @openapi
 * /api/Applications:
 *   get:
 *     tags:
 *       - Application
 *     summary: Get all Applications
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schema/Application'
 */
 router.get("/applications", getAllApplicationsHandler);

 /**
* @openapi
* /api/applications/setEnv/{applicationId}:
*   put:
*     tags:
*       - Application
*     summary: Set environment variables for an Application
*     parameters:
*       - name: applicationId
*         in: path
*         description: The id of the Application
*         required: true
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               env:
*                 type: object
*                 additionalProperties: true
*                 description: Environment variables to set for the application.
*             example:
*               env:
*                 KEY1: "value1"
*                 KEY2: "value2"
*     responses:
*       200:
*         description: Success
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schema/Application'
*       400:
*         description: Bad Request
*       404:
*         description: Application Not Found
*/
router.put(
  "applications/setEnv/:applicationId",
  // Possibly add validation middleware here if needed
  updateEnvVariableHandler
);



/**
 * @openapi
 * /api/applications/owner/{ownerId}:
 *   get:
 *     tags:
 *       - Application
 *     summary: Get Applications owned by a specific owner
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         description: The ID of the owner to filter by
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
 *                 $ref: '#/components/schema/Application'
 */
 router.get("/applications/owner/:ownerId", getOwnerHandler);

 router.get('/ApplicationBuildStatus/:applicationId', checkBuildStatusHandler); //Check cluster status every 5 minutes and after coming to the page

 /**
 * @openapi
 * /api/applications/project/{projId}:
 *   get:
 *     tags:
 *       - Application
 *     summary: Get Applications owned by a project
 *     parameters:
 *       - in: path
 *         name: projId
 *         required: true
 *         description: The ID of the owner to filter by Project
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
 *                 $ref: '#/components/schema/Application'
 */
  router.get("/applications/project/:projId", getProjectHandler);

 /**
  * @openapi
  * /api/Applications/{clusterId}:
  *   get:
  *     tags:
  *       - Application
  *     summary: Get application by the clusterId
  *     parameters:
  *       - name: clusterId
  *         in: path
  *         description: The id of the Cluster
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/Application'
  *       404:
  *         description: Cluster not found
  */
 router.get("/applications/:clusterId", getClusterHandler);

 router.get('/ApplicationBuildLog/:applicationId', getBuildLogHandler);


 /**
  * @openapi
  * /api/Applications/{applicationId}:
  *   get:
  *     tags:
  *       - Application
  *     summary: Get application by the applicationId
  *     parameters:
  *       - name: applicationId
  *         in: path
  *         description: The id of the Application
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/Application'
  *       404:
  *         description: Cluster not found
  */
  router.get("/applications/application/:applicationId", getApplicationHandler);
 

 
/**
* @openapi
* /api/createApplication:
*   post:
*     tags:
*       - Application
*     summary: Create a new Application
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schema/Application'
*     responses:
*       201:
*         description: Created
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schema/Application'
*       400:
*         description: Bad Request
*/
router.post(
  "/createApplication",
  validate(createApplicationSchema),
  createApplicationHandler
);
/**
* @openapi
* /api/updateApplication/{applicationId}:
*   put:
*     tags:
*       - Application
*     summary: Update an Application
*     parameters:
*       - name: applicationId
*         in: path
*         description: The id of the Application
*         required: true
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schema/Application'
*     responses:
*       200:
*         description: Success
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schema/Application'
*       400:
*         description: Bad Request
*       404:
*         description: Not Found
*/
router.put(
  "/updateApplication/:applicationId",
  validate(updateApplicationSchema),
  updateApplicationHandler
);
/**
* @openapi
* /api/deleteApplication/{applicationId}:
*   delete:
*     tags:
*       - Application
*     summary: Delete an Application by ApplicationId
*     parameters:
*       - name: applicationId
*         in: path
*         description: The id of the Application
*         required: true
*     responses:
*       204:
*         description: No Content
*       404:
*         description: Not Found
*/

router.delete("/deleteApplication/:applicationId", deleteApplicationHandler);

export default router;