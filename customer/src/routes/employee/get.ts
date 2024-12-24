import express, { Request, Response } from "express";
import {
  currentUser,
  requireAuth,
  validateRequest,
  Employee,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/employee/:id",
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const employee = await Employee.findById(req.params.id)
      .populate("user")
      .populate("customer");

    res.status(StatusCodes.OK).send({ data: employee });
  }
);

export { router as employeeGetRouter };
