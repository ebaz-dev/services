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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartConfirmRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const nats_wrapper_1 = require("../nats-wrapper");
const shared_1 = require("../shared");
const cart_confirmed_publisher_1 = require("../events/publisher/cart-confirmed-publisher");
const migrateProducts_1 = require("../utils/migrateProducts");
const router = express_1.default.Router();
exports.cartConfirmRouter = router;
router.post("/cart/confirm", [
    (0, express_validator_1.body)("supplierId")
        .notEmpty()
        .isString()
        .withMessage("Supplier ID is required"),
], [
    (0, express_validator_1.body)("merchantId")
        .notEmpty()
        .isString()
        .withMessage("Merchant ID is required"),
], [
    (0, express_validator_1.body)("deliveryDate")
        .notEmpty()
        .isString()
        .withMessage("Delivery date is required"),
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const cart = yield shared_1.Cart.findOne({
            supplierId: req.body.supplierId,
            merchantId: req.body.merchantId,
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
            status: { $in: [shared_1.CartStatus.Created, shared_1.CartStatus.Returned] },
        }).session(session);
        if (!cart) {
            throw new core_1.NotFoundError();
        }
        cart.deliveryDate = req.body.deliveryDate;
        cart.status = shared_1.CartStatus.Pending;
        const preparedCart = yield (0, migrateProducts_1.migrateProducts)(cart);
        if (preparedCart.products && preparedCart.products.length > 0) {
            yield cart.save();
            const event = yield new cart_confirmed_publisher_1.CartConfirmedPublisher(nats_wrapper_1.natsWrapper.client).publish(cart);
            console.log("*************************** event", event, cart.id);
        }
        else {
            preparedCart.status = shared_1.CartStatus.Created;
        }
        yield session.commitTransaction();
        res.status(http_status_codes_1.StatusCodes.OK).send({ data: preparedCart });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Cart confirm operation failed", error);
        throw new core_1.BadRequestError("Cart confirm operation failed");
    }
    finally {
        session.endSession();
    }
}));
