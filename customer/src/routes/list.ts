import express, { Request, Response } from "express";
import {
  currentUser,
  listAndCount,
  QueryOptions,
  requireAuth,
  validateRequest,
  Customer,
  Employee,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { query } from "express-validator";
import mongoose, { Types } from "@ezdev/core/lib/mongoose";
const router = express.Router();

router.get(
  "/list",
  [
    query("ids")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage("IDs must be a comma-separated list of valid ObjectIds"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    console.log("customer/list", req.query);
    const criteria: any = {};
    if (req.query.name) {
      criteria.name = {
        $regex: req.query.name,
        $options: "i",
      };
    }
    if (req.query.regNo) {
      criteria.regNo = {
        $regex: req.query.regNo,
        $options: "i",
      };
    }
    if (req.query.phone) {
      criteria.phone = {
        $regex: req.query.phone,
        $options: "i",
      };
    }

    if (req.query.parentId) {
      criteria.parentId = new Types.ObjectId(req.query.parentId as string);
    }

    if (req.query.ids) {
      const idsArray = (req.query.ids as string)
        .split(",")
        .map((id) => new Types.ObjectId(id.trim()));
      criteria._id = { $in: idsArray };
    }

    if (req.query.userId) {
      const userCustomers = await Employee.find({
        userId: new Types.ObjectId(req.query.userId as string),
      });
      const ids = userCustomers.map((customer) => customer.customerId);
      criteria._id = { $in: ids };
    }

    if (req.query.type) {
      criteria.type = req.query.type;
    }
    if (req.query.holdingKey) {
      criteria.holdingKey = req.query.holdingKey;
    }
    if (req.query.vendorKey) {
      criteria.vendorKey = req.query.vendorKey;
    }
    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const data = await listAndCount(criteria, Customer, options);

    res.status(StatusCodes.OK).send(data);
  }
);

export { router as listRouter };
