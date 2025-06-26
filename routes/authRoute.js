import express from "express";
import {
  registerController,
  loginController,
  testcontroller,
  forgotPasswordController,
  updateProfileController,
  getOrdersController,
  // single,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

// Router object
const authrouter = express.Router();

// Routing
// Register || methode POST
authrouter.post("/register", registerController);

// Login || Methode POST
authrouter.post("/login", loginController);

// Forget password ||post

authrouter.post("/forgot-password", forgotPasswordController);

// Test routes
authrouter.get("/test", requireSignIn, isAdmin, testcontroller);

// protected route - user private.js
authrouter.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// protected route - Admin private.js
authrouter.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

//update profile
authrouter.put("/profile", requireSignIn, updateProfileController);

// Orders
authrouter.get("/orders", requireSignIn, getOrdersController);

export default authrouter;
