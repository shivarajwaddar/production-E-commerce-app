import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  addToCartController,
  getCartController,
  removeFromCartController,
  updateCartItemQuantityController,
  removeAllCartItemsController, // Import the new controller
} from "../controllers/cartController.js";

// Router object
const cartRouter = express.Router();

// Add item to cart (protected route)
cartRouter.post("/add-item", requireSignIn, addToCartController);

// get the cart products for the logged in user- used for header cart-count
cartRouter.get("/get", requireSignIn, getCartController);

// ✅ Remove specific item from cart
cartRouter.delete(
  "/remove-item/:productId",
  requireSignIn,
  removeFromCartController
);

// ✅ Update quantity of an item in the cart
cartRouter.put(
  "/update-quantity/:productId",
  requireSignIn, // Apply authentication middleware
  updateCartItemQuantityController
);

// ✅ New: Remove ALL items from cart (clear the cart array)
// This route will call the removeAllCartItemsController
cartRouter.delete(
  "/clear-all", // A clear, distinct endpoint for clearing the entire cart
  requireSignIn,
  removeAllCartItemsController
);

export default cartRouter;
