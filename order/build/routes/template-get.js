"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.prepareTemplate = exports.templateGetRouter = void 0;
const _ = __importStar(require("lodash"));
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const shared_1 = require("../shared");
const product_1 = require("@ebazdev/product");
const customer_1 = require("@ebazdev/customer");
const inventory_1 = require("@ebazdev/inventory");
const promo_1 = require("@ebazdev/product/build/models/promo");
const mongoose_1 = require("mongoose");
const router = express_1.default.Router();
exports.templateGetRouter = router;
router.get("/template/get", [(0, express_validator_1.query)("id").notEmpty().isString().withMessage("ID is required")], [
    (0, express_validator_1.query)("merchantId")
        .notEmpty()
        .isString()
        .withMessage("Merchant ID is required"),
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const orderTemplate = yield shared_1.OrderTemplate.findById(req.query.id);
    if (orderTemplate) {
        const data = yield prepareTemplate(orderTemplate, new mongoose_1.Types.ObjectId(req.query.merchantId));
        res.status(http_status_codes_1.StatusCodes.OK).send({ data });
    }
    else {
        throw new Error("Select: template not found");
    }
}));
const prepareTemplate = (template, merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promises = _.map(template.products, (product, i) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            yield inventory_1.Inventory.find({ totalStock: 100 });
            yield promo_1.Promo.findOne({});
            try {
                const productPrice = yield product_1.Product.findOneWithAdjustedPrice({
                    query: { _id: new mongoose_1.Types.ObjectId(product.id) },
                    merchant: { merchantId: merchantId, businessTypeId: merchantId },
                });
                const price = productPrice._adjustedPrice
                    ? productPrice._adjustedPrice.price + productPrice._adjustedPrice.cost
                    : 0;
                return {
                    id: product.id,
                    name: productPrice.name,
                    images: productPrice.images,
                    description: productPrice.description,
                    quantity: product.quantity,
                    basePrice: price,
                    price,
                    giftQuantity: 0,
                    totalPrice: product.quantity * price,
                    stock: (_a = productPrice.inventory) === null || _a === void 0 ? void 0 : _a.availableStock,
                    inCase: productPrice.inCase,
                };
            }
            catch (error) {
                console.log("error", error);
                throw new Error("product not found");
            }
        }));
        const products = yield Promise.all(promises);
        const merchant = yield customer_1.Customer.findById(merchantId);
        const supplier = yield customer_1.Customer.findById(template.supplierId);
        return {
            id: template.id,
            products,
            type: template.type,
            merchant: { id: merchant === null || merchant === void 0 ? void 0 : merchant.id, name: merchant === null || merchant === void 0 ? void 0 : merchant.name },
            supplier: { id: supplier === null || supplier === void 0 ? void 0 : supplier.id, name: supplier === null || supplier === void 0 ? void 0 : supplier.name },
            name: template.name,
            image: template.image,
            color: template.color,
        };
    }
    catch (error) {
        console.log("error", error);
    }
});
exports.prepareTemplate = prepareTemplate;
