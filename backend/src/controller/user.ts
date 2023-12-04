import { Request, Response } from "express";
import { get } from "lodash";
import {
  createUser,
  findAndUpdate,
  deleteUser,
  findUser,
  findAllUsers,
  findGoogle,
  findGithub,
  findInstall
} from "../service/user";
import { signJwt } from '../utils/jwtUtils';

export async function createUserHandler(req: Request, res: Response) {
  const body = req.body;

  console.log(req.body);

  const User = await createUser({ ...body });

  return res.send(User);
}

// export async function createUserHandler(req: Request, res: Response) {
//   try {
//     const body = req.body;
//     const user = await createUser({ ...body });

//     // Ensure that the user was created successfully before signing the JWT
//     if (user) {
//       // The payload should contain the user identifier and any other claims you need
//       const payload = {
//         id: user._id, // Assuming your user object has an _id field
//         email: user.email, // Assuming your user object has an email field
//         // Add other user-specific claims you might need
//       };

//       // Sign the token with the payload and your secret
//       const token = signJwt(payload);

//       // Send the token and user data back to the client
//       return res.status(201).send({ user, token });
//     } else {
//       return res.status(400).send('User could not be created');
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send('Error creating user');
//   }
// }

export async function updateUserHandler(req: Request, res: Response) {
  const userId = get(req, "params.userId");
  const update = req.body;
  const User = await findUser({ userId });

  if (!User) {
    return res.sendStatus(404);
  }

  const updatedUser = await findAndUpdate({ userId }, update, {
    new: true,
  });

  return res.send(updatedUser);
}
export async function getUserHandler(req: Request, res: Response) {
  const userId = get(req, "params.userId");
  
  const User = await findUser({ userId });

  if (!User) {
    return res.status(404).send("User not found");
  }

  return res.send(User);
}

export async function getGoogleHandler(req: Request, res: Response) {
  const googleId = get(req, "params.googleId");

  const Google = await findGoogle(googleId);

  if (!Google) {
    return res.sendStatus(404);
  }

  return res.send(Google);
}

export async function getGithubHandler(req: Request, res: Response) {
  const githubId = get(req, "params.githubId");

  const Github = await findGithub(githubId);

  if (!Github) {
    return res.sendStatus(404);
  }

  return res.send(Github);
}

export async function getInstallHandler(req: Request, res: Response) {
  const installId = get(req, "params.installId");

  const Install = await findInstall(installId);

  if (!Install) {
    return res.sendStatus(404);
  }

  return res.send(Install);
}


export async function getAllUsersHandler(req: Request, res: Response) {
  const User = await findAllUsers();

  if (!User) {
    return res.sendStatus(404);
  }

  return res.send(User);
}

export async function deleteUserHandler(req: Request, res: Response) {
  const UserId = get(req, "params.UserId");

  const User = await findUser({ UserId });

  if (!User) {
    return res.sendStatus(404);
  }

  await deleteUser({ UserId });

  return res.send(User);
}
