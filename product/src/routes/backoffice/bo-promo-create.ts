import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Promo,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/promo",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("supplierId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
    body("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    body("startDate")
      .isISO8601()
      .toDate()
      .withMessage("Start date is required"),
    body("endDate").isISO8601().toDate().withMessage("End date is required"),
    body("tresholdAmount")
      .isFloat({ min: 0 })
      .withMessage("Threshold amount must be a non-negative number"),
    body("thresholdQuantity")
      .isInt({ min: 0 })
      .withMessage("Threshold quantity must be a non-negative integer"),
    body("promoPercent")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Promo percent must be a non-negative number"),
    body("giftQuantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Gift quantity must be a non-negative integer"),
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
    body("promoTypeId")
      .isInt()
      .notEmpty()
      .withMessage("Promo type ID must be an integer"),
    body("promoTypeName")
      .isString()
      .notEmpty()
      .withMessage("Promo type name is required"),
    body("promoType")
      .isString()
      .notEmpty()
      .withMessage("Promo type is required"),
    body("products")
      .isArray()
      .withMessage("Products must be an array of ObjectIds")
      .custom((value) =>
        value.every((id: any) => mongoose.Types.ObjectId.isValid(id))
      )
      .withMessage("Each product ID must be a valid ObjectId"),
    body("giftProducts")
      .isArray()
      .withMessage("Gift products must be an array of ObjectIds")
      .custom((value) =>
        value.every((id: any) => mongoose.Types.ObjectId.isValid(id))
      )
      .withMessage("Each gift product ID must be a valid ObjectId"),
    body("giftProductPackages")
      .isArray()
      .withMessage("Gift product packages must be an array of objects"),
    body("tradeshops")
      .isArray()
      .withMessage("Tradeshops must be an array of numbers")
      .custom((value) => value.every((num: any) => typeof num === "number"))
      .withMessage("Each tradeshop must be a number"),
    body("thirdPartyData")
      .optional()
      .isObject()
      .withMessage("Third party data must be an object"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      name,
      supplierId,
      vendorId,
      startDate,
      endDate,
      promoNo,
      tresholdAmount,
      thresholdQuantity,
      promoPercent,
      giftQuantity,
      isActive,
      promoTypeId,
      promoTypeName,
      promoType,
      products,
      giftProducts,
      giftProductPackages,
      tradeshops,
      thirdPartyData,
    } = req.body;

    const existingPromo = await Promo.findOne({ name });

    if (existingPromo) {
      throw new BadRequestError("Promo already exists");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const promo = new Promo({
        name,
        slug,
        customerId: supplierId,
        vendorId,
        startDate,
        endDate,
        promoNo,
        tresholdAmount,
        thresholdQuantity,
        promoPercent,
        giftQuantity,
        isActive,
        promoTypeId,
        promoTypeName,
        promoType,
        products,
        giftProducts,
        giftProductPackages,
        tradeshops,
        thirdPartyData,
      });

      await promo.save({ session });

      await session.commitTransaction();

      res.status(StatusCodes.CREATED).send(promo);
    } catch (error: any) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction", abortError);
      }

      console.error("Error creating promo:", error);

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

export { router as promoCreateRouter };
