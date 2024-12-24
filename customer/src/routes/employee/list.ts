import express, { Request, Response } from "express";
import {
  currentUser,
  listAndCount,
  QueryOptions,
  requireAuth,
  validateRequest,
  Employee,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { User } from "@ebazdev/auth";

const router = express.Router();

router.get(
  "/employee",
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const filter: any = req.query;
    const criteria: any = {};
    const userCriteria: any = { _id: { $exists: false } };
    const userPopulate: any = { path: "user" };
    const customerPopulate = { path: "customer" };
    if (filter.name) {
      delete userCriteria._id;
      userCriteria.name = {
        $regex: filter.name,
        $options: "i",
      };
    }
    if (filter.phone) {
      delete userCriteria._id;
      userCriteria.phoneNumber = {
        $regex: filter.phone,
        $options: "i",
      };
    }
    if (filter.role) {
      criteria.role = filter.role;
    }

    if (filter.customerId) {
      criteria.customerId = new Types.ObjectId(filter.customerId as string);
    }

    if (!userCriteria._id) {
      const users = await User.find(userCriteria);
      const userIds = users.map((user) => user.id);
      criteria.userId = { $in: userIds };
    }

    if (filter.userId) {
      criteria.userId = new Types.ObjectId(filter.userId as string);
    }

    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;

    options.populates = [userPopulate, customerPopulate];
    console.log("criteria", criteria, options);
    const data = await listAndCount(criteria, Employee, options);

    res.status(StatusCodes.OK).send(data);
  }
);

export { router as employeeListRouter };
