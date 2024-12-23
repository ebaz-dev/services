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
exports.getMerchantTierDiscount = void 0;
const cola_integration_1 = require("@ebazdev/cola-integration");
const customer_1 = require("@ebazdev/customer");
const axios_1 = __importDefault(require("axios"));
const getMerchantTierDiscount = (tradeshopId, business, type) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (business === customer_1.HoldingBusinessCodes.AnunGoo) {
            const productsResponse = yield cola_integration_1.AnungooAPIClient.getClient().post(`/api/ebazaar/productremains`, {
                tradeshopid: parseInt(tradeshopId),
            });
            const merchantTierDiscount = ((_a = productsResponse === null || productsResponse === void 0 ? void 0 : productsResponse.data) === null || _a === void 0 ? void 0 : _a.shatlal) || [];
            const filteredList = merchantTierDiscount.filter((item) => {
                if (type === customer_1.HoldingBusinessTypeCodes.AGFood) {
                    return item.business === "AG_FOOD";
                }
                else if (type === customer_1.HoldingBusinessTypeCodes.AGNonFood) {
                    return item.business === "AG_NONFOOD";
                }
                else if (type === customer_1.HoldingBusinessTypeCodes.MGFood) {
                    return item.business === "MG_FOOD";
                }
                else if (type === customer_1.HoldingBusinessTypeCodes.MGNonFood) {
                    return item.business === "MG_NONFOOD";
                }
                else {
                    return false;
                }
            });
            return filteredList;
        }
        else {
            return [];
        }
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            return [];
        }
        else {
            console.error("Bas integration anungoo merchant shatlal get error:", error);
            return [];
        }
    }
});
exports.getMerchantTierDiscount = getMerchantTierDiscount;
