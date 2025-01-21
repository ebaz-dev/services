import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Cart,
  CartProductDoc,
  CartStatus,
  Order,
} from "@ezdev/core";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.post(
  "/cart/reorder",
  [body("orderId").notEmpty().isString().withMessage("Order ID is required")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { orderId } = req.body;
    const userId = req.currentUser?.id;
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const order = await Order.findById(orderId);

      if (!order) {
        throw new BadRequestError("Ref Order not found!");
      }

      const products = order.products.map((product) => {
        return <CartProductDoc>{ id: product.id, quantity: product.quantity };
      });

      let cart = await Cart.findOne({
        supplierId: order.supplierId,
        merchantId: order.merchantId,
        userId,
        status: {
          $in: [CartStatus.Created, CartStatus.Pending, CartStatus.Returned],
        },
      }).session(session);

      if (!cart) {
        cart = new Cart({
          status: CartStatus.Created,
          supplierId: order.supplierId,
          merchantId: order.merchantId,
          userId: userId,
        });
      }

      if (cart && cart.status === CartStatus.Pending) {
        throw new BadRequestError("Card is waiting for inventory response");
      }

      cart.status = CartStatus.Created;
      cart.products = products;
      cart.refOrderId = order.id;
      await cart.save({ session });

      cart = await migrateProducts(cart);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: cart });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Reorder operation failed", error);
      throw new BadRequestError("reorder operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as cartReorderRouter };
