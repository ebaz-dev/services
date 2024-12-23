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
exports.orderBoGetRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const http_status_codes_1 = require("http-status-codes");
const shared_1 = require("../../shared");
const merge_products_1 = require("../../utils/merge-products");
const router = express_1.default.Router();
exports.orderBoGetRouter = router;
router.get("/:id", core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield shared_1.Order.findById(req.params.id)
        .populate({ path: "supplier", select: "name phone logo" })
        .populate({
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
    })
        .populate({ path: "user", select: "name phoneNumber email" })
        .populate({ path: "productDetails" })
        .populate({ path: "giftProductDetails" })
        .populate({ path: "logs" })
        .select({
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
    });
    if (!order) {
        throw new Error("order not found");
    }
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
    res.status(http_status_codes_1.StatusCodes.OK).send({ data: plainOrder });
}));
