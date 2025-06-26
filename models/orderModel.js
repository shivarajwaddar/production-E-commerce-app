// models/orderModel.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        priceAtAddition: {
          type: Number,
          required: true,
        },
        name: String,
        photo: String,
      },
    ],
    payment: {
      method: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        default: "pending",
      },
      transactionId: String,
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "User",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Refunded",
      ], // <-- This is perfect!
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
