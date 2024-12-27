import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest, requireAuth, Promo } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose, { FilterQuery } from "mongoose";

const router = express.Router();

router.get(
  "/promos-list",
  [
    query("ids")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage("IDs must be a comma-separated list of valid ObjectIds"),
    query("name").optional().isString().withMessage("Name must be a string"),
    query("customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    query("promoTypeId")
      .optional()
      .isString()
      .withMessage("Promo type ID must be a string"),
    query("promoNo")
      .optional()
      .isString()
      .withMessage("Promo number must be a string"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        ids,
        name,
        customerId,
        promoTypeId,
        promoNo,
        page = 1,
        limit = 20,
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = limit === "all" ? 0 : parseInt(limit as string, 10);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const query: FilterQuery<typeof Promo> = {};
      if (ids) {
        const idsArray = (ids as string)
          .split(",")
          .map((id: string) => id.trim());
        query._id = { $in: idsArray };
      }

      if (name) {
        query.name = { $regex: new RegExp(name as string, "i") };
      }

      if (customerId) {
        query.customerId = customerId;
      }

      if (promoTypeId) {
        query.promoTypeId = parseInt(promoTypeId as string, 10);
      }

      if (promoNo) {
        query.promoNo = promoNo;
      }

      const total = await Promo.countDocuments(query);
      const promos = await Promo.find(query)
        .skip(skip)
        .limit(limitNumber)
        .select(
          `
          customerId
          name 
          promoNo 
          tresholdAmount 
          thresholdQuantity 
          promoPercent 
          giftQuantity 
          isActive 
          promoTypeId 
          promoTypeName 
          promoType 
          startDate 
          endDate 
          products 
          giftProducts 
          giftProductPackages
          thirdPartyData.thirdPartyPromoName
          thirdPartyData.thirdPartyPromoId
          thirdPartyData.thirdPartyPromoNo
          thirdPartyData.thirdPartyPromoTypeId
          thirdPartyData.thirdPartyPromoType
          thirdPartyData.thirdPartyPromoTypeCode
          `
        );

      res.status(StatusCodes.OK).send({
        data: promos,
        total: promos.length,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error) {
      console.error("Error fetching promos:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "An error occurred while fetching the promos.",
      });
    }
  }
);

export { router as promoListRouter };
