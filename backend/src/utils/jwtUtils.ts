import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

export function signJwt(payload: object): string {
  const secret = process.env.JWT_SECRET as string || 'your-secret'; 
  const expiresIn = '1h'; 


  return jwt.sign(payload, secret, { expiresIn });
}
