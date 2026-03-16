"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', auth_1.register);
router.post('/login', auth_1.login);
router.post('/refresh', auth_1.refresh);
router.post('/forgot-password', auth_1.forgotPassword);
router.post('/reset-password', auth_1.resetPassword);
// Protected routes (require valid access token)
router.post('/logout', auth_2.authenticate, auth_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map