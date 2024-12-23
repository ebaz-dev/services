"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartProductRemovedPublisher = void 0;
const core_1 = require("@ebazdev/core");
const cart_event_subjects_1 = require("../../shared/events/cart-event-subjects");
class CartProductRemovedPublisher extends core_1.Publisher {
    constructor() {
        super(...arguments);
        this.subject = cart_event_subjects_1.CartEventSubjects.CartProductRemoved;
    }
}
exports.CartProductRemovedPublisher = CartProductRemovedPublisher;
