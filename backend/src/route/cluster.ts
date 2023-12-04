import express from "express";
import validate from "../middleware/validateRequest";
import { createClusterSchema, updateClusterSchema,getClusterSchema,deleteClusterSchema } from "../schema/cluster";
import {
    getAllClustersHandler,
    getClusterHandler,
    getOwnerHandler,
    createClusterHandler,
    deleteClusterHandler,
    updateClusterHandler,
    getProjectHandler,
    checkBuildStatusHandler,
    getBuildLogHandler,
    teardownController
   // rebuildJenkinsBuildHandler
  } from "../controller/cluster";

const router = express.Router();

router.post('/teardown', teardownController);

/**
 * @openapi
 * /api/Clusters:
 *   get:
 *     tags:
 *       - Cluster
 *     summary: Get all Clusters
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schema/Cluster'
 */
 router.get("/Clusters", getAllClustersHandler);

/**
 * @openapi
 * /api/Clusters/owner/{ownerId}:
 *   get:
 *     tags:
 *       - Cluster
 *     summary: Get Clusters owned by a specific owner
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
 *                 $ref: '#/components/schema/Cluster'
 */
 router.get("/Clusters/owner/:ownerId", getOwnerHandler);

 /**
 * @openapi
 * /api/Clusters/project/{projId}:
 *   get:
 *     tags:
 *       - Cluster
 *     summary: Get Clusters owned by a project
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
 *                 $ref: '#/components/schema/Cluster'
 */
  router.get("/Clusters/project/:projId", getProjectHandler);

 /**
  * @openapi
  * /api/Clusters/{clusterId}:
  *   get:
  *     tags:
  *       - Cluster
  *     summary: Get a single Cluster by the clusterId
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
  *               $ref: '#/components/schema/Cluster'
  *       404:
  *         description: Cluster not found
  */
 router.get("/Clusters/:clusterId", getClusterHandler);


 /**
 * @openapi
 * /api/Clusters/{clusterId}/build/{buildNumber}:
 *   get:
 *     tags:
 *       - Cluster
 *     summary: Get the build status of a Cluster
 *     parameters:
 *       - name: clusterId
 *         in: path
 *         description: The id of the Cluster
 *         required: true
 *         schema:
 *           type: string
 *       - name: buildNumber
 *         in: path
 *         description: The build number of the Cluster
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schema/Cluster'
 *       404:
 *         description: Cluster not found
 */
router.get('/ClusterBuildStatus/:clusterId', checkBuildStatusHandler); //Check cluster status every 5 minutes and after coming to the page

router.get('/ClusterBuildLog/:clusterId', getBuildLogHandler);



//router.get('/rebuildJenkinsBuild/:clusterId', rebuildJenkinsBuildHandler);
 
/**
* @openapi
* /api/createCluster:
*   post:
*     tags:
*       - Cluster
*     summary: Create a new Cluster
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schema/Cluster'
*     responses:
*       201:
*         description: Created
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schema/Cluster'
*       400:
*         description: Bad Request
*/
router.post(
  "/createCluster",
  validate(createClusterSchema),
  createClusterHandler
);
/**
* @openapi
* /api/updateCluster/{clusterId}:
*   put:
*     tags:
*       - Cluster
*     summary: Update an Cluster
*     parameters:
*       - name: clusterId
*         in: path
*         description: The id of the Cluster
*         required: true
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schema/Cluster'
*     responses:
*       200:
*         description: Success
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schema/Cluster'
*       400:
*         description: Bad Request
*       404:
*         description: Not Found
*/
router.put(
  "/updateCluster/:clusterId",
  validate(updateClusterSchema),
  updateClusterHandler
);
/**
* @openapi
* /api/deleteCluster/{ClusterId}:
*   delete:
*     tags:
*       - Cluster
*     summary: Delete an Cluster by ClusterId
*     parameters:
*       - name: ClusterId
*         in: path
*         description: The id of the Cluster
*         required: true
*     responses:
*       204:
*         description: No Content
*       404:
*         description: Not Found
*/

router.delete("/deleteCluster/:clusterId", deleteClusterHandler);

export default router;