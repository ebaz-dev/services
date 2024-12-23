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
exports.templateCreateRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const shared_1 = require("../shared");
const router = express_1.default.Router();
exports.templateCreateRouter = router;
router.post("/template/create", [
    (0, express_validator_1.body)("type")
        .notEmpty()
        .matches(/\b(?:supplier|merchant)\b/)
        .isString()
        .withMessage("Type is required"),
    (0, express_validator_1.body)("supplierId")
        .notEmpty()
        .isString()
        .withMessage("Supplier ID is required"),
    (0, express_validator_1.body)("products").notEmpty().isArray().withMessage("Products are required"),
    (0, express_validator_1.body)("name").notEmpty().isString().withMessage("Name is required"),
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { type, supplierId, merchantId, products, image, name, color } = req.body;
        const orderTemplate = new shared_1.OrderTemplate({
            type,
            supplierId,
            merchantId,
            products,
            image,
            name,
            color,
        });
        yield orderTemplate.save({ session });
        yield session.commitTransaction();
        res.status(http_status_codes_1.StatusCodes.CREATED).send(orderTemplate);
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Order template create operation failed", error);
        throw new core_1.BadRequestError("Order template create operation failed");
    }
    finally {
        session.endSession();
    }
}));
