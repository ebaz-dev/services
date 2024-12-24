import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import {
  currentUser,
  requireAuth,
  validateRequest,
  OrderTemplate,
} from "@ezdev/core";

const router = express.Router();

router.post(
  "/template/delete",
  [body("id").notEmpty().isString().withMessage("Template ID is required")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    await OrderTemplate.deleteOne({ _id: req.body.id });
    res.status(StatusCodes.OK).send();
  }
);

export { router as templateDeleteRouter };
