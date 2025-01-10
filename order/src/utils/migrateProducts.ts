import {
  Cart,
  CartDoc,
  HoldingSupplierCodes,
  Merchant,
  Supplier,
  IReturnFindWithAdjustedPrice,
  Product,
  ProductDoc,
} from "@ezdev/core";
import { Types } from "@ezdev/core/lib/mongoose";
import { getMerchantTierDiscount } from "./merchant-tier-discount";

export const migrateProducts = async (cart: CartDoc): Promise<any> => {
  const idsArray: string[] = cart.products.map((item) => item.id.toString());

  const query = {
    _id: { $in: idsArray },
    customerId: cart.supplierId.toString(),
  };
  const skip = 0;
  const limit = 100;
  const sort: { [key: string]: 1 | -1 } = { priority: 1 };
  let promos: any = [];

  const result: IReturnFindWithAdjustedPrice =
    await Product.findWithAdjustedPrice({
      query,
      skip,
      limit,
      sort,
      merchant: {
        merchantId: cart.merchantId,
        businessTypeId: new Types.ObjectId(),
      },
    });
  const products: any = [];
  let totalPrice = 0;
  cart.products.map(async (item, index) => {
    const foundProduct = result.products.find(
      (product: ProductDoc) => product.id.toString() === item.id.toString()
    );

    if (foundProduct) {
      if (foundProduct.promos) {
        promos = promos.concat(foundProduct.promos);
      }
      const price =
        foundProduct.adjustedPrice!.price + foundProduct.adjustedPrice!.cost;
      totalPrice += item.quantity * price;
      products.push({
        id: foundProduct.id,
        name: foundProduct.name,
        images: foundProduct.images,
        description: foundProduct.description,
        quantity: item.quantity,
        basePrice: price,
        price,
        giftQuantity: 0,
        stock: foundProduct.inventory?.availableStock,
        inCase: foundProduct.inCase,
        thirdPartyData: foundProduct.thirdPartyData,
        splitSale: foundProduct.splitSale,
      });
    } else {
      await Cart.updateOne(
        { _id: new Types.ObjectId(cart.id as string) },
        {
          $pull: {
            products: {
              id: item.id,
            },
          },
        }
      );
    }
  });

  const merchant = await Merchant.findById(cart.merchantId);
  if (!merchant) {
    console.log("Merchant not found");
    throw new Error("Merchant not found");
  }
  const supplier = await Supplier.findById(cart.supplierId);

  if (!supplier) {
    console.log("supplier not found");
    throw new Error("supplier not found");
  }

  const tradeshop = merchant.tradeShops?.find(
    (ts) => ts.holdingKey === supplier.holdingKey
  );

  let tierDiscount = [];

  if (
    tradeshop &&
    supplier.business &&
    (supplier.holdingKey === HoldingSupplierCodes.AnunGoo ||
      supplier.holdingKey === HoldingSupplierCodes.MarketGate)
  ) {
    tierDiscount = await getMerchantTierDiscount(
      tradeshop?.tsId,
      supplier.businessType
    );
  }

  // Processing tier discount
  let tierDiscountAmount = 0;
  let tierDiscountPercent = 0;
  if (tierDiscount && tierDiscount.length > 0) {
    tierDiscount.map((discount: any) => {
      if (
        discount.percnt > tierDiscountPercent &&
        totalPrice > discount.treshold
      ) {
        tierDiscountPercent = discount.percnt;
      }
    });
    if (tierDiscountPercent > 0) {
      products.map((product: any) => {
        const discountAmount = (product.price / 100) * tierDiscountPercent;
        tierDiscountAmount += discountAmount * product.quantity;
        product.price = product.basePrice - discountAmount;
        product.tierDiscountPrice = product.price;
        return product;
      });
    }
  }

  // Processing promo products
  let giftProducts: any = [];
  let qualifiedPromos: any = [];
  promos = [
    ...new Map(
      promos.map((promo: any) => [
        promo.thirdPartyData.thirdPartyPromoId,
        promo,
      ])
    ).values(),
  ];
  promos.map((promo: any) => {
    if (promo) {
      let shouldQualify = false;
      let qualifiedPromo: any = false;
      qualifiedPromos.map((qPromo: any) => {
        if (
          promo.promoNo &&
          promo.promoNo !== "" &&
          qPromo.promoNo === promo.promoNo
        ) {
          qualifiedPromo = qPromo;
        }
      });

      if (promo.promoType === "x+y") {
        let includedQuantity = 0;
        products.map((product: any) => {
          if (promo.products.indexOf(product.id) !== -1) {
            includedQuantity += product.quantity;
          }
        });
        if (
          promo.thresholdQuantity <= includedQuantity &&
          (!qualifiedPromo ||
            qualifiedPromo.thresholdQuantity < promo.thresholdQuantity)
        ) {
          shouldQualify = true;
        }
      } else if (promo.promoType === "z>x%") {
        let includedQuantity = 0;
        products.map((product: any) => {
          if (promo.products.indexOf(product.id) !== -1) {
            includedQuantity += product.quantity;
          }
        });
        if (
          promo.thresholdQuantity <= includedQuantity &&
          (!qualifiedPromo ||
            qualifiedPromo.thresholdQuantity < promo.thresholdQuantity)
        ) {
          shouldQualify = true;
        }
      } else if (promo.promoType === "z>x") {
        let includedAmount = 0;
        products.map((product: any) => {
          if (promo.products.indexOf(product.id) !== -1) {
            includedAmount += product.price * product.quantity;
          }
        });
        if (
          promo.tresholdAmount <= includedAmount &&
          (!qualifiedPromo ||
            qualifiedPromo.tresholdAmount < promo.tresholdAmount)
        ) {
          shouldQualify = true;
        }
      } else if (promo.promoType === "Z$>x%") {
        let includedAmount = 0;
        products.map((product: any) => {
          if (promo.products.indexOf(product.id) !== -1) {
            includedAmount += product.price * product.quantity;
          }
        });
        if (
          promo.tresholdAmount <= includedAmount &&
          (!qualifiedPromo ||
            qualifiedPromo.tresholdAmount < promo.tresholdAmount)
        ) {
          shouldQualify = true;
        }
      }
      if (shouldQualify) {
        qualifiedPromos = qualifiedPromos.filter(
          (item) =>
            !item.promoNo ||
            item.promoNo === "" ||
            item.promoNo !== promo.promoNo
        );
        qualifiedPromos.push(promo);
      }
    }
  });
  qualifiedPromos.map((promo: any) => {
    if (promo) {
      if (promo.promoType === "x+y") {
        let includedQuantity = 0;
        products.map((product: any) => {
          if (promo.products.indexOf(product.id) !== -1) {
            includedQuantity += product.quantity;
          }
        });
        giftProducts.push({
          id: promo.giftProducts[0],
          quantity:
            promo.giftQuantity *
            Math.floor(
              Number(includedQuantity) / Number(promo.thresholdQuantity)
            ),
          promoId: promo.thirdPartyData.thirdPartyPromoId,
        });
      } else if (promo.promoType === "z>x%") {
        products.map((product: any) => {
          if (promo.products.indexOf(product.id.toString()) !== -1) {
            const discount = (product.price / 100) * promo.promoPercent;
            product.price = product.price - discount;
            product.promoId = promo.thirdPartyData.thirdPartyPromoId;
            product.promoPercent = promo.promoPercent;
            product.promoProducts = promo.products;
          }
          return product;
        });
      } else if (promo.promoType === "z>x") {
        giftProducts.push({
          id: promo.giftProducts[0],
          quantity: promo.giftQuantity,
          promoId: promo.thirdPartyData.thirdPartyPromoId,
        });
      } else if (promo.promoType === "Z$>x%") {
        products.map((product: any) => {
          if (promo.products.indexOf(product.id.toString()) !== -1) {
            const discount = (product.price / 100) * promo.promoPercent;
            product.price = product.price - discount;
            product.promoId = promo.thirdPartyData.thirdPartyPromoId;
            product.promoPercent = promo.promoPercent;
          }
          return product;
        });
      }
      delete promo.products;
    }
  });
  products.map((product: any) => {
    product.price = Number(product.price.toFixed(4));
    product.totalPrice = product.price * product.quantity;
    product.totalBasePrice = product.basePrice * product.quantity;
  });

  const giftIdsArray: string[] = giftProducts.map((item: any) =>
    item.id.toString()
  );

  const giftQuery = {
    _id: { $in: giftIdsArray },
    customerId: cart.supplierId.toString(),
  };

  const giftResult: IReturnFindWithAdjustedPrice =
    await Product.findWithAdjustedPrice({
      query: giftQuery,
      skip,
      limit,
      sort,
      merchant: {
        merchantId: cart.merchantId,
        businessTypeId: new Types.ObjectId(),
      },
    });

  giftProducts = giftProducts.map((item: any) => {
    const foundProduct = giftResult.products.find(
      (product: ProductDoc) => product.id.toString() === item.id.toString()
    );

    if (foundProduct) {
      const price =
        foundProduct.adjustedPrice!.price + foundProduct.adjustedPrice!.cost;

      return {
        id: foundProduct.id,
        name: foundProduct.name,
        images: foundProduct.images,
        description: foundProduct.description,
        quantity: 0,
        basePrice: price,
        price: 0,
        totalPrice: price * item.quantity,
        giftQuantity: item.quantity,
        stock: foundProduct.inventory?.availableStock,
        inCase: foundProduct.inCase,
        promoId: item.promoId,
        thirdPartyData: foundProduct.thirdPartyData,
        splitSale: foundProduct.splitSale,
      };
    }
  });

  console.log("qualifiedPromos", qualifiedPromos);
  return {
    id: cart.id,
    status: cart.status,
    userId: cart.userId,
    products,
    giftProducts,
    merchant: { id: merchant?.id, name: merchant?.name },
    supplier: { id: supplier?.id, name: supplier?.name },
    merchantDebt: 0,
    qualifiedPromos,
    tierDiscount: {
      list: tierDiscount,
      tierDiscountAmount: Number(tierDiscountAmount.toFixed(4)),
      tierDiscountPercent,
    },
  };
};
