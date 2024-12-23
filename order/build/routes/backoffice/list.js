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
exports.orderBoListRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const http_status_codes_1 = require("http-status-codes");
const shared_1 = require("../../shared");
const mongoose_1 = require("mongoose");
const merge_products_1 = require("../../utils/merge-products");
const router = express_1.default.Router();
exports.orderBoListRouter = router;
router.get("/", core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = req.query;
    if (!options.sortBy) {
        options.sortBy = "orderedAt";
    }
    if (!options.sortDir) {
        options.sortDir = -1;
    }
    const filter = req.query.filter || {};
    const criteria = {};
    if (filter.supplierId) {
        criteria.supplierId = new mongoose_1.Types.ObjectId(filter.supplierId);
    }
    if (filter.merchantId) {
        criteria.merchantId = new mongoose_1.Types.ObjectId(filter.merchantId);
    }
    if (filter.userId) {
        criteria.userId = new mongoose_1.Types.ObjectId(filter.userId);
    }
    if (filter.status) {
        criteria.status = filter.status;
    }
    if (filter.orderNo) {
        criteria.orderNo = {
            $regex: filter.orderNo,
            $options: "i",
        };
    }
    if (filter.paymentMethod) {
        criteria.paymentMethod = filter.paymentMethod;
    }
    if (filter.startDate) {
        criteria.orderedAt = { $gte: new Date(filter.startDate) };
    }
    if (filter.endDate) {
        if (filter.startDate) {
            criteria.orderedAt = {
                $gte: new Date(filter.startDate),
                $lte: new Date(filter.endDate),
            };
        }
        else {
            criteria.orderedAt = { $lte: new Date(filter.endDate) };
        }
    }
    if (filter.deliveryStartDate) {
        criteria.deliveryDate = { $gte: new Date(filter.deliveryStartDate) };
    }
    if (filter.deliveryEndDate) {
        if (filter.deliveryStartDate) {
            criteria.deliveryDate = {
                $gte: new Date(filter.deliveryStartDate),
                $lte: new Date(filter.deliveryEndDate),
            };
        }
        else {
            criteria.deliveryDate = { $lte: new Date(filter.deliveryEndDate) };
        }
    }
    options.populates = [
        { path: "supplier", select: "name phone logo" },
        {
            path: "merchant",
            select: "name phone logo categoryId cityId districtId subDistrictId address",
            populate: [
                {
                    path: "category",
                },
                {
                    path: "city",
                },
                {
                    path: "district",
                },
                {
                    path: "subDistrict",
                },
            ],
        },
        { path: "user", select: "name phoneNumber email" },
        { path: "productDetails" },
        { path: "giftProductDetails" },
        {
            path: "logs",
            populate: [
                {
                    path: "user",
                },
            ],
        },
    ];
    options.columns = {
        orderNo: 1,
        status: 1,
        supplierId: 1,
        merchantId: 1,
        userId: 1,
        products: 1,
        giftProducts: 1,
        orderedAt: 1,
        deliveryDate: 1,
        deliveredAt: 1,
        paymentMethod: 1,
        updatedAt: 1,
        createdAt: 1,
        logs: 1,
    };
    const result = yield (0, core_1.listAndCount)(criteria, shared_1.Order, options);
    result.data = result.data.map((order) => {
        const plainOrder = order.toJSON();
        plainOrder.products = (0, merge_products_1.mergeProducts)(plainOrder.products || [], plainOrder.productDetails || []);
        plainOrder.giftProducts = (0, merge_products_1.mergeProducts)(plainOrder.giftProducts || [], plainOrder.giftProductDetails || []);
        let totalPrice = 0;
        let totalBasePrice = 0;
        plainOrder.products.map((product) => {
            if (product) {
                totalPrice += product.totalPrice;
                totalBasePrice += product.totalBasePrice;
            }
        });
        plainOrder.totalPrice = totalPrice;
        plainOrder.totalBasePrice = totalBasePrice;
        plainOrder.totalDiscountAmount = totalBasePrice - totalPrice;
        plainOrder.discountPercent =
            (plainOrder.totalDiscountAmount / totalBasePrice) * 100;
        delete plainOrder.productDetails;
        delete plainOrder.giftProductDetails;
        return plainOrder;
    });
    res.status(http_status_codes_1.StatusCodes.OK).send(result);
}));
