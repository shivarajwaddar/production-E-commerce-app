// controllers/categoryController.js
import categoryModel from "../models/categoryModel.js"; // Ensure correct path and capitalization
import slugify from "slugify";

// --- Create Category Controller ---
export const createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    // Get the admin ID from the req.user object, which is populated by requireSignIn middleware
    const createdBy = req.user._id;

    if (!name) {
      return res.status(400).send({ message: "Name is required" });
    }

    const existingCategory = await categoryModel.findOne({
      slug: slugify(name),
    });
    if (existingCategory) {
      return res.status(200).send({
        success: false,
        message: "Category already exists",
      });
    }

    // Create a new category and associate it with the admin's ID
    const category = await new categoryModel({
      name,
      slug: slugify(name),
      createdBy, // Store the ID of the admin who created this category
    }).save();

    res.status(201).send({
      success: true,
      message: "New category created",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating category",
    });
  }
};

export const categoryController = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    res.status(200).send({
      success: true,
      message: "All Categories List",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
};

// --- Get All Categories Controller for admin  ---
// This controller will now fetch ONLY categories created by the logged-in admin.
export const adminCategoriesController = async (req, res) => {
  try {
    // Get the logged-in admin's ID from req.user
    const adminId = req.user._id;

    // Find categories where the 'createdBy' field matches the current admin's ID
    const categories = await categoryModel.find({ createdBy: adminId });

    res.status(200).send({
      success: true,
      message: "All categories fetched successfully for this admin",
      category: categories, // Returning as 'category' to match your frontend's state expectation
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
};

// --- Update Category Controller ---
export const updateCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params; // Category ID from the URL
    const adminId = req.user._id; // Get the logged-in admin's ID

    if (!name) {
      return res.status(400).send({ message: "Name is required" });
    }

    // Find and update the category, ensuring it belongs to the logged-in admin
    const category = await categoryModel.findOneAndUpdate(
      { _id: id, createdBy: adminId }, // Query by category ID AND createdBy to ensure ownership
      { name, slug: slugify(name) },
      { new: true } // Return the updated document
    );

    if (!category) {
      // If no category is found with that ID AND createdBy, it means
      // either the ID is wrong, or the current admin doesn't own it.
      return res.status(404).send({
        success: false,
        message:
          "Category not found or you are not authorized to update this category",
      });
    }

    res.status(200).send({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while updating category",
    });
  }
};

// --- Delete Category Controller ---
export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params; // Category ID from the URL
    const adminId = req.user._id; // Get the logged-in admin's ID

    // Find and delete the category, ensuring it belongs to the logged-in admin
    const category = await categoryModel.findOneAndDelete({
      _id: id,
      createdBy: adminId,
    });

    if (!category) {
      // If no category is found with that ID AND createdBy, it means
      // either the ID is wrong, or the current admin doesn't own it.
      return res.status(404).send({
        success: false,
        message:
          "Category not found or you are not authorized to delete this category",
      });
    }

    res.status(200).send({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while deleting category",
    });
  }
};

// --- Single Category Controller ---
// This controller typically doesn't need to be filtered by admin ID
// unless you want to restrict viewing a single category to only the admin who created it.
// For most e-commerce applications, product pages might need to show categories created by any admin.
// If you *do* want to restrict it, you would add `requireSignIn, isAdmin` middleware to the route
// and add `createdBy: req.user._id` to the find query here.
export const singleCategoryController = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await categoryModel.findOne({ slug });

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Single category fetched successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting single category",
    });
  }
};
