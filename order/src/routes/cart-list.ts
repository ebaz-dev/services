import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  currentUser,
  QueryOptions,
  requireAuth,
  validateRequest,
  listAndCount,
  Cart,
  CartDoc,
  CartStatus,
} from "@ezdev/core";
import { query } from "express-validator";
import _ from "lodash";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.get(
  "/cart/list",
  [
    query("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = {
      products: { $exists: true, $ne: [] },
      merchantId: req.query.merchantId,
      userId: req.currentUser?.id,
      status: { $in: [CartStatus.Created, CartStatus.Returned] },
    };
    if (req.query.supplierId) {
      criteria.supplierId = req.query.supplierId;
    }
    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = await listAndCount(criteria, Cart, options);

    const promises = _.map(result.data, async (cart) => {
      return migrateProducts(<CartDoc>cart);
    });
    const data = await Promise.all(promises);

    res
      .status(StatusCodes.OK)
      .send({
        data,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      });
  }
);

export { router as cartListRouter };
