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
exports.orderListRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const http_status_codes_1 = require("http-status-codes");
const shared_1 = require("../shared");
const router = express_1.default.Router();
exports.orderListRouter = router;
router.get("/list", core_1.validateRequest, core_1.currentUser, core_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const criteria = {};
    if (query.supplierId) {
        criteria.supplierId = query.supplierId;
    }
    if (query.merchantId) {
        criteria.merchantId = query.merchantId;
    }
    if (query.userId) {
        criteria.userId = query.userId;
    }
    if (query.status) {
        criteria.status = query.status;
        if (query.status === "pending") {
            criteria.status = { $in: [shared_1.OrderStatus.Created, shared_1.OrderStatus.Pending] };
            criteria.paymentMethod = shared_1.PaymentMethods.Cash;
        }
        else if (query.status === "paymentPending") {
            criteria.status = { $in: [shared_1.OrderStatus.Created, shared_1.OrderStatus.Pending] };
            criteria.paymentMethod = { $ne: shared_1.PaymentMethods.Cash };
        }
    }
    if (req.query.orderNo) {
        criteria.orderNo = {
            $regex: req.query.orderNo,
            $options: "i",
        };
    }
    if (query.paymentMethod) {
        criteria.paymentMethod = query.paymentMethod;
    }
    if (query.startDate) {
        criteria["createdAt"] = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
        if (query.startDate) {
            criteria["createdAt"] = {
                $gte: new Date(query.startDate),
                $lte: new Date(query.endDate),
            };
        }
        else {
            criteria["createdAt"] = { $lte: new Date(query.endDate) };
        }
    }
    const options = req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = yield (0, core_1.listAndCount)(criteria, shared_1.Order, options);
    res.status(http_status_codes_1.StatusCodes.OK).send(result);
}));
