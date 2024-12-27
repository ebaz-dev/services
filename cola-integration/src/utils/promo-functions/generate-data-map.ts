import {
  basPromoProducts,
  basPromoGiftProducts,
  basPromoGiftProductsPackage,
  basPromoTradeshops,
} from "@ezdev/core";

export const createPromoDataMaps = (promoData: any) => {
  const basProductsMap = new Map<number, basPromoProducts>(
    (promoData.promo_products || []).map((item: basPromoProducts) => [
      item.PromoID,
      item,
    ])
  );

  const basGiftProductsMap = new Map<number, basPromoGiftProducts>(
    (promoData.promo_giftproducts || []).map((item: basPromoGiftProducts) => [
      item.PromoID,
      item,
    ])
  );

  const basProductPackagesMap = new Map<number, basPromoGiftProductsPackage[]>(
    (promoData.promo_giftproductspackage || []).map(
      (item: basPromoGiftProductsPackage) => [item.promoid, [item]]
    )
  );

  const basTradeshopsMap = new Map<number, basPromoTradeshops>(
    (promoData.promo_tradeshops || []).map((item: basPromoTradeshops) => [
      item.PromoID,
      item,
    ])
  );

  return {
    basProductsMap,
    basGiftProductsMap,
    basProductPackagesMap,
    basTradeshopsMap,
  };
};
