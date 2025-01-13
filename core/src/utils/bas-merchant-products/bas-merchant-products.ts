import { MerchantProducts } from "../../models/product/merchant-products";
import { Types } from "../../lib/mongoose";
import { matchBasproducts } from "./bas-product-match";
import { getBasClient } from "./bas-client";

export const getBasMerchantProducts = async (
  merchant: any,
  supplier: any,
  skip: number,
  limit: number,
  sort: any,
  query: any
) => {
  const merchantId = new Types.ObjectId(merchant.id);
  const supplierId = new Types.ObjectId(supplier.id);

  const holdingKey = supplier.holdingKey;
  const business = supplier.business;
  const stockMin = supplier.stockMin;

  let isTotalMerchant = false;

  const tsId = merchant.tradeShops.find((ts: any) => {
    if (ts.holdingKey === "TD") {
      isTotalMerchant = true;
    }
    return ts.holdingKey === holdingKey;
  })?.tsId;

  const sortKey = Object.keys(sort)[0];
  const sortOrder = Object.values(sort)[0] as 1 | -1;

  const merchantProducts = await MerchantProducts.findOne({
    merchantId,
    supplierId,
  });

  const aggregateProducts = async () => {
    const matchStage: any = {
      "productDetails.customerId": supplierId,
      "productDetails.isActive": true,
      "productDetails.isDeleted": false,
    };

    if (query.name) {
      matchStage["$or"] = [
        { "productDetails.name": query.name },
        { "productDetails.slug": query.name },
      ];
    }

    if (query._id) {
      matchStage["productDetails._id"] = {
        $in: query._id.$in.map((id: string) => new Types.ObjectId(id)),
      };
    }

    if (query.brandId) {
      matchStage["productDetails.brandId"] = {
        $in: query.brandId.$in.map((id: string) => new Types.ObjectId(id)),
      };
    }

    if (query.barCode) {
      matchStage["productDetails.barCode"] = query.barCode;
    }

    if (query.sku) {
      matchStage["productDetails.sku"] = query.sku;
    }

    if (query.favourite) {
      matchStage["productDetails.favourite"] = query.favourite;
    }

    let promoTypeIds: number[] = [];
    if (query.promotion || query.discount) {
      if (query.promotion) {
        promoTypeIds.push(1, 2, 5, 6);
      }
      if (query.discount) {
        promoTypeIds.push(3, 4);
      }
      matchStage["productDetails.promos.promoTypeId"] = { $in: promoTypeIds };
    }

    console.log("promoTypeIds:", promoTypeIds);
    console.log("matchStage:", JSON.stringify(matchStage, null, 2));

    const products = await MerchantProducts.aggregate([
      { $match: { merchantId, supplierId } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "promos",
          localField: "products.productId",
          foreignField: "products",
          as: "productDetails.promos",
          pipeline: [
            {
              $match: {
                customerId: supplierId,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
                isActive: true,
                tradeshops: { $in: [Number(tsId)] },
                ...(promoTypeIds.length > 0 && {
                  promoTypeId: { $in: promoTypeIds },
                }),
              },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: 1,
                promoNo: 1,
                tresholdAmount: 1,
                thresholdQuantity: 1,
                promoPercent: 1,
                giftQuantity: 1,
                isActive: 1,
                promoTypeId: 1,
                promoTypeName: 1,
                promoType: 1,
                startDate: 1,
                endDate: 1,
                products: 1,
                giftProducts: 1,
                giftProductPackages: 1,
                "thirdPartyData.thirdPartyPromoId": 1,
                "thirdPartyData.thirdPartyPromoNo": 1,
                "thirdPartyData.thirdPartyPromoTypeId": 1,
                "thirdPartyData.thirdPartyPromoType": 1,
                "thirdPartyData.thirdPartyPromoTypeCode": 1,
              },
            },
          ],
        },
      },
      { $match: matchStage },
      {
        $addFields: {
          quantityZero: { $cond: [{ $eq: ["$products.quantity", 0] }, 1, 0] },
          adjustedPrice: {
            price: "$products.price",
            cost: 0,
          },
          inventory: {
            totalStock: 0,
            reservedStock: 0,
            availableStock: "$products.quantity",
            id: "$productDetails.inventoryId",
          },
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "customers",
          localField: "productDetails.customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "productcategories",
          localField: "productDetails.categoryIds",
          foreignField: "_id",
          as: "categories",
        },
      },
      {
        $addFields: {
          categories: {
            $map: {
              input: "$categories",
              as: "category",
              in: {
                name: "$$category.name",
                slug: "$$category.slug",
                id: "$$category._id",
              },
            },
          },
        },
      },
      {
        $sort: {
          quantityZero: 1, // Move quantity = 0 to the end
          ...(sortKey === "price"
            ? { "products.price": sortOrder }
            : { "productDetails.priority": sortOrder }),
        },
      },
      {
        $group: {
          _id: "$_id",
          products: {
            $push: {
              name: "$productDetails.name",
              description: "$productDetails.description",
              slug: "$productDetails.slug",
              brandId: "$productDetails.brandId",
              barCode: "$productDetails.barCode",
              sku: "$productDetails.sku",
              customerId: "$productDetails.customerId",
              categoryIds: "$productDetails.categoryIds",
              prices: "$productDetails.prices",
              images: "$productDetails.images",
              thirdPartyData: "$productDetails.thirdPartyData",
              inCase: "$productDetails.inCase",
              isActive: "$productDetails.isActive",
              priority: "$productDetails.priority",
              attributes: "$productDetails.attributes",
              createdAt: "$productDetails.createdAt",
              updatedAt: "$productDetails.updatedAt",
              inventoryId: "$productDetails.inventoryId",
              favourite: "$productDetails.favourite",
              isDeleted: "$productDetails.isDeleted",
              inventory: "$inventory",
              brand: {
                name: "$brand.name",
                slug: "$brand.slug",
                customerId: "$brand.customerId",
                image: "$brand.image",
                id: "$productDetails.brandId",
              },
              categories: "$categories",
              customer: {
                name: "$customer.name",
                regNo: "$customer.regNo",
                address: "$customer.address",
                phone: "$customer.phone",
                logo: "$customer.logo",
                type: "$customer.type",
                bankAccounts: "$customer.bankAccounts",
                email: "$customer.email",
                categoryId: "$customer.categoryId",
                userId: "$customer.userId",
                id: "$productDetails.customerId",
              },
              promos: "$productDetails.promos",
              adjustedPrice: "$adjustedPrice",
              vendorId: "$productDetails.vendorId",
              splitSale: "$productDetails.splitSale",
              id: "$products.productId",
            },
          },
        },
      },
      {
        $project: {
          totalProductsCount: { $size: "$products" },
          products: { $slice: ["$products", skip, limit] },
        },
      },
    ]);

    return products.length > 0
      ? {
          products: products[0].products,
          count: products[0].totalProductsCount,
        }
      : { products: [], count: 0 };
  };

  if (merchantProducts) {
    const currentTime = new Date().getTime();
    const expirationTime = new Date(merchantProducts.expireAt).getTime();
    const timeDifference = expirationTime - currentTime;

    if (timeDifference > 0 && timeDifference <= 300000) {
      return await aggregateProducts();
    } else {
      const apiClient = await getBasClient(holdingKey, isTotalMerchant);

      const apiResult = await apiClient
        .getClient()
        .getProductsByMerchantId(tsId, business);

      let { data: receivedProducts } = apiResult.data;

      const matchedProducts = await matchBasproducts(
        receivedProducts,
        supplierId,
        stockMin
      );

      merchantProducts.products = matchedProducts;
      merchantProducts.expireAt = new Date(currentTime + 300000);

      await merchantProducts.save();
      return await aggregateProducts();
    }
  } else {
    const apiClient = await getBasClient(holdingKey, isTotalMerchant);

    const apiResult = await apiClient
      .getClient()
      .getProductsByMerchantId(tsId, business);

    let { data: receivedProducts } = apiResult.data;

    if (receivedProducts.length === 0) {
      return { products: [], count: 0 };
    }

    const matchedProducts = await matchBasproducts(
      receivedProducts,
      supplierId,
      stockMin
    );

    const newMerchantProducts = new MerchantProducts({
      merchantId,
      supplierId,
      products: matchedProducts,
      expireAt: new Date(new Date().getTime() + 300000),
    });

    await newMerchantProducts.save();

    return await aggregateProducts();
  }
};
