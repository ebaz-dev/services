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
exports.cartListRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const http_status_codes_1 = require("http-status-codes");
const shared_1 = require("../shared");
const express_validator_1 = require("express-validator");
const lodash_1 = __importDefault(require("lodash"));
const migrateProducts_1 = require("../utils/migrateProducts");
const router = express_1.default.Router();
exports.cartListRouter = router;
router.get("/cart/list", [
    (0, express_validator_1.query)("merchantId")
        .notEmpty()
        .isString()
        .withMessage("Merchant ID is required"),
], core_1.currentUser, core_1.requireAuth, core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const criteria = {
        products: { $exists: true, $ne: [] },
        merchantId: req.query.merchantId,
        userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
        status: { $in: [shared_1.CartStatus.Created, shared_1.CartStatus.Returned] }
    };
    if (req.query.supplierId) {
        criteria.supplierId = req.query.supplierId;
    }
    const options = req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = yield (0, core_1.listAndCount)(criteria, shared_1.Cart, options);
    const promises = lodash_1.default.map(result.data, (cart) => __awaiter(void 0, void 0, void 0, function* () {
        return (0, migrateProducts_1.migrateProducts)(cart);
    }));
    const data = yield Promise.all(promises);
    res.status(http_status_codes_1.StatusCodes.OK).send({ data, total: result.total, totalPages: result.totalPages, currentPage: result.currentPage });
}));
