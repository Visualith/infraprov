import { RegionInfo } from '@aws-cdk/region-info';
import { Request, Response } from "express";
export async function getRegionHandler(req: Request, res: Response) {

  // Get the list of regions
    const regionNames = RegionInfo.regions.map((region) => region.name);

    return res.send(regionNames);
  
  }

