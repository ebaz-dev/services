import express, { Request, Response } from "express";
import { validateRequest, CustomerCategory } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
const router = express.Router();

router.get(
  "/category/list",
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = { type: req.query.type };
    const data = await CustomerCategory.find(criteria);
    const categories = data
      .filter((category) => {
        return !category.parentId;
      })
      .map((category) => {
        const subCategories = data.filter((subCategory) => {
          return `${subCategory.parentId}` === `${category._id}`;
        });
        return {
          id: category.id,
          parentId: category.parentId,
          name: category.name,
          subCategories,
        };
      });
    res.status(StatusCodes.OK).send({ data: categories });
  }
);

export { router as categoryListRouter };
