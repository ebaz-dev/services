"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeProducts = void 0;
const mergeProducts = (orderProducts, productDetails) => {
    const productDetailsMap = new Map();
    productDetails.forEach((product) => {
        productDetailsMap.set(product.id.toString(), product);
    });
    const mergedProducts = orderProducts.map((productItem) => {
        if (productItem) {
            productItem.totalBasePrice = productItem.basePrice * productItem.quantity;
            productItem.totalPrice = productItem.price * productItem.quantity;
            productItem.discountAmount = productItem.basePrice - productItem.price;
            productItem.totalDiscountAmount =
                productItem.totalBasePrice - productItem.totalPrice;
            productItem.discountPercent =
                (productItem.discountAmount / productItem.basePrice) * 100;
            const productDetail = productDetailsMap.get(productItem.id.toString());
            if (productDetail) {
                productItem.name = productDetail.name;
                productItem.images = productDetail.images;
                productItem.slug = productDetail.slug;
            }
            return productItem;
        }
    });
    return mergedProducts;
};
exports.mergeProducts = mergeProducts;
