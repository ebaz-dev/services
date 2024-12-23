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
exports.orderCancelRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const nats_wrapper_1 = require("../nats-wrapper");
const shared_1 = require("../shared");
const order_cancelled_publisher_1 = require("../events/publisher/order-cancelled-publisher");
const order_log_1 = require("../shared/models/order-log");
const router = express_1.default.Router();
exports.orderCancelRouter = router;
router.post("/cancel", [(0, express_validator_1.body)("id").notEmpty().isString().withMessage("Order ID is required")], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const order = yield shared_1.Order.findOne({
            _id: req.body.id,
        }).session(session);
        if (!order) {
            throw new core_1.NotFoundError();
        }
        order.status = shared_1.OrderStatus.Cancelled;
        yield order_log_1.OrderLog.create({
            orderId: order.id,
            author: { id: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id },
            type: order_log_1.OrderLogType.Status,
            action: order_log_1.OrderActions.Cancelled,
        });
        yield order.save();
        yield new order_cancelled_publisher_1.OrderCancelledPublisher(nats_wrapper_1.natsWrapper.client).publish(order);
        yield session.commitTransaction();
        res.status(http_status_codes_1.StatusCodes.OK).send({ data: order });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("order cancel operation failed", error);
        throw new core_1.BadRequestError("order cancel operation failed");
    }
    finally {
        session.endSession();
    }
}));
