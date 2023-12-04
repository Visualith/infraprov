import express from "express";
import validate from "../middleware/validateRequest";
import { createOrganizationSchema, updateOrganizationSchema,getOrganizationSchema,deleteOrganizationSchema } from "../schema/organization";
import {
    getAllOrganizationsHandler,
    getOrganizationHandler,
    getOwnerHandler,
    createOrganizationHandler,
    deleteOrganizationHandler,
    updateOrganizationHandler,
  } from "../controller/organization";

const router = express.Router();

/**
 * @openapi
 * /api/organizations:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Get all organizations
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schema/Organization'
 */
 router.get("/organizations", getAllOrganizationsHandler);

/**
 * @openapi
 * /api/organizations/owner/{ownerId}:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Get organizations owned by a specific owner
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
 *                 $ref: '#/components/schema/Organization'
 */
 router.get("/organizations/owner/:ownerId", getOwnerHandler);

 /**
  * @openapi
  * /api/organizations/{orgId}:
  *   get:
  *     tags:
  *       - Organization
  *     summary: Get a single organization by the orgId
  *     parameters:
  *       - name: orgId
  *         in: path
  *         description: The id of the organization
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Success
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schema/Organization'
  *       404:
  *         description: Organization not found
  */
 router.get("/organizations/:orgId", getOrganizationHandler);
 

 
/**
* @openapi
* /api/createorganization:
*   post:
*     tags:
*       - Organization
*     summary: Create a new organization
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schema/Organization'
*     responses:
*       201:
*         description: Created
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schema/Organization'
*       400:
*         description: Bad Request
*/
router.post(
  "/createorganization",
  validate(createOrganizationSchema),
  createOrganizationHandler
);
/**
* @openapi
* /api/updateorganization/{orgId}:
*   put:
*     tags:
*       - Organization
*     summary: Update an organization
*     parameters:
*       - name: orgId
*         in: path
*         description: The id of the organization
*         required: true
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schema/Organization'
*     responses:
*       200:
*         description: Success
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schema/Organization'
*       400:
*         description: Bad Request
*       404:
*         description: Not Found
*/
router.put(
  "/updateorganization/:orgId",
  validate(updateOrganizationSchema),
  updateOrganizationHandler
);
/**
* @openapi
* /api/deleteorganization/{organizationId}:
*   delete:
*     tags:
*       - Organization
*     summary: Delete an organization by organizationId
*     parameters:
*       - name: organizationId
*         in: path
*         description: The id of the organization
*         required: true
*     responses:
*       204:
*         description: No Content
*       404:
*         description: Not Found
*/

router.delete("/deleteorganization/:orgId", deleteOrganizationHandler);

export default router;