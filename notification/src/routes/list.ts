import {
  aggregateAndCount,
  currentUser,
  QueryOptions,
  requireAuth,
  validateRequest,
  Notification,
  NotificationStatus,
} from "@ezdev/core";
import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
const router = express.Router();

router.get(
  "/list",
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = {
      "receivers.id": new Types.ObjectId(req.currentUser?.id),
    };
    if (req.query.supplierId) {
      criteria.supplierId = new Types.ObjectId(req.query.supplierId as string);
    }

    if (req.query.startDate) {
      criteria["createdAt"] = { $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      if (req.query.startDate) {
        criteria["createdAt"] = {
          $gte: new Date(req.query.startDate as string),
          $lte: new Date(req.query.endDate as string),
        };
      } else {
        criteria["createdAt"] = { $lte: new Date(req.query.endDate as string) };
      }
    }
    const secondCriteria: any = {
      status: { $ne: NotificationStatus.Deleted },
    };

    if (req.query.status) {
      secondCriteria.status = req.query.status;
    }
    const aggregates: any = [
      { $match: criteria },
      { $unwind: "$receivers" },
      {
        $project: {
          _id: false,
          id: "$_id",
          title: 1,
          body: 1,
          status: "$receivers.status",
          senderName: 1,
          supplierId: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $match: secondCriteria },
      { $sort: { createdAt: -1 } },
    ];

    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const data = await aggregateAndCount(Notification, options, aggregates);
    res.status(StatusCodes.OK).send(data);
  }
);

export { router as listRouter };
