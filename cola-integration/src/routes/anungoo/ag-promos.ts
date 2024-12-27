import express, { Request, Response } from "express";
import {
  Product,
  Promo,
  Supplier,
  basPromoMain,
  AnungooAPIClient,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { createPromoDataMaps } from "../../utils/promo-functions/generate-data-map";
import { matchProducts } from "../../utils/promo-functions/match-products";
import { checkAndUpdatePromo } from "../../utils/promo-functions/check-existing-promo";
import { publishPromo } from "../../utils/promo-functions/promo-publisher";

const router = express.Router();

router.get("/anungoo/promo-list", async (req: Request, res: Response) => {
  try {
    const pageNumber = req.body.pageNumber || 0;

    const suppliers = await Supplier.find({
      type: "supplier",
      holdingKey: { $in: ["AG", "MG"] },
    }).select("_id vendorKey");

    if (!suppliers || suppliers.length === 0) {
      throw new Error("Supplier not found.");
    }

    const supplierIds: { [key: string]: Types.ObjectId | undefined } = {
      AGPNG: undefined,
      AGIONE: undefined,
      MGNESTLE: undefined,
      MGICO: undefined,
    };

    for (const supplier of suppliers) {
      const vendorKey = supplier.vendorKey;
      if (vendorKey && vendorKey in supplierIds) {
        supplierIds[vendorKey] = supplier._id as Types.ObjectId;
      }
    }

    const {
      AGPNG: anungooNonFoodId,
      AGIONE: anungooFoodId,
      MGNESTLE: marketGateFoodId,
      MGICO: marketGateNonFoodId,
    } = supplierIds;

    const promosResponse = await AnungooAPIClient.getClient().post(
      "/api/ebazaar/getdatapromo",
      { pagenumber: pageNumber }
    );

    const promoData = promosResponse?.data || {};
    const basPromoMainList: basPromoMain[] = promoData.promo_main;

    if (basPromoMainList.length === 0) {
      throw new Error("No promo received.");
    }

    const ebProducts = await Product.find({
      customerId: {
        $in: [
          anungooNonFoodId,
          anungooFoodId,
          marketGateFoodId,
          marketGateNonFoodId,
        ],
      },
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

      if (!promoSupplierId) {
        console.error("Supplier not found for promo:", promo.promoid);
        continue;
      }

      const existingPromo = await Promo.findOne({
        "thirdPartyData.thirdPartyPromoId": promo.promoid,
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
    console.error("Bas integration Anungoo promo list get error:", error);

    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

export { router as agPromosRouter };
