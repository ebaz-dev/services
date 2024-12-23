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
exports.InvoicePaidListener = void 0;
const core_1 = require("@ebazdev/core");
const payment_1 = require("@ebazdev/payment");
const queue_group_name_1 = require("./queue-group-name");
const shared_1 = require("../../shared");
const nats_wrapper_1 = require("../../nats-wrapper");
const order_confirmed_publisher_1 = require("../publisher/order-confirmed-publisher");
const order_log_1 = require("../../shared/models/order-log");
class InvoicePaidListener extends core_1.Listener {
    constructor() {
        super(...arguments);
        this.subject = payment_1.InvoiceEventSubjects.InvoicePaid;
        this.queueGroupName = queue_group_name_1.queueGroupName;
    }
    onMessage(data, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield shared_1.Order.findById(data.orderId);
                if (!order) {
                    throw new Error("Order not found");
                }
                order.set({ status: shared_1.OrderStatus.Confirmed });
                yield order_log_1.OrderLog.create({
                    orderId: order.id,
                    author: { name: "system" },
                    type: order_log_1.OrderLogType.Status,
                    action: order_log_1.OrderActions.Confirmed,
                });
                yield order.save();
                yield new order_confirmed_publisher_1.OrderConfirmedPublisher(nats_wrapper_1.natsWrapper.client).publish(order);
                msg.ack();
            }
            catch (error) {
                console.error("Error processing InvoicePaidEvent:", error);
                msg.ack();
            }
        });
    }
}
exports.InvoicePaidListener = InvoicePaidListener;
