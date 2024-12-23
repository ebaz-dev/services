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
exports.cartGetSupplierRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const shared_1 = require("../shared");
const migrateProducts_1 = require("../utils/migrateProducts");
const router = express_1.default.Router();
exports.cartGetSupplierRouter = router;
router.get("/cart/get/supplier", [
    (0, express_validator_1.query)("supplierId")
        .notEmpty()
        .isString()
        .withMessage("Supplier ID is required"),
], [
    (0, express_validator_1.query)("merchantId")
        .notEmpty()
        .isString()
        .withMessage("Merchant ID is required"),
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const cart = yield shared_1.Cart.findOne({
            supplierId: req.query.supplierId,
            merchantId: req.query.merchantId,
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
            status: {
                $in: [shared_1.CartStatus.Created, shared_1.CartStatus.Pending, shared_1.CartStatus.Returned],
            },
        });
        if (cart) {
            const data = yield (0, migrateProducts_1.migrateProducts)(cart);
            res.status(http_status_codes_1.StatusCodes.OK).send({ data });
        }
        else {
            res.status(http_status_codes_1.StatusCodes.OK).send({ data: {} });
        }
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.OK).send({ data: {} });
    }
}));
