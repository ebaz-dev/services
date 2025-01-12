import mongoose, { Types } from "../../lib/mongoose";
import { Product } from "../../models/product/product";

export const matchBasproducts = async (
  products: any[],
  supplierId: Types.ObjectId,
  stockMin: number
) => {
  const ebProducts = await Product.find({
    customerId: supplierId,
    isDeleted: false,
  });

  const ebProductMap = new Map<number, Types.ObjectId>();

  ebProducts.forEach((item: any) => {
    item.thirdPartyData?.forEach((thirdPartyData: any) => {
      const dataCustomerId = thirdPartyData.customerId
        ? thirdPartyData.customerId.toString()
        : thirdPartyData.customerId;

      const supplierIdStr =
        supplierId instanceof mongoose.Types.ObjectId
          ? supplierId.toString()
          : supplierId;

      if (dataCustomerId === supplierIdStr) {
        ebProductMap.set(thirdPartyData.productId, item.id);
      }
    });
  });

  return products
    .map((item) => {
      const productId = ebProductMap.get(item.productid);

      if (productId) {
        return {
          productId: new mongoose.Types.ObjectId(productId),
          price: item.price,
          quantity: item.quantity < stockMin ? 0 : item.quantity,
        };
      }
      return null;
    })
    .filter((product) => product !== null);
};
