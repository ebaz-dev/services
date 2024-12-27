import express, { Request, Response } from "express";
import { param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  requireAuth,
  Promo,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/promo/:id",
  [param("id").isMongoId().withMessage("Invalid product ID")],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const promo = await Promo.findById(id).select(
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
        thirdPartyData
        `
      );

      if (!promo) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(promo);
    } catch (error) {
      console.error("Error fetching promo:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "An error occurred while fetching the promo.",
      });
    }
  }
);

export { router as promoGetRouter };
