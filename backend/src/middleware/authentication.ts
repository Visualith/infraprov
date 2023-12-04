import { expressjwt } from 'express-jwt';
import * as dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallbackSecretValue'; 

const authenticateJWT = expressjwt({
    secret: JWT_SECRET,
    algorithms: ['HS256']
});

export default authenticateJWT;
