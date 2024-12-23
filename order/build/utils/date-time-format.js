"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToUserTimezone = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const convertToUserTimezone = ({ date, userTimezone = "Asia/Ulaanbaatar", format = "YYYY-MM-DD HH:mm:ss", }) => {
    return moment_timezone_1.default.utc(date).tz(userTimezone).format(format);
};
exports.convertToUserTimezone = convertToUserTimezone;
