import express from "express";
import {
  createProductController,
  getProductController,
  getSingleProductController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  searchProductController,
  realtedProductController,
  getAllProductController,
  adminFilterProductController,
} from "../controllers/productController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

import productModel from "../models/productModel.js";

// The formidable package is used to handle file uploads and form data parsing — particularly for multipart/form-data forms.
// When a form submits files (e.g., images, PDFs) or complex form data to your backend, it usually uses the multipart/form-data encoding type.
// The default body-parser middleware in Express cannot handle file uploads,
// so you need a special parser — that’s where formidable comes in.

import formidableMiddleware from "express-formidable";

const productRouter = express.Router();

// create product
productRouter.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidableMiddleware(), // parses multipart/form-data, adds req.fields & req.files
  createProductController
);

// update product routes
productRouter.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidableMiddleware(), // parses multipart/form-data, adds req.fields & req.files
  updateProductController
);

//get products for admin
productRouter.get("/get-product", requireSignIn, isAdmin, getProductController);

// Single product
productRouter.get("/get-product/:slug", getSingleProductController);

//delete
productRouter.delete("/delete/:pid", deleteProductController);

// filter product for homapage
productRouter.post("/product-filters", productFiltersController);

productRouter.post(
  "/admin-filter-products",
  requireSignIn,
  isAdmin,
  adminFilterProductController
);
// search route
productRouter.get("/search/:keyword", searchProductController);

// get Similar products
productRouter.get("/related-product/:pid/:cid", realtedProductController);

// NEW ROUTE: Get all products for public/general use (e.g., for cart stock check)
// ==============================================================================
productRouter.get("/get-all-products", getAllProductController);
// IMPORTANT: Notice this route does NOT have 'requireSignIn' or 'isAdmin' middleware,
// making it publicly accessible for fetching product details including stock.

export default productRouter;
