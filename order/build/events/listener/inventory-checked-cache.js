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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryCheckedCacheListener = void 0;
const core_1 = require("@ebazdev/core");
const cola_status_log_1 = require("../../shared/models/cola-status-log");
const inventory_1 = require("@ebazdev/inventory");
class InventoryCheckedCacheListener extends core_1.Listener {
    constructor() {
        super(...arguments);
        this.subject = inventory_1.OrderInventoryEventSubjects.CartInventoryChecked;
        this.queueGroupName = "inventory-check-cache-service";
    }
    onMessage(data, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("******************", data);
            yield cola_status_log_1.ColaStatusLog.create({
                data: {
                    inventory: data,
                    timestamp: msg.getTimestamp(),
                },
            });
            msg.ack();
        });
    }
}
exports.InventoryCheckedCacheListener = InventoryCheckedCacheListener;
