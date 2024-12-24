import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Order, validateRequest } from "@ezdev/core";
import { mergeProducts } from "../../utils/merge-products";

const router = express.Router();

router.get("/:id", validateRequest, async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate({ path: "supplier", select: "name phone logo" })
    .populate({
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
    })
    .populate({ path: "user", select: "name phoneNumber email" })
    .populate({ path: "productDetails" })
    .populate({ path: "giftProductDetails" })
    .populate({ path: "logs" })
    .select({
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
    });

  if (!order) {
    throw new Error("order not found");
  }
  const plainOrder: any = order.toJSON();
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

  res.status(StatusCodes.OK).send({ data: plainOrder });
});
export { router as orderBoGetRouter };
