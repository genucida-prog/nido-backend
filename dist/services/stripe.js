"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = exports.PRICES = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2025-02-24.acacia',
});
exports.stripe = stripe;
exports.PRICES = {
    silver: process.env.STRIPE_PRICE_SILVER || 'price_silver',
    gold: process.env.STRIPE_PRICE_GOLD || 'price_gold',
    platinum: process.env.STRIPE_PRICE_PLATINUM || 'price_platinum',
};
exports.default = stripe;
