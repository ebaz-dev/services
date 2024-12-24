import express, { Request, Response } from "express";
import {
  currentUser,
  requireAuth,
  validateRequest,
  Customer,
} from "@ezdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/get",
  [query("id").notEmpty().isString().withMessage("ID is required")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const customer = await Customer.findById(req.query.id as string);

    res.status(StatusCodes.OK).send({ data: customer });
  }
);

export { router as getRouter };
