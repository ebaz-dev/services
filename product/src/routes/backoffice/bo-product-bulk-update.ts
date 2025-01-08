import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Product,
  ProductDoc,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import slugify from "slugify";

const router = express.Router();

router.put(
  "/bulk",
  [
    body().isArray().withMessage("Request body must be an array"),
    body("*.id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product ID"),
    body("*.name").optional().isString().withMessage("Name must be a string"),
    body("*.barCode")
      .optional()
      .isString()
      .withMessage("Bar code must be a string"),
    body("*.sku").optional().isString().withMessage("SKU must be a string"),
    body("*.supplierId")
      .optional()
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
      .optional()
      .isNumeric()
      .withMessage("Price must be a number"),
    body("*.cost").optional().isNumeric().withMessage("Cost must be a number"),
    body("*.inCase")
      .optional()
      .isNumeric()
      .withMessage("Incase must be a number"),
    body("*.splitSale")
      .optional()
      .isBoolean()
      .withMessage("Split sale must be a boolean"),
    body("*.isActive")
      .optional()
      .isBoolean()
      .withMessage("Is active must be a boolean"),
    body("*.isAlcohol")
      .optional()
      .isBoolean()
      .withMessage("Is alcohol must be a boolean"),
    body("*.cityTax")
      .optional()
      .isBoolean()
      .withMessage("City tax must be a boolean"),
    body("*.priority")
      .optional()
      .isNumeric()
      .withMessage("Priority must be a number"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const products = req.body;

    const productIds = products.map((update: any) => update.id);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingProducts = (await Product.find({
        _id: { $in: productIds },
      }).session(session)) as ProductDoc[];

      const existingProductIds = existingProducts.map((product) =>
        product.id.toString()
      );

      const missingProductIds = productIds.filter(
        (id: string) => !existingProductIds.includes(id)
      );

      if (missingProductIds.length > 0) {
        await session.abortTransaction();

        return res.status(StatusCodes.BAD_REQUEST).send({
          message: "Some products not found",
          missingProductIds,
        });
      }

      const bulkOps = products.map((update: any) => {
        const { id, name, supplierId, ...updateFields } = update;

        if (name) {
          updateFields.name = name;
          updateFields.slug = slugify(name, { lower: true, strict: true });
        }

        if (supplierId) {
          updateFields.customerId = new mongoose.Types.ObjectId(supplierId);
        }

        return {
          updateOne: {
            filter: { _id: id },
            update: { $set: updateFields },
          },
        };
      });

      const result = await Product.bulkWrite(bulkOps, { session });

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(result);
    } catch (error: any) {
      await session.abortTransaction();

      console.error("Bulk update operation failed", error);

      if ((error as Error).name === "ValidationError") {
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

export { router as boProductBulkUpdateRouter };
