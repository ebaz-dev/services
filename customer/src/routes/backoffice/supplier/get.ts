import express, { Request, Response } from "express";
import { validateRequest, Supplier, requireAuth } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/supplier/:id",
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const supplier = await Supplier.findById(req.params.id as string)
      .populate({ path: "category" })
      .populate({ path: "city" })
      .populate({ path: "district" })
      .populate({ path: "subDistrict" });

    res.status(StatusCodes.OK).send({ data: supplier });
  }
);

export { router as boSupplierGetRouter };
