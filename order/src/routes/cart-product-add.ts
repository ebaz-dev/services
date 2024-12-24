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
} from "@ezdev/core";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.post(
  "/cart/product/add",
  [
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
    body("productId")
      .notEmpty()
      .isString()
      .withMessage("Product ID is required"),
    body("quantity").notEmpty().isNumeric().withMessage("Quantity is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { supplierId, merchantId, quantity, productId } = req.body;
    const userId = req.currentUser?.id;

    const data = req.body;
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let cart = await Cart.findOne({
        supplierId,
        merchantId,
        userId,
        status: {
          $in: [CartStatus.Created, CartStatus.Pending, CartStatus.Returned],
        },
      }).session(session);

      if (!cart) {
        cart = new Cart({
          status: CartStatus.Created,
          supplierId,
          merchantId,
          userId: userId,
          products: [<CartProductDoc>{ id: data.productId, quantity: 0 }],
        });
      }

      if (cart && cart.status === CartStatus.Pending) {
        throw new BadRequestError("Card is waiting for inventory response");
      }

      const productIndex = cart.products.findIndex(
        (product: any) => product.id.toString() === productId
      );

      if (productIndex !== -1) {
        // Update quantity if the product exists
        cart.products[productIndex].quantity += quantity;

        // Remove product if quantity is zero or less
        if (cart.products[productIndex].quantity <= 0) {
          cart.products.splice(productIndex, 1);
        }
      }

      if (productIndex === -1) {
        cart.products.push(<CartProductDoc>{
          id: data.productId,
          quantity: data.quantity,
        });
      }
      cart.status = CartStatus.Created;
      await cart.save({ session });

      // await new CartProductAddedPublisher(natsWrapper.client).publish({
      //   id: cart.id,
      //   productId: data.productId,
      //   quantity: data.quantity,
      //   updatedAt: new Date(),
      // });

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

export { router as cartProductAddRouter };
