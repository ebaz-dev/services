import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Product,
  ProductCategory,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import slugify from "slugify";
import { ProductUpdatedPublisher } from "../events/publisher/product-updated-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

const getParentCategoryIds = async (
  categoryId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> => {
  const category = await ProductCategory.findById(categoryId);
  if (!category || !category.parentId) {
    return [categoryId];
  }
  const parentIds = await getParentCategoryIds(category.parentId);
  return [categoryId, ...parentIds];
};

router.put(
  "/update/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("slug").optional().isString().withMessage("Slug must be a string"),
    body("barCode")
      .optional()
      .isString()
      .withMessage("Bar code must be a string"),
    body("customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    body("categoryId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Category ID must be a valid ObjectId"),
    body("brandId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Brand ID must be a valid ObjectId"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("image").optional().isArray().withMessage("Image must be an array"),
    body("attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array"),
    body("thirdPartyData")
      .optional()
      .isArray()
      .withMessage("Third party data must be an array")
      .custom((value) => value.every((item: any) => typeof item === "object"))
      .withMessage("Each item in third party data must be an object"),
    body("addFavourite")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Merchant ID must be a valid ObjectId"),
    body("deleteFavourite")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Merchant ID must be a valid ObjectId to remove"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, categoryId, addFavourite, deleteFavourite, ...otherFields } =
      req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findById(id).session(session);

      if (!product) {
        throw new BadRequestError("Product not found");
      }

      if (name) {
        product.name = name;
        product.slug = slugify(name, { lower: true, strict: true });
      }

      if (categoryId) {
        const categoryIds = await getParentCategoryIds(
          new mongoose.Types.ObjectId(categoryId)
        );
        product.categoryIds = categoryIds;
      }

      if (addFavourite) {
        if (!product.favourite) {
          product.favourite = [];
        }

        const isFavouritePresent = product.favourite.some((fav: any) =>
          fav.equals(addFavourite)
        );

        if (!isFavouritePresent) {
          product.favourite.push(new mongoose.Types.ObjectId(addFavourite));
        }
      }

      if (deleteFavourite) {
        if (product.favourite) {
          product.favourite = product.favourite.filter(
            (fav: any) => !fav.equals(deleteFavourite)
          );
        }
      }

      Object.assign(product, otherFields);

      await product.save({ session });

      await new ProductUpdatedPublisher(natsWrapper.client).publish({
        id: product.id,
        name: product.name,
        slug: product.slug,
        barCode: product.barCode,
        customerId: product.customerId,
        vendorId: product?.vendorId,
        categoryIds: product?.categoryIds,
        brandId: product?.brandId,
        description: product?.description,
        images: product?.images,
        attributes: product?.attributes,
        inCase: product.inCase,
      });

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(product);
    } catch (error: any) {
      await session.abortTransaction();

      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      throw new BadRequestError("Error updating product");
    } finally {
      session.endSession();
    }
  }
);

export { router as productUpdateRouter };
