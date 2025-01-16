import express, { Request, Response } from "express";
import { query } from "express-validator";
import {
  validateRequest,
  requireAuth,
  Product,
  ProductDoc,
  Merchant,
  Supplier,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose, { FilterQuery } from "@ezdev/core/lib/mongoose";

const router = express.Router();
const validOrderByFields = [
  "priority",
  "favourite",
  "discount",
  "promotion",
  "sizeIncreased",
  "sizeDecreased",
  "ascending",
  "descending",
];

const totalCustomerId = "66f12d655e36613db5743430";
const colaCustomerId = "66ebe3e3c0acbbab7824b195";

router.get(
  "/list",
  [
    query("merchantId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Merchant ID must be a valid ObjectId"),
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
    query("barCode")
      .optional()
      .isString()
      .withMessage("Bar code must be a string"),
    query("sku").optional().isString().withMessage("SKU must be a string"),
    query("customerId")
      .optional()
      .custom((value) => value === "" || mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId or an empty string"),
    query("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    query("categories")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage(
        "Category IDs must be a comma-separated list of valid ObjectIds"
      ),
    query("brands")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage(
        "Brand IDs must be a comma-separated list of valid ObjectIds"
      ),
    query("attributeValues")
      .optional()
      .custom((value) => {
        const valuesArray = value.split(",").map((val: string) => val.trim());
        return valuesArray.every(
          (val: string) => !isNaN(Number(val)) || typeof val === "string"
        );
      })
      .withMessage(
        "Attribute values must be a comma-separated list of strings or numbers"
      ),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .custom((value) => value === "all" || parseInt(value, 10) > 0)
      .withMessage("Limit must be a positive integer or 'all'"),
    query("orderBy")
      .optional()
      .isString()
      .custom((value) => validOrderByFields.includes(value.split(":")[0]))
      .withMessage(
        "Order by must be one of the following: priority,favourite ,discount ,promotion ,sizeIncreased, sizeDecreased, priceIncreased, priceDecreased"
      ),
    query("inCase")
      .optional()
      .isInt({ min: 1 })
      .withMessage("In case must be a positive integer"),
    query("discount")
      .optional()
      .isBoolean()
      .withMessage("Discount must be a boolean"),
    query("promotion")
      .optional()
      .isBoolean()
      .withMessage("Promotion must be a boolean"),
    query("favourite")
      .optional()
      .isBoolean()
      .withMessage("Favourite must be a boolean"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        merchantId,
        ids,
        name,
        barCode,
        sku,
        customerId,
        categories,
        vendorId,
        brands,
        attributeValues,
        inCase,
        page = 1,
        limit = 20,
        orderBy,
        discount,
        promotion,
        favourite,
      } = req.query;

      const query: FilterQuery<ProductDoc> = {
        isActive: true,
        isDeleted: false,
      };
      console.log("starting product list");
      if (name) query.name = { $regex: name, $options: "i" };
      if (barCode) query.barCode = { $regex: barCode, $options: "i" };
      if (sku) query.sku = { $regex: sku, $options: "i" };
      if (
        customerId &&
        typeof customerId === "string" &&
        customerId.length > 0
      ) {
        query.customerId = customerId;
      }
      if (vendorId) query.vendorId = vendorId;
      if (inCase) query.inCase = inCase;

      if (ids) {
        const idsArray = (ids as string).split(",").map((id) => id.trim());
        query._id = { $in: idsArray };
      }

      if (name) {
        query.$or = [
          { name: { $regex: name, $options: "i" } },
          { slug: { $regex: name, $options: "i" } },
        ];
      }

      if (attributeValues) {
        const attributeValuesArray = (attributeValues as string)
          .split(",")
          .map((val) => val.trim());
        query.attributes = {
          $elemMatch: {
            value: {
              $in: attributeValuesArray.map((val) =>
                isNaN(Number(val)) ? val : Number(val)
              ),
            },
          },
        };
      }

      if (categories) {
        const categoryIdsArray = (categories as string)
          .split(",")
          .map((id) => id.trim());
        query.categoryIds = { $in: categoryIdsArray };
      }

      if (brands) {
        const brandIdsArray = (brands as string)
          .split(",")
          .map((id) => id.trim());
        query.brandId = { $in: brandIdsArray };
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = limit === "all" ? 0 : parseInt(limit as string, 10);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const sort: { [key: string]: 1 | -1 } = {};

      if (orderBy) {
        const [key, order] = (orderBy as string).split(":");
        if (validOrderByFields.includes(key)) {
          if (key === "sizeIncreased" || key === "sizeDecreased") {
            const sizeOrder = key === "sizeIncreased" ? 1 : -1;
            sort[`attribute.size`] = sizeOrder;
          } else if (key === "ascending" || key === "descending") {
            const priceOrder = key === "ascending" ? 1 : -1;
            sort[`price`] = priceOrder;
          } else {
            sort[key] = order === "desc" ? -1 : 1;
          }
        }
      } else {
        sort.priority = 1;
      }

      const merchant = await Merchant.findById(merchantId as string);
      if (!merchant) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: "Merchant not found.",
        });
      }

      const supplier = await Supplier.findById(customerId as string);
      if (!supplier) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: "Supplier not found.",
        });
      }

      const holdingKey = supplier?.holdingKey;
      const tsId = merchant?.tradeShops?.find(
        (shop) => shop.holdingKey === holdingKey
      )?.tsId;

      if (promotion) {
        query.promotion = true;
      }

      if (discount) {
        query.discount = true;
      }

      if (favourite && merchantId) {
        query.favourite = {
          $in: [new mongoose.Types.ObjectId(merchantId as string)],
        };
      }

      const businessTypeId = new mongoose.Types.ObjectId();

      const { products, count: total } = await Product.findWithAdjustedPrice({
        query,
        merchant: {
          merchantId: new mongoose.Types.ObjectId(merchantId as string),
          businessTypeId: businessTypeId,
        },
        skip,
        limit: limitNumber,
        sort,
      });

      res.status(StatusCodes.OK).send({
        data: products,
        total: total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as productListRouter };
