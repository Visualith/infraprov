import { Request, Response } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

export async function generateUniqueId(req: Request, res: Response) {

  const accountId = req.params.accountid as string; // Assuming accountId is sent as a query parameter

  // Example usage with some input data (name, age, and city)
  const inputData = {
    prefixSecret: process.env.PREFIX_SECRET as string,
    accountId: accountId,
    suffixSecret: process.env.SUFFIX_SECRET as string
  };

  // Generate a consistent UUIDv4 for the input data using hashing
  const uuid = generateConsistentUUIDv4(inputData);

  return res.send(uuid);
}

// Function to generate UUIDv4 for the same input data consistently
function generateConsistentUUIDv4(inputData: any): string {
  const crypto = require('crypto');

  // Convert the input data to a JSON string
  const inputDataString = JSON.stringify(inputData);

  // Create a SHA-256 hash of the input data
  const hash = crypto.createHash('sha256').update(inputDataString).digest();

  // Use the first 16 bytes (128 bits) of the hash to form the UUIDv4
  const uuidBytes = Buffer.alloc(16);
  hash.copy(uuidBytes, 0, 0, 16);

  // Set the version (4) and variant bits (2) for UUIDv4 compliance
  uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x40; // Version 4
  uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80; // Variant RFC4122

  // Format the UUID bytes as a string
  const uuidString = uuidBytes.toString('hex');

  // Insert hyphens at appropriate positions to make a valid UUID
  const formattedUUID = `${uuidString.substr(0, 8)}-${uuidString.substr(8, 4)}-${uuidString.substr(12, 4)}-${uuidString.substr(16, 4)}-${uuidString.substr(20)}`;

  return formattedUUID;
}
