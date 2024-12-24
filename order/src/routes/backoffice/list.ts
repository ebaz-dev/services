import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  Order,
  QueryOptions,
  listAndCount,
  validateRequest,
} from "@ezdev/core";
import { Types } from "@ezdev/core/lib/mongoose";
import { mergeProducts } from "../../utils/merge-products";

const router = express.Router();

router.get("/", validateRequest, async (req: Request, res: Response) => {
  const options: any = <QueryOptions>req.query;
  if (!options.sortBy) {
    options.sortBy = "orderedAt";
  }
  if (!options.sortDir) {
    options.sortDir = -1;
  }
  const filter: any = req.query.filter || {};
  const criteria: any = {};

  if (filter.supplierId) {
    criteria.supplierId = new Types.ObjectId(filter.supplierId as string);
  }
  if (filter.merchantId) {
    criteria.merchantId = new Types.ObjectId(filter.merchantId as string);
  }
  if (filter.userId) {
    criteria.userId = new Types.ObjectId(filter.userId as string);
  }
  if (filter.status) {
    criteria.status = filter.status;
  }

  if (filter.orderNo) {
    criteria.orderNo = {
      $regex: filter.orderNo,
      $options: "i",
    };
  }
  if (filter.paymentMethod) {
    criteria.paymentMethod = filter.paymentMethod;
  }
  if (filter.startDate) {
    criteria.orderedAt = { $gte: new Date(filter.startDate) };
  }
  if (filter.endDate) {
    if (filter.startDate) {
      criteria.orderedAt = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate),
      };
    } else {
      criteria.orderedAt = { $lte: new Date(filter.endDate) };
    }
  }

  if (filter.deliveryStartDate) {
    criteria.deliveryDate = { $gte: new Date(filter.deliveryStartDate) };
  }
  if (filter.deliveryEndDate) {
    if (filter.deliveryStartDate) {
      criteria.deliveryDate = {
        $gte: new Date(filter.deliveryStartDate),
        $lte: new Date(filter.deliveryEndDate),
      };
    } else {
      criteria.deliveryDate = { $lte: new Date(filter.deliveryEndDate) };
    }
  }
  options.populates = [
    { path: "supplier", select: "name phone logo" },
    {
      path: "merchant",
      select:
        "name phone logo categoryId cityId districtId subDistrictId address",
      populate: [
        {
          path: "category",
        },
        {
          path: "city",
        },
        {
          path: "district",
        },
        {
          path: "subDistrict",
        },
      ],
    },
    { path: "user", select: "name phoneNumber email" },
    { path: "productDetails" },
    { path: "giftProductDetails" },
    {
      path: "logs",
      populate: [
        {
          path: "user",
        },
      ],
    },
  ];
  options.columns = {
    orderNo: 1,
    status: 1,
    supplierId: 1,
    merchantId: 1,
    userId: 1,
    products: 1,
    giftProducts: 1,
    orderedAt: 1,
    deliveryDate: 1,
    deliveredAt: 1,
    paymentMethod: 1,
    updatedAt: 1,
    createdAt: 1,
    logs: 1,
  };
  const result: any = await listAndCount(criteria, Order, options);

  result.data = result.data.map((order) => {
    const plainOrder = order.toJSON();
    plainOrder.products = mergeProducts(
      plainOrder.products || [],
      plainOrder.productDetails || []
    );
    plainOrder.giftProducts = mergeProducts(
      plainOrder.giftProducts || [],
      plainOrder.giftProductDetails || []
    );
    let totalPrice = 0;
    let totalBasePrice = 0;
    plainOrder.products.map((product) => {
      if (product) {
        totalPrice += product.totalPrice;
        totalBasePrice += product.totalBasePrice;
      }
    });
    plainOrder.totalPrice = totalPrice;
    plainOrder.totalBasePrice = totalBasePrice;
    plainOrder.totalDiscountAmount = totalBasePrice - totalPrice;
    plainOrder.discountPercent =
      (plainOrder.totalDiscountAmount / totalBasePrice) * 100;
    delete plainOrder.productDetails;
    delete plainOrder.giftProductDetails;
    return plainOrder;
  });

  res.status(StatusCodes.OK).send(result);
});

export { router as orderBoListRouter };
