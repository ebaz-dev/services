import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Product,
  ProductPrice,
  ProductCategory,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import mongoose from "mongoose";
import { ProductCreatedPublisher } from "../../events/publisher/product-created-publisher";
import { natsWrapper } from "../../nats-wrapper";

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

router.post(
  "/",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("barCode").isString().notEmpty().withMessage("Bar code is required"),
    body("sku").isString().optional().withMessage("SKU must be a string"),
    body("supplierId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .notEmpty()
      .withMessage("Supplier ID must be a valid ObjectId"),
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
    body("images")
      .optional()
      .isArray()
      .withMessage("Image must be an array of strings")
      .custom((value) => value.every((img: any) => typeof img === "string"))
      .withMessage("Each images must be a string"),
    body("attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array of objects")
      .custom((value) =>
        value.every(
          (attr: any) =>
            typeof attr === "object" &&
            mongoose.Types.ObjectId.isValid(attr.id) &&
            typeof attr.name === "string" &&
            typeof attr.slug === "string" &&
            typeof attr.key === "string" &&
            (typeof attr.value === "number" || typeof attr.value === "string")
        )
      )
      .withMessage(
        "Each attribute must be an object with valid id, name, slug, key, and value"
      ),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("cost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Cost must be a non-negative number"),
    body("inCase")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("In case must be a non-negative number"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("isAlcohol")
      .optional()
      .isBoolean()
      .withMessage("isAlcohol must be a boolean"),
    body("cityTax")
      .optional()
      .isBoolean()
      .withMessage("cityTax must be a boolean"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      name,
      barCode = "",
      supplierId,
      vendorId,
      categoryId,
      brandId,
      description = "",
      images,
      attributes = [],
      price = 0,
      cost = 0,
      inCase = 1,
      isActive = false,
      isAlcohol = false,
      cityTax = false,
      sku,
    } = req.body;

    const existingProduct = await Product.findOne({ barCode });

    if (existingProduct) {
      throw new BadRequestError("Product already exists");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const highestPriorityProduct = await Product.findOne({
        customerId: supplierId,
      })
        .sort({ priority: -1 })
        .exec();

      const newPriority = highestPriorityProduct
        ? highestPriorityProduct.priority + 1
        : 0;

      const product = new Product({
        name,
        slug,
        barCode,
        customerId: supplierId,
        vendorId,
        categoryIds: [],
        brandId,
        description,
        images,
        attributes,
        inCase,
        isActive,
        isAlcohol,
        cityTax,
        sku,
        priority: newPriority,
      });

      let categoryIds: mongoose.Types.ObjectId[] = [];
      if (categoryId) {
        categoryIds = await getParentCategoryIds(
          new mongoose.Types.ObjectId(categoryId)
        );
        product.categoryIds = categoryIds;
      }

      await product.save({ session });

      const productPrice = new ProductPrice({
        productId: product._id,
        type: "default",
        level: 1,
        entityReferences: [],
        prices: {
          price,
          cost,
        },
      });

      await productPrice.save({ session });
      product.prices.push(productPrice._id as mongoose.Types.ObjectId);
      await product.save({ session });

      await new ProductCreatedPublisher(natsWrapper.client).publish({
        id: product.id,
        name: product.name,
        slug: product.slug,
        barCode: product.barCode,
        customerId: product.customerId.toString(),
        vendorId: product?.vendorId?.toString(),
        categoryIds: product?.categoryIds?.map((id: mongoose.Types.ObjectId) =>
          id.toString()
        ),
        brandId: product?.brandId?.toString(),
        description: product.description || "",
        images: product.images || [],
        attributes: product.attributes,
        prices: product.prices.map((price) => price.toString()),
        inCase: product.inCase,
        isActive: product.isActive,
        isAlcohol: product.isAlcohol ?? false,
        cityTax: product.cityTax ?? false,
      });

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(product);
    } catch (error: any) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction", abortError);
      }

      console.error(error);

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

export { router as boProductCreateRouter };
