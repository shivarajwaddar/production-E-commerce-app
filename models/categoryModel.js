import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.ObjectId,
      ref: "User", // ✅ Corrected here
      required: true,
    },
  },
  { timestamps: true }
);

// Optional indexes for performance
// categorySchema.index({ slug: 1 }, { unique: true });
// categorySchema.index({ name: 1 }, { unique: true });

export default mongoose.models.Category ||
  mongoose.model("Category", categorySchema);
