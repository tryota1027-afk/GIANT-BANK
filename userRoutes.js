const express = require("express");
const router = express.Router();
const userController = require("./userController");
const { verifyFirebaseToken } = require("./accountService");

// 新規ユーザー登録
router.post("/register", userController.registerUser);

// 入金API（認証必要）
router.post("/:uid/deposit", verifyFirebaseToken, userController.deposit);

// 引き出しAPI
router.post("/:uid/withdraw", verifyFirebaseToken, userController.withdraw);
// 残高確認API
router.get("/:uid/balance", verifyFirebaseToken, userController.getBalance);
// 履歴確認API
router.get("/:uid/transactions", verifyFirebaseToken, userController.getTransactions);

module.exports = router;
