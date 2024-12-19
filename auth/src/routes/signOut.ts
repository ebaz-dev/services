import { currentUser } from "@ezdev/core";
import express, { Request, Response } from "express";
import { UserDevice } from "../shared";

const router = express.Router();

router.post("/signOut", currentUser, async (req: Request, res: Response) => {
  const device = await UserDevice.findById(req.currentUser?.deviceId);

  if (device) {
    device.isLogged = false;
    device.logoutTime = new Date();
    await device.save();
  }

  req.session = null;
  res.send({});
});

export { router as signOutRouter };
