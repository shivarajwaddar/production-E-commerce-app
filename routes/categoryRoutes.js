import express from "express";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
import {
  createCategoryController,
  updateCategoryController,
  adminCategoriesController,
  singleCategoryController,
  deleteCategoryController,
  categoryController,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

//routes
// create Category
categoryRouter.post(
  "/create-category",
  requireSignIn,
  isAdmin,
  createCategoryController
);

// getAll Category for homapage
categoryRouter.get("/categories", categoryController);

// getAll category for adminDashboard
categoryRouter.get(
  "/admin-categories",
  requireSignIn,
  isAdmin,
  adminCategoriesController
);

// update category
categoryRouter.put(
  "/update-category/:id",
  requireSignIn,
  isAdmin,
  updateCategoryController
);

//single category
categoryRouter.get("/single-category/:slug", singleCategoryController);

//delete category
categoryRouter.delete(
  "/delete-category/:id",
  requireSignIn,
  isAdmin,
  deleteCategoryController
);

// update Category
export default categoryRouter;
