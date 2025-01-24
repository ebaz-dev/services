import express, { Request, Response } from "express";
import {
  Product,
  Promo,
  Supplier,
  basPromoMain,
  TotalAPIClient,
  BadRequestError
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "@ezdev/core/lib/mongoose";
import { createPromoDataMaps } from "../../utils/promo-functions/generate-data-map";
import { matchProducts } from "../../utils/promo-functions/match-products";
import { checkAndUpdatePromo } from "../../utils/promo-functions/check-existing-promo";
import { publishPromo } from "../../utils/promo-functions/promo-publisher";

const router = express.Router();

router.get("/total/promo-list", async (req: Request, res: Response) => {
  try {
    const { totalParent, totalParentId } = await getTotalParentSupplier();

    const relatedSuppliers = await getRelatedSuppliers(totalParentId);
    const { totalMainSuppliers, totalChilds } = categorizeSuppliers(relatedSuppliers);

    const anungoo = findSupplier(totalMainSuppliers, "Anungoo");
    const marketGate = findSupplier(totalMainSuppliers, "Market Gate");
    const cola = findSupplier(totalMainSuppliers, "Coca Cola");

    const anungooChilds = await getRelatedSuppliers(anungoo._id);
    const marketGateChilds = await getRelatedSuppliers(marketGate._id);

    const totalSuppliers = [...anungooChilds, ...totalChilds, ...marketGateChilds, cola];
    const supplierIds = totalSuppliers.map((supplier) => supplier._id);


    if (totalSuppliers.length === 0) {
      throw new BadRequestError("Total suppliers not found.");
    }

    const promosResponse = await TotalAPIClient.getClient().post(
      "/api/ebazaar/getdatapromo", {}
    );

    const promoData = promosResponse?.data || {};
    const basPromoMainList: basPromoMain[] = promoData.promo_main;

    if (basPromoMainList.length === 0) {
      throw new Error("No promo received.");
    }

    const ebProducts = await Product.find({
      customerId: {
        $in: supplierIds,
      },
    }).select("_id thirdPartyData customerId");

    if (!ebProducts || ebProducts.length === 0) {
      throw new Error("Total products not found.");
    }

    const {
      basProductsMap,
      basGiftProductsMap,
      basProductPackagesMap,
      basTradeshopsMap,
    } = createPromoDataMaps(promoData);

    for (const promo of basPromoMainList) {
      promo.thirdPartyProducts =
        basProductsMap.get(promo.promoid)?.Products || [];
      promo.thirdPartyGiftProducts =
        basGiftProductsMap.get(promo.promoid)?.GiftProducts || [];
      promo.thirdPartyGiftProductPackage =
        basProductPackagesMap.get(promo.promoid) || [];
      promo.thirdPartyTradeshops =
        basTradeshopsMap.get(promo.promoid)?.Tradeshops || [];

      const {
        supplierId: promoSupplierId,
        ebProductIds,
        ebGiftProductIds,
      } = await matchProducts(
        promo.thirdPartyProducts || [],
        promo.thirdPartyGiftProducts || [],
        ebProducts
      );

      if (!promoSupplierId) {
        console.error("Supplier not found for promo:", promo.promoid);
        continue;
      }

      const existingPromo = await Promo.findOne({
        "thirdPartyData.thirdPartyPromoId": promo.promoid,
        customerId: promoSupplierId,
      });

      if (existingPromo) {
        await checkAndUpdatePromo(
          existingPromo,
          promo,
          promoSupplierId,
          ebProductIds,
          ebGiftProductIds
        );
      } else {
        await publishPromo(
          promo,
          promoSupplierId,
          ebProductIds,
          ebGiftProductIds
        );
      }
    }

    return res.status(StatusCodes.OK).send({ status: "success" });
  } catch (error: any) {
    console.error("Bas integration total promo list get error:", error);

    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

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

const getRelatedSuppliers = async (parentId: Types.ObjectId) => {
  const relatedSuppliers = await Supplier.find({ parentId }).select("business businessType");

  if (!relatedSuppliers || relatedSuppliers.length === 0) {
    throw new BadRequestError("Child suppliers not found.");
  }

  return relatedSuppliers;
};

const categorizeSuppliers = (relatedSuppliers: any[]) => {
  const totalMainSuppliers: any[] = [];
  const totalChilds: any[] = [];

  for (const item of relatedSuppliers) {
    if (item.business === "TotalDistribution") {
      totalChilds.push(item);
    } else {
      totalMainSuppliers.push(item);
    }
  }

  return { totalMainSuppliers, totalChilds };
};

const findSupplier = (suppliers: any[], businessName: string) => {
  const supplier = suppliers.find((item) => item.business === businessName);
  if (!supplier) {
    throw new BadRequestError(`${businessName} supplier not found.`);
  }
  return supplier;
};

export { router as totalPromosRouter };
