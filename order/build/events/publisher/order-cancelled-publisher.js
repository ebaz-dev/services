"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCancelledPublisher = void 0;
const core_1 = require("@ebazdev/core");
const order_event_subjects_1 = require("../../shared/events/order-event-subjects");
class OrderCancelledPublisher extends core_1.Publisher {
    constructor() {
        super(...arguments);
        this.subject = order_event_subjects_1.OrderEventSubjects.OrderCancelled;
    }
}
exports.OrderCancelledPublisher = OrderCancelledPublisher;
