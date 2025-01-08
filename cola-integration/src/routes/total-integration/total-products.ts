import express, { Request, Response } from "express";
import {
  Product,
  Vendor,
  Supplier,
  BadRequestError,
  TotalAPIClient,
  BasProductData,
  ThirdPartyData,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../../nats-wrapper";
import { Types } from "mongoose";
import { BasProductRecievedEventPublisher } from "../../events/publisher/bas-product-recieved-publisher";
import { BasProductUpdatedEventPublisher } from "../../events/publisher/bas-product-updated-publisher";
import {
  convertCapacity,
  barcodeSanitizer,
  eventDelay,
} from "../../utils/bas-product-functions";

const router = express.Router();

router.get("/total/product-list", async (req: Request, res: Response) => {
  try {
    const vendorName = req.body.vendorName;
    const businessType = req.body.businessType;

    const totalSupplier = await Supplier.findOne({
      type: "supplier",
      holdingKey: "TD",
    });

    if (!totalSupplier) {
      throw new BadRequestError("Total supplier not found.");
    }

    const totalSupplierId = totalSupplier?._id as Types.ObjectId;

    const vendor = await Vendor.findOne({
      supplierId: totalSupplierId,
      apiCompany: vendorName,
      businessType: businessType,
    });

    if (!vendor) {
      throw new BadRequestError("Vendor not found.");
    }

    const vendorId = vendor?._id as Types.ObjectId;

    const productsResponse = await TotalAPIClient.getClient().post(
      "/api/ebazaar/getdataproductinfo",
      { company: vendorName }
    );

    let basProducts: BasProductData[] = productsResponse?.data?.data || [];
    if (basProducts.length === 0) {
      throw new BadRequestError("No products from bas API.");
    }

    if (businessType) {
      basProducts = basProducts.filter(
        (item: BasProductData) => item.business === businessType
      );
    }

    const existingEbProducts = await Product.find({
      customerId: totalSupplierId,
      vendorId: vendorId,
    });

    const existingEbProductsMap = existingEbProducts.reduce((map, item) => {
      if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
        const thirdPartyDataArray = item.thirdPartyData as any[];

        const colaIntegrationData = thirdPartyDataArray.find(
          (data: ThirdPartyData) =>
            data?.customerId.toString() === totalSupplierId.toString()
        );

        if (colaIntegrationData) {
          map[colaIntegrationData.productId] = item;
        }
      }
      return map;
    }, {} as { [key: string]: any });

    const basNewProducts: BasProductData[] = [];
    const basExistingProducts: BasProductData[] = [];

    basProducts.forEach((item: BasProductData) => {
      if (!existingEbProductsMap[item.productid.toString()]) {
        basNewProducts.push(item);
      } else {
        basExistingProducts.push(item);
      }
    });

    if (basNewProducts.length > 0) {
      for (const item of basNewProducts) {
        const capacity = await convertCapacity(item.capacity);
        const sanitizedBarcode = await barcodeSanitizer(item.barcode);

        const eventPayload: any = {
          supplierId: totalSupplierId,
          basId: item.productid,
          productName: item.productname,
          brandName: item.brandname,
          incase: item.incase,
          sectorName: item.sectorname,
          business: item.business,
          barcode: sanitizedBarcode,
          vendorId: vendorId,
          splitSale: true,
        };

        if (capacity !== 0) {
          eventPayload.capacity = capacity;
        }

        await eventDelay(500);

        await new BasProductRecievedEventPublisher(natsWrapper.client).publish(
          eventPayload
        );
      }
    }

    for (const product of basExistingProducts) {
      const item = existingEbProductsMap[product.productid];

      if (item) {
        const updatedFields: any = {};

        const capacity = await convertCapacity(product.capacity);

        const existingCapacity = item.attributes?.find(
          (attr: any) => attr.key === "size"
        )?.value;

        const sanitizedBarcode = await barcodeSanitizer(product.barcode);

        if (item.name !== product.productname) {
          updatedFields.productName = product.productname;
        }

        if (!item.brandId) {
          updatedFields.brandName = product.brandname;
        }

        if (existingCapacity !== capacity && capacity !== 0) {
          updatedFields.capacity = capacity;
        }

        if (item.inCase !== product.incase) {
          updatedFields.incase = product.incase;
        }

        if (item.barCode !== sanitizedBarcode && sanitizedBarcode !== "") {
          updatedFields.barcode = sanitizedBarcode;
        }

        if (Object.keys(updatedFields).length > 0) {
          await eventDelay(500);

          await new BasProductUpdatedEventPublisher(natsWrapper.client).publish(
            {
              supplierId: totalSupplierId,
              productId: item._id,
              updatedFields,
            }
          );
        }
      }
    }

    res.status(StatusCodes.OK).send({ messge: "Product list fetched." });
  } catch (error: any) {
    console.error("Cola integration total product list fetch error:", error);
    throw new BadRequestError("Something went wrong.");
  }
});

export { router as totalProductsRouter };
