import express, { Request, Response } from "express";
import {
  Product,
  Promo,
  Supplier,
  basPromoMain,
  TotalAPIClient,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongoose";
import { createPromoDataMaps } from "../../utils/promo-functions/generate-data-map";
import { matchProducts } from "../../utils/promo-functions/match-products";
import { checkAndUpdatePromo } from "../../utils/promo-functions/check-existing-promo";
import { publishPromo } from "../../utils/promo-functions/promo-publisher";

const router = express.Router();

router.get("/total/promo-list", async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.findOne({
      type: "supplier",
      holdingKey: "TD",
    }).select("_id vendorKey");

    if (!supplier) {
      throw new Error("Supplier not found.");
    }

    const totalSupplierId = supplier?._id as ObjectId;

    const promosResponse = await TotalAPIClient.getClient().post(
      "/api/ebazaar/getdatapromo",
      {}
    );

    const promoData = promosResponse?.data || {};
    const basPromoMainList: basPromoMain[] = promoData.promo_main;

    if (basPromoMainList.length === 0) {
      throw new Error("No promo received.");
    }

    const ebProducts = await Product.find({
      customerId: totalSupplierId,
    }).select("_id thirdPartyData customerId");

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

      const existingPromo = await Promo.findOne({
        "thirdPartyData.thirdPartyPromoId": promo.promoid,
      });

      if (existingPromo) {
        await checkAndUpdatePromo(
          existingPromo,
          promo,
          totalSupplierId,
          ebProductIds,
          ebGiftProductIds
        );
      } else {
        await publishPromo(
          promo,
          totalSupplierId,
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

export { router as totalPromosRouter };
