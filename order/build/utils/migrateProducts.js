"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProducts = void 0;
const product_1 = require("@ebazdev/product");
const shared_1 = require("../shared");
const mongoose_1 = require("mongoose");
const customer_1 = require("@ebazdev/customer");
const merchant_tier_discount_1 = require("./merchant-tier-discount");
const migrateProducts = (cart) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const idsArray = cart.products.map((item) => item.id.toString());
    const query = {
        _id: { $in: idsArray },
        customerId: cart.supplierId.toString(),
    };
    const skip = 0;
    const limit = 100;
    const sort = { priority: 1 };
    let promos = [];
    const result = yield product_1.Product.findWithAdjustedPrice({
        query,
        skip,
        limit,
        sort,
        merchant: {
            merchantId: cart.merchantId,
            businessTypeId: new mongoose_1.Types.ObjectId(),
        },
    });
    const products = [];
    let totalPrice = 0;
    cart.products.map((item, index) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const foundProduct = result.products.find((product) => product.id.toString() === item.id.toString());
        if (foundProduct) {
            if (foundProduct.promos) {
                promos = promos.concat(foundProduct.promos);
            }
            const price = foundProduct.adjustedPrice.price + foundProduct.adjustedPrice.cost;
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
                stock: (_a = foundProduct.inventory) === null || _a === void 0 ? void 0 : _a.availableStock,
                inCase: foundProduct.inCase,
                thirdPartyData: foundProduct.thirdPartyData,
                splitSale: foundProduct.splitSale,
            });
        }
        else {
            yield shared_1.Cart.updateOne({ _id: new mongoose_1.Types.ObjectId(cart.id) }, {
                $pull: {
                    products: {
                        id: item.id,
                    },
                },
            });
        }
    }));
    const merchant = yield customer_1.Merchant.findById(cart.merchantId);
    if (!merchant) {
        console.log("Merchant not found");
        throw new Error("Merchant not found");
    }
    const supplier = yield customer_1.Supplier.findById(cart.supplierId);
    if (!supplier) {
        console.log("supplier not found");
        throw new Error("supplier not found");
    }
    const tradeshop = (_a = merchant.tradeShops) === null || _a === void 0 ? void 0 : _a.find((ts) => ts.holdingKey === supplier.holdingKey);
    let tierDiscount = [];
    if (tradeshop &&
        supplier.business &&
        (supplier.holdingKey === customer_1.HoldingSupplierCodes.AnunGoo ||
            supplier.holdingKey === customer_1.HoldingSupplierCodes.MarketGate)) {
        tierDiscount = yield (0, merchant_tier_discount_1.getMerchantTierDiscount)(tradeshop === null || tradeshop === void 0 ? void 0 : tradeshop.tsId, supplier.business, supplier.businessType);
    }
    // Processing tier discount
    let tierDiscountAmount = 0;
    let tierDiscountPercent = 0;
    if (tierDiscount && tierDiscount.length > 0) {
        tierDiscount.map((discount) => {
            if (discount.percnt > tierDiscountPercent &&
                totalPrice > discount.treshold) {
                tierDiscountPercent = discount.percnt;
            }
        });
        if (tierDiscountPercent > 0) {
            products.map((product) => {
                const discountAmount = (product.price / 100) * tierDiscountPercent;
                tierDiscountAmount += discountAmount * product.quantity;
                product.price = product.basePrice - discountAmount;
                product.tierDiscountPrice = product.price;
                return product;
            });
        }
    }
    // Processing promo products
    let giftProducts = [];
    let qualifiedPromos = [];
    promos = [
        ...new Map(promos.map((promo) => [
            promo.thirdPartyData.thirdPartyPromoId,
            promo,
        ])).values(),
    ];
    promos.map((promo) => {
        if (promo) {
            let shouldQualify = false;
            let qualifiedPromo = false;
            qualifiedPromos.map((qPromo) => {
                if (promo.promoNo &&
                    promo.promoNo !== "" &&
                    qPromo.promoNo === promo.promoNo) {
                    qualifiedPromo = qPromo;
                }
            });
            if (promo.promoType === "x+y") {
                let includedQuantity = 0;
                products.map((product) => {
                    if (promo.products.indexOf(product.id) !== -1) {
                        includedQuantity += product.quantity;
                    }
                });
                if (promo.thresholdQuantity <= includedQuantity &&
                    (!qualifiedPromo ||
                        qualifiedPromo.thresholdQuantity < promo.thresholdQuantity)) {
                    shouldQualify = true;
                }
            }
            else if (promo.promoType === "z>x%") {
                let includedQuantity = 0;
                products.map((product) => {
                    if (promo.products.indexOf(product.id) !== -1) {
                        includedQuantity += product.quantity;
                    }
                });
                if (promo.thresholdQuantity <= includedQuantity &&
                    (!qualifiedPromo ||
                        qualifiedPromo.thresholdQuantity < promo.thresholdQuantity)) {
                    shouldQualify = true;
                }
            }
            else if (promo.promoType === "z>x") {
                let includedAmount = 0;
                products.map((product) => {
                    if (promo.products.indexOf(product.id) !== -1) {
                        includedAmount += product.price * product.quantity;
                    }
                });
                if (promo.tresholdAmount <= includedAmount &&
                    (!qualifiedPromo ||
                        qualifiedPromo.tresholdAmount < promo.tresholdAmount)) {
                    shouldQualify = true;
                }
            }
            else if (promo.promoType === "Z$>x%") {
                let includedAmount = 0;
                products.map((product) => {
                    if (promo.products.indexOf(product.id) !== -1) {
                        includedAmount += product.price * product.quantity;
                    }
                });
                if (promo.tresholdAmount <= includedAmount &&
                    (!qualifiedPromo ||
                        qualifiedPromo.tresholdAmount < promo.tresholdAmount)) {
                    shouldQualify = true;
                }
            }
            if (shouldQualify) {
                qualifiedPromos = qualifiedPromos.filter((item) => !item.promoNo ||
                    item.promoNo === "" ||
                    item.promoNo !== promo.promoNo);
                qualifiedPromos.push(promo);
            }
        }
    });
    qualifiedPromos.map((promo) => {
        if (promo) {
            if (promo.promoType === "x+y") {
                let includedQuantity = 0;
                products.map((product) => {
                    if (promo.products.indexOf(product.id) !== -1) {
                        includedQuantity += product.quantity;
                    }
                });
                giftProducts.push({
                    id: promo.giftProducts[0],
                    quantity: promo.giftQuantity *
                        Math.floor(Number(includedQuantity) / Number(promo.thresholdQuantity)),
                    promoId: promo.thirdPartyData.thirdPartyPromoId,
                });
            }
            else if (promo.promoType === "z>x%") {
                products.map((product) => {
                    if (promo.products.indexOf(product.id.toString()) !== -1) {
                        const discount = (product.price / 100) * promo.promoPercent;
                        product.price = product.price - discount;
                        product.promoId = promo.thirdPartyData.thirdPartyPromoId;
                        product.promoPercent = promo.promoPercent;
                        product.promoProducts = promo.products;
                    }
                    return product;
                });
            }
            else if (promo.promoType === "z>x") {
                giftProducts.push({
                    id: promo.giftProducts[0],
                    quantity: promo.giftQuantity,
                    promoId: promo.thirdPartyData.thirdPartyPromoId,
                });
            }
            else if (promo.promoType === "Z$>x%") {
                products.map((product) => {
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
    products.map((product) => {
        product.price = Number(product.price.toFixed(2));
        product.totalPrice = product.price * product.quantity;
        product.totalBasePrice = product.basePrice * product.quantity;
    });
    const giftIdsArray = giftProducts.map((item) => item.id.toString());
    const giftQuery = {
        _id: { $in: giftIdsArray },
        customerId: cart.supplierId.toString(),
    };
    const giftResult = yield product_1.Product.findWithAdjustedPrice({
        query: giftQuery,
        skip,
        limit,
        sort,
        merchant: {
            merchantId: cart.merchantId,
            businessTypeId: new mongoose_1.Types.ObjectId(),
        },
    });
    giftProducts = giftProducts.map((item) => {
        var _a;
        const foundProduct = giftResult.products.find((product) => product.id.toString() === item.id.toString());
        if (foundProduct) {
            const price = foundProduct.adjustedPrice.price + foundProduct.adjustedPrice.cost;
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
                stock: (_a = foundProduct.inventory) === null || _a === void 0 ? void 0 : _a.availableStock,
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
        merchant: { id: merchant === null || merchant === void 0 ? void 0 : merchant.id, name: merchant === null || merchant === void 0 ? void 0 : merchant.name },
        supplier: { id: supplier === null || supplier === void 0 ? void 0 : supplier.id, name: supplier === null || supplier === void 0 ? void 0 : supplier.name },
        merchantDebt: 0,
        qualifiedPromos,
        tierDiscount: {
            list: tierDiscount,
            tierDiscountAmount: Number(tierDiscountAmount.toFixed(2)),
            tierDiscountPercent,
        },
    };
});
exports.migrateProducts = migrateProducts;
