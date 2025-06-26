// const express = require("express");
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authrouter from "./routes/authRoute.js";
import path from "path";
// The cors package is used in the backend (typically with Node.js and Express) to handle Cross-Origin Resource Sharing (CORS),
//  which is a security feature enforced by web browsers.
// By default, browsers block requests made from one origin (domain/port/protocol) to a different origin for security reasons.
// This is called the Same-Origin Policy.
import cors from "cors";
import categoryRouter from "./routes/categoryRoutes.js";
import productRouter from "./routes/productRoutes.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// configure env
dotenv.config();

// database config
connectDB();

// rest object
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/v1/auth", authrouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter); // Your new order routes!

// rest api
app.get("/", (req, res) => {
  res.send({
    message: "welcome to ecommerce app",
  });
});

// static files for deployment
app.use(express.static(path.join(__dirname, "./client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// port
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("server running on port on " + PORT);
});
