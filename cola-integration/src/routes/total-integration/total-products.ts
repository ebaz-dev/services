import express, { Request, Response } from "express";
import {
  Product,
  Supplier,
  BadRequestError,
  TotalAPIClient,
  BasProductData,
  ThirdPartyData,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../../nats-wrapper";
import { Types } from "@ezdev/core/lib/mongoose";
import { BasProductRecievedEventPublisher } from "../../events/publisher/bas-product-recieved-publisher";
import { BasProductUpdatedEventPublisher } from "../../events/publisher/bas-product-updated-publisher";
import {
  convertCapacity,
  barcodeSanitizer,
} from "../../utils/bas-product-functions";

const router = express.Router();

router.get("/total/product-list", async (req: Request, res: Response) => {
  try {
    console.log("Total product list fetch started.");
    const { totalParent, totalParentId } = await getTotalParentSupplier();

    const relatedSuppliers = await getRelatedSuppliers(totalParentId);
    const { totalMainSuppliers, totalChilds } = categorizeSuppliers(relatedSuppliers);

    const anungoo = totalMainSuppliers.find((item) => item.business === "Anungoo");
    const marketGate = totalMainSuppliers.find((item) => item.business === "Market Gate");

    if (!anungoo || !marketGate) {
      throw new BadRequestError("Anungoo or Market Gate supplier not found.");
    }

    const anungooChilds: any[] = await getRelatedSuppliers(anungoo.id);
    const marketGateChilds: any[] = await getRelatedSuppliers(marketGate.id);

    totalMainSuppliers.push(totalParent);

    for (const supplier of totalMainSuppliers) {
      const basProducts = await fetchProducts(supplier);

      if (supplier.business === "TotalDistribution") {
        for (const child of totalChilds) {
          await processChildProducts(child, basProducts);
        }
      } else if (supplier.business === "Anungoo") {
        for (const child of anungooChilds) {
          await processChildProducts(child, basProducts);
        }
      } else if (supplier.business === "Market Gate") {
        for (const child of marketGateChilds) {
          await processChildProducts(child, basProducts);
        }
      } else if (supplier.business === "Coca Cola") {
        await processChildProducts(supplier, basProducts);
      }
    }

    return res.status(StatusCodes.OK).send({ message: "Total distribution product list fetched." });
  } catch (error: any) {
    console.error("Cola integration total product list fetch error:", error);
    throw new BadRequestError("Something went wrong.");
  }
});

export { router as totalProductsRouter };

const getTotalParentSupplier = async () => {
  const totalParent = await Supplier.findOne({
    type: "supplier",
    holdingKey: "TD",
    parentId: { $exists: false },
  }).select("business businessType");

  if (!totalParent) {
    throw new BadRequestError("Total parent supplier not found.");
  }

  const totalParentId = totalParent._id as Types.ObjectId;

  return { totalParent, totalParentId };
};

const getRelatedSuppliers = async (totalParentId: Types.ObjectId) => {
  const relatedSuppliers = await Supplier.find({
    parentId: totalParentId,
  }).select("business businessType");

  if (!relatedSuppliers || relatedSuppliers.length === 0) {
    throw new BadRequestError("Total child suppliers not found.");
  }

  return relatedSuppliers;
};

const categorizeSuppliers = (relatedSuppliers: any[]) => {
  let totalMainSuppliers: any[] = [];
  let totalChilds: any[] = [];

  for (const item of relatedSuppliers) {
    if (item.business === "TotalDistribution") {
      totalChilds.push(item);
    } else {
      totalMainSuppliers.push(item);
    }
  }

  return { totalMainSuppliers, totalChilds };
};

const fetchProducts = async (supplier: any) => {
  const productsResponse = await TotalAPIClient.getClient().post(
    "/api/ebazaar/getdataproductinfo",
    { company: supplier.business }
  );

  let basProducts: BasProductData[] = productsResponse?.data?.data || [];
  if (basProducts.length === 0) {
    throw new BadRequestError("No products from bas API.");
  }

  return basProducts;
};

const processChildProducts = async (child: any, basProducts: BasProductData[]) => {
  const childProducts = basProducts.filter((item: any) => item.business === child.businessType);

  childProducts.sort((a, b) => parseInt(a.position || "0") - parseInt(b.position || "0"));

  childProducts.forEach((item, index) => {
    item.priority = index + 1;
  });

  const existingEbProducts = await Product.find({
    customerId: child.id as Types.ObjectId,
  });

  const existingEbProductsMap = existingEbProducts.reduce((map, item) => {
    if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
      const thirdPartyDataArray = item.thirdPartyData as any[];

      const colaIntegrationData = thirdPartyDataArray.find(
        (data: ThirdPartyData) => data?.customerId.toString() === child.id.toString()
      );

      if (colaIntegrationData) {
        map[colaIntegrationData.productId] = item;
      }
    }
    return map;
  }, {} as { [key: string]: any });

  const basNewProducts: BasProductData[] = [];
  const basExistingProducts: BasProductData[] = [];

  childProducts.forEach((item: BasProductData) => {
    if (!existingEbProductsMap[item.productid.toString()]) {
      basNewProducts.push(item);
    } else {
      basExistingProducts.push(item);
    }
  });

  await handleNewProducts(basNewProducts, child);
  await handleExistingProducts(basExistingProducts, existingEbProductsMap, child);
};

const handleNewProducts = async (basNewProducts: BasProductData[], supplier: any) => {
  for (const item of basNewProducts) {
    const capacity = await convertCapacity(item.capacity);
    const sanitizedBarcode = await barcodeSanitizer(item.barcode);

    const eventPayload: any = {
      supplierId: supplier.id as Types.ObjectId,
      basId: item.productid,
      productName: item.productname,
      brandName: item.brandname,
      incase: item.incase,
      sectorName: item.sectorname,
      business: item.business,
      barcode: sanitizedBarcode,
      splitSale: true,
      priority: item.priority,
    };

    if (capacity !== 0) {
      eventPayload.capacity = capacity;
    }

    if (supplier.business === "Coca Cola") {
      // eventPayload.brandName = item.brandname;
      eventPayload.spilit = false
    }

    await new BasProductRecievedEventPublisher(natsWrapper.client).publish(eventPayload);
  }
};

const handleExistingProducts = async (
  basExistingProducts: BasProductData[],
  existingEbProductsMap: { [key: string]: any },
  supplier: any
) => {
  for (const product of basExistingProducts) {
    const item = existingEbProductsMap[product.productid];

    if (item) {
      const updatedFields: any = {};

      const capacity = await convertCapacity(product.capacity);
      const existingCapacity = item.attributes?.find((attr: any) => attr.key === "size")?.value;
      const sanitizedBarcode = await barcodeSanitizer(product.barcode);

      if (item.name !== product.productname) {
        updatedFields.productName = product.productname;
      }

      if (supplier.business === "Coca Cola" && !item.brandId) {
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

      if (!item.priority || item.priority !== product.priority) {
        updatedFields.priority = product.priority;
      }

      if (Object.keys(updatedFields).length > 0) {

        await new BasProductUpdatedEventPublisher(natsWrapper.client).publish({
          supplierId: supplier.id as Types.ObjectId,
          productId: item._id,
          updatedFields,
        });
      }
    }
  }
};