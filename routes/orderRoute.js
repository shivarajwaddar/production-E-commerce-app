// routes/orderRoutes.js

import express from "express";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
import {
  placeOrderController,
  getUserOrdersController,
  getAllOrdersController,
  orderStatusController,
  getOrderStatusListController, // <-- NEW: Import the new controller
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// Route to place an order (user must be signed in)
orderRouter.post("/place-order", requireSignIn, placeOrderController);

// Route to get all orders for a logged-in user
orderRouter.get("/user-orders", requireSignIn, getUserOrdersController);

// Admin Order Routes
// GET all orders for admin
orderRouter.get("/all-orders", requireSignIn, isAdmin, getAllOrdersController);

// --- NEW: GET all order statuses for admin ---
orderRouter.get(
  "/order-statuses",
  requireSignIn,
  isAdmin,
  getOrderStatusListController
);

// UPDATE order status (Admin only)
orderRouter.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);

export default orderRouter;
