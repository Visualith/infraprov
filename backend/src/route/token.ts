import jwt from 'jsonwebtoken';
import axios from 'axios';
import { DateTime } from 'luxon';
import * as dotenv from 'dotenv';
dotenv.config();

import { Router, Request, Response } from 'express';
const router = Router();

const pem_key = process.env.pem_key as string;
const app_id = process.env.APP_ID as string;

router.get("/gettoken", generateToken);

async function generateToken(req: Request, res: Response) {
    const pem = await axios.get(pem_key);
    // Open PEM
    const signingKey = pem.data;

    // Calculate "now" subtracting 30 seconds
    const now = DateTime.now().minus({ seconds: 30 });

    const payload = {
        // Issued at time (now minus 30 seconds)
        iat: Math.floor(now.toSeconds()),
        // JWT expiration time (10 minutes maximum from "now")
        exp: Math.floor(now.plus({ minutes: 10 }).toSeconds()),
        // GitHub App's identifier
        iss: app_id,
    };

    // Create JWT
    const encoded_jwt = jwt.sign(payload, signingKey, { algorithm: "RS256" });

    res.send(encoded_jwt);
}

export default router;
