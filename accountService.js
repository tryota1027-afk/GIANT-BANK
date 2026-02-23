const { auth, db } = require("./firebase");

// --- Firebaseトークン認証ミドルウェア ---
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = header.split(" ")[1];
    const decoded = await auth.verifyIdToken(idToken);
    req.uidFromToken = decoded.uid;

    // トークンのuidとパラメータuidを一致チェック
    if (req.params.uid !== req.uidFromToken) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  } catch (err) {
    console.error("verifyFirebaseToken error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// --- 新規ユーザー作成 ---
const createUser = async (email, password) => {
  const userRecord = await auth.createUser({ email, password });
  const uid = userRecord.uid;

  const userData = {
    email,
    balance: 0,            // 初期残高
    status: "active",
    negativeSince: null,
    createdAt: new Date(),
  };

  await db.collection("users").doc(uid).set(userData);

  return { uid, ...userData };
};

// --- deposit ---
const deposit = async (uid, amount) => {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) throw new Error("User not found");

  const userData = userSnap.data();
  let negativeSince = userData.negativeSince;

  const newBalance = userData.balance + amount;

  // マイナス状態から回復したら negativeSince リセット
  if (newBalance >= 0 && userData.negativeSince) {
    negativeSince = null;
  }

  // 口座凍結チェック
  const status = await checkFreeze(uid, newBalance, negativeSince, userData.status);

  await userRef.update({
    balance: newBalance,
    negativeSince,
    status,
  });

  // transaction履歴作成
  const transactionRef = db.collection("transactions").doc();
  await transactionRef.set({
    uid,
    type: "deposit",
    amount,
    balanceAfter: newBalance,
    createdAt: new Date(),
  });

  return {
    uid,
    balance: newBalance,
    status,
    negativeSince,
  };
};

// --- withdraw ---
const withdraw = async (uid, amount) => {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) throw new Error("User not found");

  const userData = userSnap.data();

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  let newBalance = userData.balance - amount;
  let negativeSince = userData.negativeSince;

  // マイナス開始日時の設定
  if (newBalance < 0 && !userData.negativeSince) {
    negativeSince = new Date();
  }

  // 口座凍結チェック
  const status = await checkFreeze(uid, newBalance, negativeSince, userData.status);

  await userRef.update({
    balance: newBalance,
    negativeSince,
    status,
  });

  // transaction履歴作成
  const transactionRef = db.collection("transactions").doc();
  await transactionRef.set({
    uid,
    type: "withdraw",
    amount,
    balanceAfter: newBalance,
    createdAt: new Date(),
  });

  return {
    uid,
    balance: newBalance,
    status,
    negativeSince,
  };
};

// --- balance取得 ---
const getBalance = async (uid) => {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) throw new Error("User not found");

  const userData = userSnap.data();

  return {
    uid,
    email: userData.email,
    balance: userData.balance,
    status: userData.status,
    negativeSince: userData.negativeSince,
  };
};

// --- 口座凍結チェック ---
const checkFreeze = async (uid, currentBalance, negativeSince, status) => {
  if (status === "frozen") return status; // 既に凍結ならそのまま

  if (currentBalance < 0 && negativeSince) {
    const now = new Date();
    const negativeDate = negativeSince.toDate ? negativeSince.toDate() : new Date(negativeSince);
    const diffMs = now - negativeDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays >= 7) {
      // 凍結
      await db.collection("users").doc(uid).update({ status: "frozen" });
      return "frozen";
    }
  }

  return status; // 変更なし
};
// ユーザーの入出金履歴取得
const getTransactions = async (uid) => {
  const transRef = db.collection("transactions").where("uid", "==", uid).orderBy("createdAt", "desc");
  const snapshot = await transRef.get();

  if (snapshot.empty) return [];

  const transactions = [];
  snapshot.forEach(doc => {
    transactions.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return transactions;
};

module.exports = {
  createUser,
  deposit,
  withdraw,
  getBalance,
  getTransactions,
  verifyFirebaseToken,
};
