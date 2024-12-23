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
exports.cartProductAddRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const shared_1 = require("../shared");
const migrateProducts_1 = require("../utils/migrateProducts");
const router = express_1.default.Router();
exports.cartProductAddRouter = router;
router.post("/cart/product/add", [
    (0, express_validator_1.body)("supplierId")
        .notEmpty()
        .isString()
        .withMessage("Supplier ID is required"),
    (0, express_validator_1.body)("merchantId")
        .notEmpty()
        .isString()
        .withMessage("Merchant ID is required"),
    (0, express_validator_1.body)("productId")
        .notEmpty()
        .isString()
        .withMessage("Product ID is required"),
    (0, express_validator_1.body)("quantity").notEmpty().isNumeric().withMessage("Quantity is required"),
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { supplierId, merchantId, quantity, productId } = req.body;
    const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
    const data = req.body;
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        let cart = yield shared_1.Cart.findOne({
            supplierId,
            merchantId,
            userId,
            status: {
                $in: [shared_1.CartStatus.Created, shared_1.CartStatus.Pending, shared_1.CartStatus.Returned],
            },
        }).session(session);
        if (!cart) {
            cart = new shared_1.Cart({
                status: shared_1.CartStatus.Created,
                supplierId,
                merchantId,
                userId: userId,
                products: [{ id: data.productId, quantity: 0 }],
            });
        }
        if (cart && cart.status === shared_1.CartStatus.Pending) {
            throw new core_1.BadRequestError("Card is waiting for inventory response");
        }
        const productIndex = cart.products.findIndex((product) => product.id.toString() === productId);
        if (productIndex !== -1) {
            // Update quantity if the product exists
            cart.products[productIndex].quantity += quantity;
            // Remove product if quantity is zero or less
            if (cart.products[productIndex].quantity <= 0) {
                cart.products.splice(productIndex, 1);
            }
        }
        if (productIndex === -1) {
            cart.products.push({
                id: data.productId,
                quantity: data.quantity,
            });
        }
        cart.status = shared_1.CartStatus.Created;
        yield cart.save({ session });
        // await new CartProductAddedPublisher(natsWrapper.client).publish({
        //   id: cart.id,
        //   productId: data.productId,
        //   quantity: data.quantity,
        //   updatedAt: new Date(),
        // });
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
