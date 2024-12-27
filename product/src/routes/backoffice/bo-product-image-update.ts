import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Product } from "@ezdev/core";

const router = express.Router();

router.put("/image/update", async (req: Request, res: Response) => {
  try {
    const products = await Product.find();

    const updatePromises = products.map(async (product) => {
      if (product.images) {
        const updatedImageUrls = product.images.map((url: string) => {
          if (url.startsWith("https://pics.ebazaar.link")) {
            return url.replace(
              "https://pics.ebazaar.link",
              "https://m.ebazaar.mn"
            );
          }
          return url;
        });

        if (
          JSON.stringify(updatedImageUrls) !== JSON.stringify(product.images)
        ) {
          product.images = updatedImageUrls;

          return product.save();
        }
      }
    });

    await Promise.all(updatePromises);

    res.status(StatusCodes.OK).send({
      message: "Products processed successfully.",
      totalProducts: products.length,
    });
  } catch (error) {
    console.error("Error updating product images:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong.",
    });
  }
});

export { router as productsImageUpdateRouter };
