import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.ObjectId,
    ref: "Product", // ✅ Matches "Product" model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  priceAtAddition: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.ObjectId,
      ref: "User", // ✅ Fixed: must match model name used in userModel.js
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    status: {
      type: String,
      enum: ["active", "converted", "abandoned"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for total cart price
cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce((total, item) => {
    return total + item.quantity * item.priceAtAddition;
  }, 0);
});

// Optional index for user cart uniqueness
// cartSchema.index({ user: 1 }, { unique: true });

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);
