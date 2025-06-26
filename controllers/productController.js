import productModel from "../models/productModel.js";
import slugify from "slugify";
import cloudinary from "../config/cloudinary.js";

// Create Product Controller
export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    // Get the user ID from the request object (populated by requireSignIn middleware)
    const createdBy = req.user._id; // <--- ADD THIS LINE

    // Validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is Required" });
      case !description:
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !category:
        return res.status(400).send({ error: "Category is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res.status(400).send({ error: "Photo should be less than 1MB" });
    }

    let baseSlug = slugify(name, { lower: true, strict: true }); // Ensure consistent slug generation
    let productSlug = baseSlug;
    let counter = 1;

    // Check if slug already exists and append a number if it does
    while (await productModel.findOne({ slug: productSlug })) {
      productSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Upload to Cloudinary
    let uploadedPhoto = null;
    if (photo) {
      const result = await cloudinary.uploader.upload(photo.path, {
        folder: "ecommerce-products",
      });
      uploadedPhoto = result.secure_url;
    }

    const product = new productModel({
      name,
      slug: productSlug,
      description,
      price,
      category,
      quantity,
      shipping,
      photo: uploadedPhoto,
      createdBy: createdBy, // <--- ADD THIS LINE
    });

    await product.save();

    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).send({
      success: false,
      message: "Error while creating product",
      error: error.message,
    });
  }
};

// Get All Products for admin
export const getProductController = async (req, res) => {
  try {
    // req.user._id is populated by the requireSignIn middleware
    // This assumes your route is protected by requireSignIn and isAdmin
    const adminId = req.user._id;

    // Find products where the 'createdBy' field matches the current admin's ID
    const products = await productModel
      .find({ createdBy: adminId }) // <--- KEY CHANGE: Filter by createdBy
      .populate("category")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      total_products: products.length,
      message: `Products created by Admin ID: ${adminId}`,
      products,
    });
  } catch (error) {
    console.error("Error in getting admin's products:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting admin's products",
      error: error.message,
    });
  }
};

// Get Single Product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      // .select("-photo") // REMOVED: To include photo
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.error("Error while getting single product:", error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error: error.message,
    });
  }
};

// Delete Product
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid);
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.error("Error while deleting product:", error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error: error.message,
    });
  }
};

// Update Product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    // Validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is Required" });
      case !description:
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !category:
        return res.status(400).send({ error: "Category is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res.status(400).send({
          error: "Photo should be less than 1MB",
        });
    }

    let baseSlug = slugify(name, { lower: true, strict: true }); // Ensure consistent slug generation
    let productSlug = baseSlug;
    let counter = 1;

    // Check if slug already exists and append a number if it does
    while (await productModel.findOne({ slug: productSlug })) {
      productSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = await productModel.findByIdAndUpdate(
      req.params.pid,
      {
        ...req.fields,
        slug: productSlug,
      },
      { new: true }
    );

    if (photo) {
      const result = await cloudinary.uploader.upload(photo.path, {
        folder: "ecommerce_products",
      });
      product.photo = result.secure_url;
    }

    await product.save();

    res.status(200).send({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).send({
      success: false,
      message: "Error in updating product",
      error: error.message,
    });
  }
};

// `productFiltersController` (Includes Photos)**

export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio, keyword } = req.body;
    let query = {};

    // 1. Handle Keyword Search
    if (keyword && typeof keyword === "string" && keyword.trim() !== "") {
      console.log(`Backend filtering: Keyword search for "${keyword.trim()}"`);
      query.$or = [
        { name: { $regex: keyword.trim(), $options: "i" } },
        { description: { $regex: keyword.trim(), $options: "i" } },
      ];
    } else {
      console.log("Backend filtering: No keyword or empty keyword provided.");
    }

    // 2. Handle Category Filter
    if (checked && Array.isArray(checked) && checked.length > 0) {
      console.log(
        `Backend filtering: Filtering by categories: ${checked.join(", ")}`
      );
      query.category = { $in: checked };
    } else {
      console.log("Backend filtering: No categories selected.");
    }

    // 3. Handle Price Filter
    if (radio && Array.isArray(radio) && radio.length === 2) {
      console.log(
        `Backend filtering: Filtering by price range: ${radio[0]} - ${radio[1]}`
      );
      query.price = { $gte: radio[0], $lte: radio[1] };
    } else {
      console.log("Backend filtering: No price range selected.");
    }

    const products = await productModel
      .find(query)
      .populate("category")
      // .select("-photo") // REMOVED: To include photo
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      products,
      total_results: products.length,
      message: "Products filtered and/or searched successfully",
    });
  } catch (error) {
    console.error("Error while filtering/searching products:", error);
    res.status(500).send({
      success: false,
      message: "Error while filtering/searching products",
      error: error.message,
    });
  }
};

// controller/adminFilterProductController.js

export const adminFilterProductController = async (req, res) => {
  try {
    const { keyword } = req.body;
    const adminId = req.user._id; // from requireSignIn middleware

    let filter = {
      createdBy: adminId,
    };

    // Apply keyword search on name or description (if provided)
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    const products = await productModel
      .find(filter)
      .populate("category")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error filtering admin products:", error);
    res.status(500).send({
      success: false,
      message: "Error filtering admin products",
      error,
    });
  }
};

export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;

    if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
      console.log(
        "Search Product Controller: Empty or whitespace keyword received, returning all products."
      );
      const allProducts = await productModel.find({}).populate("category"); // REMOVED: .select("-photo")
      return res.json({
        success: true,
        products: allProducts,
        total_results: allProducts.length,
        message: "All products returned due to empty search keyword.",
      });
    }

    console.log(
      `Search Product Controller: Searching for keyword: "${keyword.trim()}"`
    );

    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword.trim(), $options: "i" } },
          { description: { $regex: keyword.trim(), $options: "i" } },
        ],
      })
      // .select("-photo") // REMOVED: To include photo
      .populate("category");

    res.json({
      success: true,
      products: results,
      total_results: results.length,
      message: `Found ${results.length} results for "${keyword.trim()}"`,
    });
  } catch (error) {
    console.error("Search Product API Error:", error);
    res.status(500).send({
      success: false,
      message: "Error while searching products (server-side issue)",
      error: error.message,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        // finds all produtcs matches with cid
        category: cid,
        // ne = not equal - exclude the product which matches with pid
        _id: { $ne: pid },
      })
      .limit(4)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while geting related product",
      error,
    });
  }
};

// NEW CONTROLLER: Get All Products for Public Access (for Cart stock checks etc.)
export const getAllProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .select("-photo") // Exclude photo to reduce payload size, as often not needed for just stock
      // .populate("category") // Optional: include if category info is needed
      .limit(1000); // Optional: Add a reasonable limit, or remove if you truly want ALL (be careful with very large inventories)
    // For a public facing cart stock check, you typically need just ID and stock.
    res.status(200).send({
      success: true,
      message: "All Products Fetched for Public Use",
      totalCount: products.length,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting all products for public access",
      error: error.message,
    });
  }
};
