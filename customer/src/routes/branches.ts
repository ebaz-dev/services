import express, { Request, Response } from "express";
import {
  currentUser,
  requireAuth,
  validateRequest,
  Customer,
  Employee,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import _ from "lodash";

const router = express.Router();

router.get(
  "/branches",
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const userCustomers = await Employee.find({
      userId: new Types.ObjectId(req.currentUser?.id as string),
    });
    const ids = userCustomers.map((customer) => customer.customerId);
    const criteria: any = {
      _id: { $in: ids },
      parentId: { $exists: false },
    };
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
      criteria.parentId = req.query.parentId;
    }

    if (req.query.type) {
      criteria.type = req.query.type;
    }
    console.log("cirteeriaaaa", criteria);
    const parents: any = await Customer.find(criteria).select([
      "-cityId",
      "-districtId",
      "-subDistrictId",
    ]);
    const promises = _.map(parents, async (parent) => {
      const branches = await Customer.find({ parentId: parent.id });
      return {
        id: parent.id,
        name: parent.businessName,
        regNo: parent.regNo,
        branches: branches.concat([
          {
            ...parent.toJSON(),
            cityId: "1",
            districtId: "1",
            subDistrictId: "1",
          },
        ]),
      };
    });
    const customers = await Promise.all(promises);

    res
      .status(StatusCodes.OK)
      .send({ data: customers, total: customers.length });
  }
);

export { router as branchesRouter };
