const express = require("express");
const userRoutes = require("./userRoutes");

const app = express();

app.use(express.json());

app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Virtual Bank API running...");
});

module.exports = app;
