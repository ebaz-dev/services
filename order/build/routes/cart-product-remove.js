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
exports.cartProductRemoveRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const shared_1 = require("../shared");
const router = express_1.default.Router();
exports.cartProductRemoveRouter = router;
router.post("/cart/product/remove", [
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
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        yield shared_1.Cart.updateOne({
            supplierId: req.body.supplierId,
            merchantId: req.body.merchantId,
            status: { $in: [shared_1.CartStatus.Created, shared_1.CartStatus.Returned] },
            "products.id": req.body.productId,
        }, {
            $pull: {
                products: {
                    id: req.body.productId,
                },
            },
        }).session(session);
        yield session.commitTransaction();
        res.status(http_status_codes_1.StatusCodes.OK).send();
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Product remove operation failed", error);
        throw new core_1.BadRequestError("product remove operation failed");
    }
    finally {
        session.endSession();
    }
}));
