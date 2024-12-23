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
exports.exportToExcel = exports.orderReportRouter = void 0;
const express_1 = __importDefault(require("express"));
const core_1 = require("@ebazdev/core");
const http_status_codes_1 = require("http-status-codes");
const shared_1 = require("../../shared");
const mongoose_1 = require("mongoose");
const xl = __importStar(require("excel4node"));
const date_time_format_1 = require("../../utils/date-time-format");
const router = express_1.default.Router();
exports.orderReportRouter = router;
router.get("/report", core_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = req.query;
    if (!options.sortBy) {
        options.sortBy = "updatedAzt";
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
    const aggregation = [
        { $match: criteria },
        {
            $lookup: {
                from: "customers",
                localField: "supplierId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            id: "$_id",
                            _id: 0,
                            name: 1,
                            phone: 1,
                            customerNo: 1,
                            logo: 1,
                        },
                    },
                ],
                as: "suppliers",
            },
        },
        {
            $lookup: {
                from: "customers",
                localField: "merchantId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            id: "$_id",
                            _id: 0,
                            name: 1,
                            phone: 1,
                            customerNo: 1,
                            logo: 1,
                            categoryId: 1,
                            address: 1,
                            cityId: 1,
                            districtId: 1,
                            subDistrictId: 1,
                        },
                    },
                ],
                as: "merchants",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            id: "$_id",
                            _id: 0,
                            name: 1,
                            phoneNumber: 1,
                            email: 1,
                        },
                    },
                ],
                as: "users",
            },
        },
        {
            $addFields: {
                supplier: { $arrayElemAt: ["$suppliers", 0] },
                merchant: { $arrayElemAt: ["$merchants", 0] },
                user: { $arrayElemAt: ["$users", 0] },
            },
        },
        {
            $lookup: {
                from: "customercategories",
                localField: "merchant.categoryId",
                foreignField: "_id",
                as: "merchantCategory",
            },
        },
        {
            $lookup: {
                from: "locations",
                localField: "merchant.cityId",
                foreignField: "_id",
                as: "merchantCity",
            },
        },
        {
            $lookup: {
                from: "locations",
                localField: "merchant.districtId",
                foreignField: "_id",
                as: "merchantDistrict",
            },
        },
        {
            $lookup: {
                from: "locations",
                localField: "merchant.subDistrictId",
                foreignField: "_id",
                as: "merchantSubdistrict",
            },
        },
        {
            $addFields: {
                "merchant.categoryName": {
                    $arrayElemAt: ["$merchantCategory.name", 0],
                },
                "merchant.cityName": {
                    $arrayElemAt: ["$merchantCity.name", 0],
                },
                "merchant.districtName": {
                    $arrayElemAt: ["$merchantDistrict.name", 0],
                },
                "merchant.subDistrictName": {
                    $arrayElemAt: ["$merchantSubDistrict.name", 0],
                },
            },
        },
        { $unwind: "$products" },
        {
            $lookup: {
                from: "products",
                localField: "products.id",
                foreignField: "_id",
                as: "_product",
            },
        },
        {
            $addFields: {
                product: {
                    $arrayElemAt: ["$_product", 0],
                },
            },
        },
        {
            $lookup: {
                from: "brands",
                localField: "product.brandId",
                foreignField: "_id",
                as: "_brand",
            },
        },
        {
            $addFields: {
                "product.brandName": {
                    $arrayElemAt: ["$_brand.name", 0],
                },
                "product.price": "$products.price",
                "product.basePrice": "$products.basePrice",
                "product.quantity": "$products.quantity",
            },
        },
        {
            $project: {
                id: "$_id",
                _id: 0,
                orderNo: 1,
                status: 1,
                product: 1,
                orderedAt: 1,
                deliveryDate: 1,
                deliveredAt: 1,
                paymentMethod: 1,
                thirdPartyId: 1,
                logs: 1,
                createdAt: 1,
                updatedAt: 1,
                supplier: 1,
                merchant: 1,
                user: 1,
            },
        },
        { $sort: { orderedAt: -1 } },
    ];
    const data = yield shared_1.Order.aggregate(aggregation);
    const excelFile = yield (0, exports.exportToExcel)(data);
    res.status(http_status_codes_1.StatusCodes.OK).send({ file: excelFile.toString("base64") });
    // res.status(StatusCodes.OK).send({ data });
}));
const exportToExcel = (orders) => __awaiter(void 0, void 0, void 0, function* () {
    const wb = new xl.Workbook({
        jszip: {
            compression: "DEFLATE",
        },
        defaultFont: {
            size: 12,
            name: "Calibri",
            color: "FFFFFFFF",
        },
    });
    const ws = wb.addWorksheet("Sheet 1");
    const baseStyle = {
        font: {
            color: "#000000",
            size: 12,
        },
        numberFormat: "#,##0.00; ($#,##0.00); -",
    };
    const normal = wb.createStyle(baseStyle);
    const bold = wb.createStyle(Object.assign(baseStyle, {
        font: {
            color: "#000000",
            bold: true,
            size: 12,
        },
    }));
    const styles = { normal, bold };
    const colHeaders = [
        "Order Number",
        "Product Name",
        "Barcode",
        "Brand",
        "Vendor",
        "Qty",
        "Price",
        "Total",
        "Final Total",
        "Completed At",
        "When to ship",
        "Receiver Phone",
        "Receiver name",
        "Business type",
        "State name",
        "District",
        "Quarter",
        "Address",
        "Status",
        "Latest note",
        "Main Category",
    ];
    let colIndex = 1;
    colHeaders.forEach((c) => {
        ws.cell(1, colIndex).string(c).style(styles.bold);
        colIndex++;
    });
    let index = 2;
    orders.forEach((order) => {
        const cols = [];
        cols.push(`${order.orderNo || ""}`);
        cols.push(`${order.product.name || ""}`);
        cols.push(`${order.product.barCode || ""}`);
        cols.push(`${order.product.brandName || ""}`);
        cols.push(`${order.supplier.name || ""}`);
        cols.push(`${order.product.quantity || ""}`);
        cols.push(`${order.product.price || ""}`);
        cols.push(`${order.product.price * order.product.quantity || ""}`);
        cols.push(`${order.product.price * order.product.quantity || ""}`);
        cols.push(`${order.orderedAt ? (0, date_time_format_1.convertToUserTimezone)({ date: order.orderedAt }) : ""}`);
        cols.push(`${order.deliveryDate
            ? (0, date_time_format_1.convertToUserTimezone)({
                date: order.deliveryDate,
                format: "YYYY-MM-DD",
            })
            : ""}`);
        cols.push(`${order.merchant.phone || ""}`);
        cols.push(`${order.merchant.name || ""}`);
        cols.push(`${order.merchant.categoryName || ""}`);
        cols.push(`${order.merchant.cityName || ""}`);
        cols.push(`${order.merchant.districtName || ""}`);
        cols.push(`${order.merchant.subDistrictName || ""}`);
        cols.push(`${order.merchant.address || ""}`);
        cols.push(`${order.status || ""}`);
        cols.push("");
        cols.push("");
        cols.forEach((c, i) => {
            ws.cell(index, i + 1)
                .string(c)
                .style(styles.normal);
        });
        index++;
    });
    return wb.writeToBuffer();
});
exports.exportToExcel = exportToExcel;
