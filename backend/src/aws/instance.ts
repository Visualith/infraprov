import { Request, Response } from "express";
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

interface Instance {
    details: {
        memory?: number;
        vcpu?: number;
        physical_processor_description?: string;
    };
    name: string;
}

export async function getInstanceHandler(req: Request, res: Response) {
    const url = 'https://api.vantage.sh/v1/products?provider_id=aws&service_id=aws-ec2';
    const options = {
        headers: {
            accept: 'application/json',
            authorization: process.env.INSTANCE_VANTAGE_TOKEN as string
        }
    };

    try {
        const response = await axios.get(url, options);
        const data = response.data;

        const filteredInstances = data.products.filter((instance: Instance) => {
            const isGraviton2 = instance.details.physical_processor_description?.includes("AWS Graviton");
            const isLessThan2GB = instance.details.memory && instance.details.memory < 2;
            const isLessThan2CPU = instance.details.vcpu && instance.details.vcpu < 2;

            return !isGraviton2 && !isLessThan2GB && !isLessThan2CPU;
        });

        res.send({ ...data, products: filteredInstances });
    } catch (err) {
        res.send(err);
    }
}
