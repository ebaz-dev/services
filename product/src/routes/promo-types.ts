import express, { Request, Response } from "express";
import { validateRequest, requireAuth, PromoType } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/promo-types",
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const promoTypes = await PromoType.find().sort({ typeId: 1 });

      res.status(StatusCodes.OK).send({
        data: promoTypes,
        total: promoTypes.length,
        totalPages: 1,
        currentPage: 1,
      });
    } catch (error) {
      console.error("Error fetching promo:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "An error occurred while fetching the promo types.",
      });
    }
  }
);

export { router as promoTypesRouter };
