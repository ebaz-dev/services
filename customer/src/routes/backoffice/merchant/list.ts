import express, { Request, Response } from "express";
import {
  listAndCount,
  QueryOptions,
  validateRequest,
  Employee,
  HoldingSupplierCodes,
  Merchant,
  Supplier,
  requireAuth,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "@ezdev/core/lib/mongoose";
const router = express.Router();

router.get(
  "/merchant",
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const filter: any = req.query.filter || {};
    const criteria: any = { inactive: false };
    if (filter.name) {
      criteria.name = {
        $regex: filter.name,
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
    if (filter.customerNo) {
      criteria.customerNo = {
        $regex: filter.customerNo,
        $options: "i",
      };
    }

    if (filter.parentId) {
      criteria.parentId = new Types.ObjectId(filter.parentId as string);
    }

    if (filter.userId) {
      const userCustomers = await Employee.find({
        userId: new Types.ObjectId(filter.userId as string),
      });
      const ids = userCustomers.map((customer) => customer.customerId);
      criteria._id = { $in: ids };
    }

    if (filter.supplierId) {
      const supplier = await Supplier.findById(filter.supplierId);
      if (supplier?.holdingKey === HoldingSupplierCodes.TotalDistribution) {
        criteria["tradeShops.holdingKey"] =
          HoldingSupplierCodes.TotalDistribution;
      } else if (
        supplier?.holdingKey === HoldingSupplierCodes.AnunGoo ||
        supplier?.holdingKey === HoldingSupplierCodes.MarketGate
      ) {
        criteria["tradeShops.holdingKey"] = {
          $ne: HoldingSupplierCodes.TotalDistribution,
          $in: [HoldingSupplierCodes.AnunGoo, HoldingSupplierCodes.MarketGate],
        };
      } else if (supplier?.holdingKey === HoldingSupplierCodes.CocaCola) {
        criteria["tradeShops.holdingKey"] = {
          $ne: HoldingSupplierCodes.TotalDistribution,
          $in: [HoldingSupplierCodes.CocaCola],
        };
      } else {
        criteria["tradeShops.holdingKey"] = supplier?.holdingKey;
      }
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
    const data = await listAndCount(criteria, Merchant, options);

    res.status(StatusCodes.OK).send(data);
  }
);

export { router as boMerchantListRouter };
