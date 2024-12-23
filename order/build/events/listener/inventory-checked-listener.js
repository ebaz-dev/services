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
exports.CartInventoryCheckedListener = void 0;
const core_1 = require("@ebazdev/core");
const inventory_1 = require("@ebazdev/inventory");
const queue_group_name_1 = require("./queue-group-name");
const shared_1 = require("../../shared");
const nats_wrapper_1 = require("../../nats-wrapper");
const order_created_publisher_1 = require("../publisher/order-created-publisher");
const migrateProducts_1 = require("../../utils/migrateProducts");
const order_number_1 = require("../../utils/order-number");
const order_log_1 = require("../../shared/models/order-log");
const customer_1 = require("@ebazdev/customer");
class CartInventoryCheckedListener extends core_1.Listener {
    constructor() {
        super(...arguments);
        this.subject = inventory_1.OrderInventoryEventSubjects.CartInventoryChecked;
        this.queueGroupName = queue_group_name_1.queueGroupName;
    }
    onMessage(data, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cartId, status, insufficientProducts } = data;
                const cart = yield shared_1.Cart.findById(cartId);
                if (!cart) {
                    throw new Error("Cart not found");
                }
                if (status === "confirmed") {
                    const data = yield (0, migrateProducts_1.migrateProducts)(cart);
                    console.log("datas", data, data.qualifiedPromos);
                    const merchant = yield customer_1.Merchant.findById(cart.merchantId);
                    const orderNo = yield (0, order_number_1.getOrderNumber)(cart.supplierId.toString(), !!(merchant === null || merchant === void 0 ? void 0 : merchant.test));
                    const order = yield shared_1.Order.create({
                        status: shared_1.OrderStatus.Created,
                        supplierId: cart.supplierId,
                        merchantId: cart.merchantId,
                        userId: cart.userId,
                        cartId: cart.id,
                        orderedAt: new Date(),
                        deliveryDate: cart.deliveryDate,
                        products: data.products,
                        giftProducts: data.giftProducts,
                        orderNo,
                        merchantDebt: data.merchantDebt,
                        paymentMethod: shared_1.PaymentMethods.Cash,
                        tierDiscountPercent: data.tierDiscount
                            ? data.tierDiscount.tierDiscountPercent
                            : 0,
                        qualifiedPromos: data.qualifiedPromos.map((promo) => {
                            return {
                                id: promo.id,
                                thirdPartyData: promo.thirdPartyData,
                                name: promo.name,
                                startDate: promo.startDate,
                                endDate: promo.endDate,
                                promoNo: promo.promoNo,
                                tresholdAmount: promo.tresholdAmount,
                                thresholdQuantity: promo.thresholdQuantity,
                                promoPercent: promo.promoPercent,
                                giftQuantity: promo.giftQuantity,
                                promoTypeId: promo.promoTypeId,
                                promoTypeName: promo.promoTypeName,
                                promoType: promo.promoTypeId,
                                giftProducts: promo.giftProducts,
                                giftProductPackages: promo.giftProductPackages,
                            };
                        }),
                        tierDiscount: data.tierDiscount,
                    });
                    yield order_log_1.OrderLog.create({
                        orderId: order.id,
                        author: { id: cart.userId },
                        type: order_log_1.OrderLogType.Status,
                        action: order_log_1.OrderActions.Created,
                    });
                    cart.set({ status: shared_1.CartStatus.Ordered, orderedAt: new Date() });
                    yield cart.save();
                    yield new order_created_publisher_1.OrderCreatedPublisher(nats_wrapper_1.natsWrapper.client).publish(order);
                }
                else if (status === "cancelled") {
                    cart.set({
                        status: shared_1.CartStatus.Returned,
                        returnedProducts: insufficientProducts,
                    });
                    yield cart.save();
                }
                msg.ack();
            }
            catch (error) {
                console.error("Error processing InventoryCreatedEvent:", error);
            }
        });
    }
}
exports.CartInventoryCheckedListener = CartInventoryCheckedListener;
