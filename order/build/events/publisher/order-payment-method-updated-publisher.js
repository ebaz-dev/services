"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPaymentMethodUpdatedPublisher = void 0;
const core_1 = require("@ebazdev/core");
const order_event_subjects_1 = require("../../shared/events/order-event-subjects");
class OrderPaymentMethodUpdatedPublisher extends core_1.Publisher {
    constructor() {
        super(...arguments);
        this.subject = order_event_subjects_1.OrderEventSubjects.OrderPaymentMethodUpdated;
    }
}
exports.OrderPaymentMethodUpdatedPublisher = OrderPaymentMethodUpdatedPublisher;
