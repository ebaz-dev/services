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
exports.templateListRouter = void 0;
const _ = __importStar(require("lodash"));
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const http_status_codes_1 = require("http-status-codes");
const template_get_1 = require("./template-get");
const mongoose_1 = require("mongoose");
const express_validator_1 = require("express-validator");
const shared_1 = require("../shared");
const router = express_1.default.Router();
exports.templateListRouter = router;
router.get("/template/list", [
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
    const criteria = {
        $or: [
            { merchantId: req.query.merchantId },
            { merchantId: { $exists: false } },
        ],
    };
    if (req.query.supplierId) {
        criteria.supplierId = req.query.supplierId;
    }
    const options = req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = yield (0, core_1.listAndCount)(criteria, shared_1.OrderTemplate, options);
    const promises = _.map(result.data, (template) => __awaiter(void 0, void 0, void 0, function* () {
        return (0, template_get_1.prepareTemplate)(template, new mongoose_1.Types.ObjectId(req.query.merchantId));
    }));
    const data = yield Promise.all(promises).then((items) => items.filter((n) => n));
    res.status(http_status_codes_1.StatusCodes.OK).send({
        data,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
    });
}));
