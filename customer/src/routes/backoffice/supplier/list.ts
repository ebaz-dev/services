import express, { Request, Response } from "express";
import {
  listAndCount,
  QueryOptions,
  validateRequest,
  Employee,
  Supplier,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "@ezdev/core/lib/mongoose";
const router = express.Router();

router.get(
  "/supplier",
  validateRequest,
  async (req: Request, res: Response) => {
    const filter: any = req.query.filter || {};
    const criteria: any = {
      parentId: { $exists: false },
    };
    if (filter.name) {
      criteria.name = {
        $regex: filter.name,
        $options: "i",
      };
    }
    if (filter.customerNo) {
      criteria.customerNo = {
        $regex: filter.customerNo,
        $options: "i",
      };
    }
    if (filter.regNo) {
      criteria.regNo = {
        $regex: filter.regNo,
        $options: "i",
      };
    }
    if (filter.phone) {
      criteria.phone = {
        $regex: filter.phone,
        $options: "i",
      };
    }

    if (filter.parentId) {
      criteria.parentId = new Types.ObjectId(filter.parentId as string);
    }

    if (filter.userId) {
      const userCustomers = await Employee.find({
        userId: new Types.ObjectId(req.query.userId as string),
      });
      const ids = userCustomers.map((customer) => customer.customerId);
      criteria._id = { $in: ids };
    }

    if (filter.type) {
      criteria.type = filter.type;
    }

    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    options.populates = [
      { path: "category" },
      { path: "city" },
      { path: "district" },
      { path: "subDistrict" },
    ];
    const result = await listAndCount(criteria, Supplier, options);
    const parentIds = result.data.map((supplier) => supplier.id);
    const branches = await Supplier.find({ parentId: { $in: parentIds } });
    result.data = result.data.map((item) => {
      const supplier: any = item.toJSON();
      const filteredBranches = branches.filter(
        (branch) => branch.parentId?.toString() === supplier.id.toString()
      );
      supplier.branches = filteredBranches;
      return supplier;
    });

    res.status(StatusCodes.OK).send(result);
  }
);

export { router as boSupplierListRouter };
