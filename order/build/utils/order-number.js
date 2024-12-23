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
exports.getOrderNumber = void 0;
const core_1 = require("@ebazdev/core");
const customer_1 = require("@ebazdev/customer");
const moment_1 = __importDefault(require("moment"));
const getOrderNumber = (supplierId, test) => __awaiter(void 0, void 0, void 0, function* () {
    let code = "EB";
    if (test) {
        code = "ebt";
    }
    const duration = (0, moment_1.default)().format("YYMMDD");
    const supplier = yield customer_1.Supplier.findById(supplierId);
    if (supplier && supplier.code) {
        code = supplier.code;
    }
    let sequence = yield core_1.Sequence.findOneAndUpdate({ code, duration }, { $inc: { seq: 1 } });
    if (!sequence) {
        yield core_1.Sequence.create({ code, duration, seq: 1 });
        sequence = yield core_1.Sequence.findOneAndUpdate({ code, duration }, { $inc: { seq: 1 } });
    }
    return `${code}${duration}${sequence.seq}`;
});
exports.getOrderNumber = getOrderNumber;
