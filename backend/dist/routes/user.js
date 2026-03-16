"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../controllers/user");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All user routes are protected
router.use(auth_1.authenticate);
router.get('/preferences', user_1.getPreferences);
router.post('/preferences', user_1.savePreferences);
exports.default = router;
//# sourceMappingURL=user.js.map