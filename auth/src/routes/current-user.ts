import express, { Request, Response } from "express";
import { requireAuth } from "@ezdev/core";
import { User } from "../shared";

const router = express.Router();

router.get("/currentuser", requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.currentUser?.id);

  res.json({ currentUser: user?.toJSON() || null });
});

export { router as currentUserRouter };
