import express from "express";

import { getRegionHandler } from "../aws/regions";

import { getInstanceHandler } from "../aws/instance";

import {checkStackHandler} from "../controller/checkstack";

const router = express.Router();

router.get("/getRegions", getRegionHandler);

router.get("/getInstances", getInstanceHandler);

router.post("/checkStack",checkStackHandler);

export default router;
