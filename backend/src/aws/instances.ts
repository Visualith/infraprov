import { Request, Response } from "express";
import * as dotenv from 'dotenv';
dotenv.config();



export async function getInstanceHandler(req: Request, res: Response) {
    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: process.env.INSTANCE_VANTAGE_TOKEN as string
        }
      };
      
      fetch('https://api.vantage.sh/v1/products', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
    
}
