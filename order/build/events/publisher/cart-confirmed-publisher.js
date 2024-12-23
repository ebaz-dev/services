"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartConfirmedPublisher = void 0;
const core_1 = require("@ebazdev/core");
const cart_event_subjects_1 = require("../../shared/events/cart-event-subjects");
class CartConfirmedPublisher extends core_1.Publisher {
    constructor() {
        super(...arguments);
        this.subject = cart_event_subjects_1.CartEventSubjects.CartConfirmed;
    }
}
exports.CartConfirmedPublisher = CartConfirmedPublisher;
