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
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const nats_wrapper_1 = require("./nats-wrapper");
const inventory_checked_listener_1 = require("./events/listener/inventory-checked-listener");
const invoice_paid_listener_1 = require("./events/listener/invoice-paid-listener");
const cola_order_status_1 = require("./events/listener/cola-order-status");
const auth_1 = require("@ebazdev/auth");
const customer_1 = require("@ebazdev/customer");
const cola_order_status_cache_1 = require("./events/listener/cola-order-status-cache");
const cart_confirm_cache_1 = require("./events/listener/cart-confirm-cache");
const inventory_checked_cache_1 = require("./events/listener/inventory-checked-cache");
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.PORT) {
        throw new Error("PORT must be defined");
    }
    if (!process.env.JWT_KEY) {
        throw new Error("JWT_KEY must be defined");
    }
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be defined");
    }
    if (!process.env.NATS_CLIENT_ID) {
        throw new Error("NATS_CLIENT_ID must be defined");
    }
    if (!process.env.NATS_URL) {
        throw new Error("NATS_URL must be defined");
    }
    if (!process.env.NATS_CLUSTER_ID) {
        throw new Error("NATS_CLUSTER_ID must be defined");
    }
    if (!process.env.NATS_USER) {
        throw new Error("NATS_USER must be defined");
    }
    if (!process.env.NATS_PASS) {
        throw new Error("NATS_PASS must be defined");
    }
    try {
        yield nats_wrapper_1.natsWrapper.connect(process.env.NATS_CLUSTER_ID, process.env.NATS_CLIENT_ID, process.env.NATS_URL, process.env.NATS_USER, process.env.NATS_PASS);
        nats_wrapper_1.natsWrapper.client.on("close", () => {
            console.log("NATS connection closed!");
            process.exit();
        });
        process.on("SIGINT", () => nats_wrapper_1.natsWrapper.client.close());
        process.on("SIGTERM", () => nats_wrapper_1.natsWrapper.client.close());
        new inventory_checked_listener_1.CartInventoryCheckedListener(nats_wrapper_1.natsWrapper.client).listen();
        new invoice_paid_listener_1.InvoicePaidListener(nats_wrapper_1.natsWrapper.client).listen();
        new cola_order_status_1.ColaOrderStatusReceivedListener(nats_wrapper_1.natsWrapper.client).listen();
        new cola_order_status_cache_1.ColaStatusLogCacheListener(nats_wrapper_1.natsWrapper.client).listen();
        new cart_confirm_cache_1.CartConfirmCacheListener(nats_wrapper_1.natsWrapper.client).listen();
        new inventory_checked_cache_1.InventoryCheckedCacheListener(nats_wrapper_1.natsWrapper.client).listen();
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        mongoose_1.default.model("User", auth_1.User.schema);
        mongoose_1.default.model("Customer", customer_1.Customer.schema);
        mongoose_1.default.model("CustomerCategory", customer_1.CustomerCategory.schema);
        mongoose_1.default.model("Location", customer_1.Location.schema);
        console.log("Connected to DB");
    }
    catch (err) {
        console.error(err);
    }
    app_1.app.listen(process.env.PORT, () => {
        console.log(`Listening on port ${process.env.PORT}!!!!!!!!!!`);
    });
});
start();
