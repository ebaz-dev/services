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
exports.ColaOrderStatusReceivedListener = void 0;
const core_1 = require("@ebazdev/core");
const queue_group_name_1 = require("./queue-group-name");
const core_2 = require("@ezdev/core");
const cola_integration_1 = require("@ebazdev/cola-integration");
const cola_order_statuses_1 = require("@ebazdev/cola-integration/build/models/cola-order-statuses");
const order_confirmed_publisher_1 = require("../publisher/order-confirmed-publisher");
const nats_wrapper_1 = require("../../nats-wrapper");
const order_cancelled_publisher_1 = require("../publisher/order-cancelled-publisher");
const order_delivered_publisher_1 = require("../publisher/order-delivered-publisher");
const order_log_1 = require("../../shared/models/order-log");
class ColaOrderStatusReceivedListener extends core_1.Listener {
    constructor() {
        super(...arguments);
        this.subject = cola_integration_1.ColaOrderStatusSubjects.OrderStatusRecieved;
        this.queueGroupName = queue_group_name_1.queueGroupName;
    }
    onMessage(data, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId, status } = data;
                const order = yield core_2.Order.findOne({ orderNo: orderId });
                if (!order) {
                    throw new Error("order not found");
                }
                if (status === cola_order_statuses_1.colaOrderStatuses.confirmed) {
                    order.status = core_2.OrderStatus.Confirmed;
                    yield order_log_1.OrderLog.create({
                        orderId: order.id,
                        author: { name: "BAS" },
                        type: order_log_1.OrderLogType.Status,
                        action: order_log_1.OrderActions.Confirmed,
                    });
                    yield new order_confirmed_publisher_1.OrderConfirmedPublisher(nats_wrapper_1.natsWrapper.client).publish(order);
                }
                else if (status === cola_order_statuses_1.colaOrderStatuses.cancelled) {
                    order.status = core_2.OrderStatus.Cancelled;
                    yield order_log_1.OrderLog.create({
                        orderId: order.id,
                        author: { name: "BAS" },
                        type: order_log_1.OrderLogType.Status,
                        action: order_log_1.OrderActions.Cancelled,
                    });
                    yield new order_cancelled_publisher_1.OrderCancelledPublisher(nats_wrapper_1.natsWrapper.client).publish(order);
                }
                if (status === cola_order_statuses_1.colaOrderStatuses.delivered) {
                    order.status = core_2.OrderStatus.Delivered;
                    yield order_log_1.OrderLog.create({
                        orderId: order.id,
                        author: { name: "BAS" },
                        type: order_log_1.OrderLogType.Status,
                        action: order_log_1.OrderActions.Delivered,
                    });
                    yield new order_delivered_publisher_1.OrderDeliveredPublisher(nats_wrapper_1.natsWrapper.client).publish(order);
                }
                yield order.save();
                msg.ack();
            }
            catch (error) {
                console.error("Error processing OrderstatusRecieved:", error);
                msg.ack();
            }
        });
    }
}
exports.ColaOrderStatusReceivedListener = ColaOrderStatusReceivedListener;
