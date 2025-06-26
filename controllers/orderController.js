// controllers/orderController.js

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

// --- User-facing Controllers ---

export const placeOrderController = async (req, res) => {
  try {
    const { cartItems, totalAmount, paymentMethod } = req.body;
    const userId = req.user._id;

    // --- Server-side Validation and Data Enrichment ---
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).send({
        success: false,
        message: "Cart is empty. Cannot place order.",
      });
    }
    if (!paymentMethod) {
      return res
        .status(400)
        .send({ success: false, message: "Payment method is required." });
    }

    const user = await userModel.findById(userId);
    if (!user || !user.address) {
      return res.status(400).send({
        success: false,
        message:
          "Please update your delivery address in your profile before placing an order.",
      });
    }

    let calculatedTotal = 0;
    const productsForOrder = [];
    const productUpdates = [];

    for (const item of cartItems) {
      const productId = item.product?._id || item.product;
      if (!productId) {
        return res.status(400).send({
          success: false,
          message: "Invalid product ID found in cart.",
        });
      }

      const product = await productModel.findById(productId);
      if (!product) {
        return res.status(404).send({
          success: false,
          message: `Product not found: ${item.product?.name || productId}`,
        });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).send({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.quantity}`,
        });
      }

      const priceToUse = product.price;
      calculatedTotal += item.quantity * priceToUse;

      productsForOrder.push({
        product: product._id,
        quantity: item.quantity,
        priceAtAddition: priceToUse,
        name: product.name,
        photo: product.photo,
      });

      productUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { quantity: -item.quantity } },
        },
      });
    }

    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      console.warn(
        `Frontend total mismatch for user ${userId}. Frontend: ${totalAmount}, Backend: ${calculatedTotal}. Proceeding with backend calculated total.`
      );
    }

    const order = new orderModel({
      products: productsForOrder,
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" ? "pending" : "paid",
        transactionId: "N/A", // For actual payment gateways, this would be the real transaction ID
      },
      buyer: userId,
      totalAmount: calculatedTotal,
      shippingAddress: user.address,
      orderStatus: "Not Processed",
    });

    await order.save();

    if (productUpdates.length > 0) {
      await productModel.bulkWrite(productUpdates);
    }

    // IMPORTANT: Clear the user's cart in the database after successful order placement
    // Make sure your user model has a 'cart' field (e.g., an array of product IDs or objects)
    // If your cart is handled differently, you might remove or modify this line.
    await userModel.findByIdAndUpdate(userId, { cart: [] });

    res.status(200).send({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.error("Error in placeOrderController:", error);
    res.status(500).send({
      success: false,
      message: "Error placing order. Please try again.",
      error: error.message,
    });
  }
};

// Controller to get user's orders
export const getUserOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products.product", "createdBy") // Only populate createdBy from the product reference
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error in getUserOrdersController:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching user orders",
      error: error.message,
    });
  }
};

// --- Admin-facing Controllers ---

// GET All Orders Controller (for admin)
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("buyer", "name email") // Populate buyer's name and email
      .populate({
        path: "products.product", // Path to the product reference in the order schema
        select: "createdBy", // Only select 'createdBy' from the actual Product model
        populate: {
          path: "createdBy", // Nested populate: populate 'createdBy' field within the product
          select: "name", // Only select the 'name' field of the creator
        },
      })
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.status(200).send({
      success: true,
      message: "All Orders Fetched Successfully for Admin",
      orders,
    });
  } catch (error) {
    console.error("Error in getAllOrdersController:", error);
    res.status(500).send({
      success: false,
      message: "Error while getting all orders for admin",
      error: error.message,
    });
  }
};

// GET All Order Statuses (for admin to populate dropdowns)
export const getOrderStatusListController = (req, res) => {
  try {
    // Access the enum directly from the Mongoose schema
    const statuses = orderModel.schema.path("orderStatus").enumValues;
    res.status(200).send({
      success: true,
      message: "All order statuses fetched successfully",
      statuses,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error fetching order statuses",
      error,
    });
  }
};

// Update Order Status Controller (for admin)
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // 'status' here is the new value for 'orderStatus'

    // You might want to add validation here to ensure 'status' is one of the enum values
    const allowedStatuses = orderModel.schema.paths.orderStatus.enumValues;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).send({
        success: false,
        message: `Invalid order status. Allowed values are: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Order Status Updated Successfully",
      order,
    });
  } catch (error) {
    console.error("Error in orderStatusController:", error);
    res.status(500).send({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
};
