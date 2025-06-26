import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import connectDB from "./config/db.js";
import authrouter from "./routes/authRoute.js";
import categoryRouter from "./routes/categoryRoutes.js";
import productRouter from "./routes/productRoutes.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// ---------------------
// Environment Variables
// ---------------------
dotenv.config();

// ---------------------
// Database Connection
// ---------------------
connectDB();

// ---------------------
// Initialize App
// ---------------------
const app = express();

// ---------------------
// Middleware
// ---------------------
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ---------------------
// API Routes
// ---------------------
app.use("/api/v1/auth", authrouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);

// ---------------------
// Root Route
// ---------------------
app.get("/", (req, res) => {
  res.send({
    message: "Welcome to ecommerce app",
  });
});

// ---------------------
// Static Files (Deployment)
// ---------------------

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from client/build
app.use(express.static(path.join(__dirname, "./client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// ---------------------
// Server Start
// ---------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
