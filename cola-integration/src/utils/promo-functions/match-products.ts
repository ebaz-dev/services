import { ObjectId } from "@ezdev/core/lib/mongoose";

export const matchProducts = async (
  thirdPartyProducts: number[],
  thirdPartyGiftProducts: number[],
  ebProducts: any[]
): Promise<{
  supplierId: ObjectId | null;
  ebProductIds: ObjectId[];
  ebGiftProductIds: ObjectId[];
}> => {
  let supplierId: ObjectId | null = null;
  const ebProductIds: ObjectId[] = [];
  const ebGiftProductIds: ObjectId[] = [];

  const findMatchingProducts = (items: number[], targetArray: ObjectId[]) => {
    for (const item of items) {
      const matchingProduct = ebProducts.find((product) =>
        product.thirdPartyData.some((data: any) => data.productId === item)
      );

      if (matchingProduct) {
        if (!supplierId) {
          supplierId = matchingProduct.customerId;
        }
        targetArray.push(matchingProduct._id);
      }
    }
  };

  findMatchingProducts(thirdPartyProducts, ebProductIds);
  findMatchingProducts(thirdPartyGiftProducts, ebGiftProductIds);

  return { supplierId, ebProductIds, ebGiftProductIds };
};
