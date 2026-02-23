const accountService = require("./accountService");

const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await accountService.createUser(email, password);

    return res.status(201).json({
      uid: user.uid,
      email: user.email,
      balance: user.balance,
      status: user.status,
      negativeSince: user.negativeSince,
    });
  } catch (error) {
    console.error("Error in registerUser:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

const deposit = async (req, res) => {
  try {
    const { uid } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ error: "Amount must be a positive integer." });
    }

    const result = await accountService.deposit(uid, amount);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in deposit:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
const withdraw = async (req, res) => {
  try {
    const { uid } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ error: "Amount must be a positive integer." });
    }

    const result = await accountService.withdraw(uid, amount);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in withdraw:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
const getBalance = async (req, res) => {
  try {
    const { uid } = req.params;

    const userData = await accountService.getBalance(uid);

    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error in getBalance:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
const getTransactions = async (req, res) => {
  try {
    const { uid } = req.params;

    const transactions = await accountService.getTransactions(uid);

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error in getTransactions:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  deposit,
  withdraw,
  getBalance,
  getTransactions,
};
