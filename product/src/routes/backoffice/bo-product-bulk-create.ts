import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  ProductPrice,
  Product,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import mongoose, { Types } from "@ezdev/core/lib/mongoose";
import { natsWrapper } from "../../nats-wrapper";

const router = express.Router();

router.post(
  "/bulk",
  [
    body().isArray().withMessage("Request body must be an array"),
    body("*.name").isString().notEmpty().withMessage("Name is required"),
    body("*.barCode").isString().notEmpty().withMessage("Bar code is required"),
    body("*.sku").isString().optional(),
    body("*.supplierId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
    body("*.vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    body("*.categoryId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Category ID must be a valid ObjectId"),
    body("*.brandId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Brand ID must be a valid ObjectId"),
    body("*.description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("*.price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("*.cost")
      .isFloat({ min: 0 })
      .withMessage("Cost must be a non-negative number"),
    body("*.inCase")
      .isFloat({ min: 0 })
      .withMessage("In case must be a non-negative number"),
    body("*.splitSale").isBoolean().optional(),
    body("*.isActive").isBoolean().optional(),
    body("*.isAlcohol").isBoolean().optional(),
    body("*.cityTax").isBoolean().optional(),
    body("*.priority")
      .optional()
      .isNumeric()
      .withMessage("Priority must be a number"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const products = req.body;

    const existingProducts = await Product.find({
      $or: products.map((product: any) => ({
        barCode: product.barCode,
        customerId: new Types.ObjectId(product.customerId),
      })),
    });

    if (existingProducts.length > 0) {
      const existingProductNames = existingProducts.map(
        (product: any) => product.name
      );
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "Some products already exist",
        existingProducts: existingProductNames,
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bulkOps = products.map((product: any) => {
        const slug = slugify(product.name, { lower: true, strict: true });
        const { prices, ...productData } = product;
        return {
          insertOne: {
            document: {
              ...productData,
              slug,
            },
          },
        };
      });

      const result = await Product.bulkWrite(bulkOps, { session });

      const productPrices = products.map((product: any, index: number) => {
        return {
          productId: new mongoose.Types.ObjectId(result.insertedIds[index]),
          type: "default",
          level: 1,
          entityReferences: [],
          prices: product.prices,
        };
      });

      const insertedProductPrices = await ProductPrice.insertMany(
        productPrices,
        { session }
      );

      const updateOps = insertedProductPrices.map((productPrice: any) => {
        return {
          updateOne: {
            filter: { _id: productPrice.productId },
            update: { $push: { prices: productPrice._id } },
          },
        };
      });

      await Product.bulkWrite(updateOps, { session });

      await session.commitTransaction();

      res.status(StatusCodes.CREATED).send(result);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Bulk create operation failed", error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    } finally {
      session.endSession();
    }
  }
);

export { router as boProductBulkCreateRouter };
