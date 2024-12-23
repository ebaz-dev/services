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
exports.app = void 0;
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const body_parser_1 = require("body-parser");
const core_1 = require("@ebazdev/core");
const cookie_session_1 = __importDefault(require("cookie-session"));
const dotenv = __importStar(require("dotenv"));
const cart_get_1 = require("./routes/cart-get");
const cart_list_1 = require("./routes/cart-list");
const cart_product_add_1 = require("./routes/cart-product-add");
const cart_confirm_1 = require("./routes/cart-confirm");
const cart_product_remove_1 = require("./routes/cart-product-remove");
const order_get_1 = require("./routes/order-get");
const order_list_1 = require("./routes/order-list");
const cart_get_by_supplier_1 = require("./routes/cart-get-by-supplier");
const order_cancel_1 = require("./routes/order-cancel");
const order_deliver_1 = require("./routes/order-deliver");
const cart_get_order_1 = require("./routes/cart-get-order");
const order_update_payment_method_1 = require("./routes/order-update-payment-method");
const template_create_1 = require("./routes/template-create");
const template_update_1 = require("./routes/template-update");
const template_delete_1 = require("./routes/template-delete");
const template_get_1 = require("./routes/template-get");
const template_list_1 = require("./routes/template-list");
const cart_products_add_1 = require("./routes/cart-products-add");
const health_1 = require("./routes/health");
const list_1 = require("./routes/backoffice/list");
const get_1 = require("./routes/backoffice/get");
const check_merchant_debt_1 = require("./routes/check-merchant-debt");
const report_1 = require("./routes/backoffice/report");
dotenv.config();
const apiPrefix = "/api/v1/order";
const backofficePrefix = "/api/v1/order/bo";
const app = (0, express_1.default)();
exports.app = app;
app.set("trust proxy", true);
app.use((0, body_parser_1.json)());
app.use((0, cookie_session_1.default)({
    signed: true,
    secure: process.env.NODE_ENV !== "test",
    keys: [process.env.JWT_KEY],
}));
app.use(core_1.currentUser);
app.use((0, core_1.accessLogger)("order"));
app.use(apiPrefix, health_1.healthRouter);
app.use(apiPrefix, cart_confirm_1.cartConfirmRouter);
app.use(apiPrefix, cart_get_1.cartGetRouter);
app.use(apiPrefix, cart_get_by_supplier_1.cartGetSupplierRouter);
app.use(apiPrefix, cart_list_1.cartListRouter);
app.use(apiPrefix, cart_product_add_1.cartProductAddRouter);
app.use(apiPrefix, cart_products_add_1.cartProductsAddRouter);
app.use(apiPrefix, cart_product_remove_1.cartProductRemoveRouter);
app.use(apiPrefix, cart_get_order_1.cartGetOrderRouter);
app.use(apiPrefix, order_cancel_1.orderCancelRouter);
app.use(apiPrefix, order_deliver_1.orderDeliverRouter);
app.use(apiPrefix, order_get_1.orderGetRouter);
app.use(apiPrefix, order_list_1.orderListRouter);
app.use(apiPrefix, order_update_payment_method_1.orderUpdatePaymentMethodRouter);
app.use(apiPrefix, template_create_1.templateCreateRouter);
app.use(apiPrefix, template_update_1.templateUpdateRouter);
app.use(apiPrefix, template_delete_1.templateDeleteRouter);
app.use(apiPrefix, template_get_1.templateGetRouter);
app.use(apiPrefix, template_list_1.templateListRouter);
app.use(apiPrefix, check_merchant_debt_1.merchantDebtRouter);
// backoffice
app.use(backofficePrefix, list_1.orderBoListRouter);
app.use(backofficePrefix, report_1.orderReportRouter);
app.use(backofficePrefix, get_1.orderBoGetRouter);
app.all("*", () => __awaiter(void 0, void 0, void 0, function* () {
    throw new core_1.NotFoundError();
}));
app.use(core_1.errorHandler);
