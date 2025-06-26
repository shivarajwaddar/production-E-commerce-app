import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      // This is confirmed as your stock field
      type: Number,
      required: true,
    },
    photo: {
      type: String,
    },
    shipping: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Optional indexes
// productSchema.index({ slug: 1 }, { unique: true });
// productSchema.index({ category: 1, price: 1 });

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
