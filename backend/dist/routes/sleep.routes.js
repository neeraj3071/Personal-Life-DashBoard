"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const sleep_controller_1 = __importDefault(require("../controllers/sleep.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', sleep_controller_1.default.getSleepLogs.bind(sleep_controller_1.default));
router.post('/', sleep_controller_1.default.createSleepLog.bind(sleep_controller_1.default));
exports.default = router;
