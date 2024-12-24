import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Notification,
  NotificationStatus,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/delete",
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const data = req.body;
    try {
      const condition: any = {
        "receivers.id": req.currentUser?.id,
      };
      const filter: any = {
        "r.id": req.currentUser?.id,
      };
      if (data.status) {
        filter["r.status"] = data.status;
      }
      if (data.supplierId) {
        condition.supplierId = data.supplierId;
      }
      if (data.id) {
        condition._id = data.id;
      }
      const result = await Notification.updateMany(
        condition,
        {
          $set: {
            "receivers.$[r].status": NotificationStatus.Deleted,
          },
        },
        {
          arrayFilters: [filter],
          upsert: true,
        }
      ).session(session);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send();
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Update notification status operation failed", error);
      throw new BadRequestError("Update notification status operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as deleteRouter };
