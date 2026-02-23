// server.js
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// bodyをJSONとして扱う
app.use(express.json());

// userRoutes.jsを同じ階層に置く場合の読み込み
const userRoutes = require("./userRoutes");

// ルーティングを設定
app.use("/users", userRoutes);

// ルートのテスト
app.get("/", (req, res) => {
  res.send("API is running!");
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
