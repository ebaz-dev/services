import express, { Request, Response } from "express";
import {
  Product,
  Supplier,
  BadRequestError,
  AnungooAPIClient,
  BasProductData,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../../nats-wrapper";
import { Types } from "@ezdev/core/lib/mongoose";
import { BasProductRecievedEventPublisher } from "../../events/publisher/bas-product-recieved-publisher";
import { BasProductUpdatedEventPublisher } from "../../events/publisher/bas-product-updated-publisher";
import {
  convertCapacity,
  barcodeSanitizer,
  eventDelay,
} from "../../utils/bas-product-functions";

const router = express.Router();

router.get("/marketgate/product-list", async (req: Request, res: Response) => {
  try {
    const marketGate = await Supplier.find({
      type: "supplier",
      holdingKey: "MG",
    });

    if (!marketGate) {
      throw new BadRequestError("MarketGate supplier not found.");
    }

    const mgMgico = marketGate?.filter((item) => item?.vendorKey === "MGICO");
    const mgNestle = marketGate?.filter(
      (item) => item?.vendorKey === "MGNESTLE"
    );

    const productsResponse = await AnungooAPIClient.getClient().post(
      `/api/ebazaar/getdataproductinfo`,
      {}
    );

    let basProducts: BasProductData[] = productsResponse?.data?.data || [];

    basProducts = basProducts.filter(
      (product) =>
        product.business === "mg_nonfood" || product.business === "mg_food"
    );

    if (basProducts.length === 0) {
      throw new BadRequestError("No products from bas API.");
    }

    basProducts.sort(
      (a, b) => parseInt(a.position || "0") - parseInt(b.position || "0")
    );

    basProducts.forEach((item, index) => {
      item.priority = index + 1;
    });

    const existingProducts = await Product.find({
      customerId: { $in: [mgMgico[0]?._id, mgNestle[0]?._id] },
    });

    const existingEbProductsMap = existingProducts.reduce((map, item) => {
      if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
        const basIntegrationData = item.thirdPartyData.find(
          (data: any) =>
            data?.customerId?.toString() ===
              (mgMgico[0]?._id as Types.ObjectId).toString() ||
            data?.customerId?.toString() ===
              (mgNestle[0]?._id as Types.ObjectId).toString()
        );

        if (basIntegrationData) {
          map[basIntegrationData.productId] = item;
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

        const supplierId =
          item.business === "mg_nonfood" ? mgMgico[0]?._id : mgNestle[0]?._id;

        const eventPayload: any = {
          supplierId: supplierId as Types.ObjectId,
          basId: item.productid,
          productName: item.productname,
          incase: item.incase,
          sectorName: item.sectorname,
          barcode: sanitizedBarcode,
          business: item.business,
          splitSale: true,
          priority: item.priority,
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

        if (existingCapacity !== capacity && capacity !== 0) {
          updatedFields.capacity = capacity;
        }

        if (item.inCase !== product.incase) {
          updatedFields.incase = product.incase;
        }

        if (item.barCode !== sanitizedBarcode && sanitizedBarcode !== "") {
          updatedFields.barcode = sanitizedBarcode;
        }

        if (!item.priority || item.priority !== product.priority) {
          updatedFields.priority = product.priority;
        }

        if (Object.keys(updatedFields).length > 0) {
          await eventDelay(500);

          const supplierId =
            item.business === "mg_nonfood" ? mgMgico[0]?._id : mgNestle[0]?._id;

          await new BasProductUpdatedEventPublisher(natsWrapper.client).publish(
            {
              supplierId: supplierId as Types.ObjectId,
              productId: item._id,
              updatedFields,
            }
          );
        }
      }
    }

    res.status(StatusCodes.OK).send({ messge: "Product list fetched." });
  } catch (error: any) {
    console.error(
      "Cola integration marketgate product list fetch error:",
      error
    );
    throw new BadRequestError("Something went wrong.");
  }
});

export { router as mgProductsRouter };
