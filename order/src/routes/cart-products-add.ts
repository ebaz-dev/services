import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "@ezdev/core/lib/mongoose";
import { natsWrapper } from "../nats-wrapper";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Cart,
  CartDoc,
  CartStatus,
} from "@ezdev/core";
import { CartProductAddedPublisher } from "../events/publisher/cart-product-added-publisher";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.post(
  "/cart/products/add",
  [
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
    body("products").notEmpty().isArray().withMessage("Products are required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const data = req.body;

    try {
      let cart = await Cart.findOne({
        supplierId: data.supplierId,
        merchantId: data.merchantId,
        userId: req.currentUser?.id,
        status: {
          $in: [CartStatus.Created, CartStatus.Pending, CartStatus.Returned],
        },
      }).session(session);
      if (cart) {
        if (cart.status === CartStatus.Pending) {
          throw new Error("Processing cart to order!");
        }
        cart.products = data.products;
        await cart.save();
      } else {
        cart = await Cart.create(<CartDoc>{
          status: CartStatus.Created,
          supplierId: data.supplierId,
          merchantId: data.merchantId,
          userId: new Types.ObjectId(req.currentUser?.id),
          products: data.products,
        });
      }

      await new CartProductAddedPublisher(natsWrapper.client).publish({
        id: cart.id,
        products: data.products,
        updatedAt: new Date(),
      });
      cart = await migrateProducts(cart);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: cart });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Product add operation failed", error);
      throw new BadRequestError("product add operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as cartProductsAddRouter };
