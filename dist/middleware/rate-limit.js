"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
function rateLimitMiddleware(windowMs, limit) {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: limit,
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
    });
}
