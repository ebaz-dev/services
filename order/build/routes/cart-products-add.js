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
exports.cartProductsAddRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importStar(require("mongoose"));
const nats_wrapper_1 = require("../nats-wrapper");
const shared_1 = require("../shared");
const cart_product_added_publisher_1 = require("../events/publisher/cart-product-added-publisher");
const migrateProducts_1 = require("../utils/migrateProducts");
const router = express_1.default.Router();
exports.cartProductsAddRouter = router;
router.post("/cart/products/add", [
    (0, express_validator_1.body)("supplierId")
        .notEmpty()
        .isString()
        .withMessage("Supplier ID is required"),
    (0, express_validator_1.body)("merchantId")
        .notEmpty()
        .isString()
        .withMessage("Merchant ID is required"),
    (0, express_validator_1.body)("products").notEmpty().isArray().withMessage("Products are required"),
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    const data = req.body;
    try {
        let cart = yield shared_1.Cart.findOne({
            supplierId: data.supplierId,
            merchantId: data.merchantId,
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
            status: {
                $in: [shared_1.CartStatus.Created, shared_1.CartStatus.Pending, shared_1.CartStatus.Returned],
            },
        }).session(session);
        if (cart) {
            if (cart.status === shared_1.CartStatus.Pending) {
                throw new Error("Processing cart to order!");
            }
            cart.products = data.products;
            yield cart.save();
        }
        else {
            cart = yield shared_1.Cart.create({
                status: shared_1.CartStatus.Created,
                supplierId: data.supplierId,
                merchantId: data.merchantId,
                userId: new mongoose_1.Types.ObjectId((_b = req.currentUser) === null || _b === void 0 ? void 0 : _b.id),
                products: data.products,
            });
        }
        yield new cart_product_added_publisher_1.CartProductAddedPublisher(nats_wrapper_1.natsWrapper.client).publish({
            id: cart.id,
            products: data.products,
            updatedAt: new Date(),
        });
        cart = yield (0, migrateProducts_1.migrateProducts)(cart);
        yield session.commitTransaction();
        res.status(http_status_codes_1.StatusCodes.OK).send({ data: cart });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Product add operation failed", error);
        throw new core_1.BadRequestError("product add operation failed");
    }
    finally {
        session.endSession();
    }
}));
