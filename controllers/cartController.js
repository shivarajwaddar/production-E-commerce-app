import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";

// Add item to cart
export const addToCartController = async (req, res) => {
  try {
    const userId = req.user._id; // Assumes req.user._id is set by your authentication middleware
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      // If no cart exists for the user, create a new one
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if the item already exists in the cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId // 'item.product' is likely an ObjectId here
    );

    if (existingItem) {
      // If item exists, just update the quantity
      existingItem.quantity += quantity;
    } else {
      // If item doesn't exist, add it to the cart
      cart.items.push({
        product: productId, // Store the product's ObjectId
        quantity,
        priceAtAddition: product.price, // Store price at the time of addition
      });
    }

    // Save the updated cart document to the database
    await cart.save();

    // ⭐ This is correct: Populate the 'product' field in the 'items' array
    // before sending the cart back to the frontend. This makes sure
    // item.product is a full object, including 'quantity' (stock).
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );

    // Send the populated cart back in the response
    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cart: populatedCart, // Send the fully populated cart
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to cart",
      error: error.message, // Send error message for better debugging
    });
  }
};

// Get the cart products for the logged-in user
export const getCartController = async (req, res) => {
  try {
    // This controller already correctly populates the product data
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart) {
      // If no cart found, return an empty cart structure
      return res.status(200).json({
        success: true,
        cart: { items: [] }, // Return a consistent structure
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// Remove item from cart
export const removeFromCartController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params; // Assuming productId is passed as a URL parameter

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const initialLength = cart.items.length;
    // Filter out the item to be removed
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === initialLength) {
      // If length hasn't changed, item wasn't found
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    await cart.save();

    // OPTIONAL BUT RECOMMENDED: Populate cart here too if you want the frontend
    // to immediately update with the removed item's full details (if needed elsewhere).
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: populatedCart, // Send the populated cart back
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({
      success: false,
      message: "Error removing item from cart",
      error: error.message,
    });
  }
};

// Controller function to update item quantity in cart
export const updateCartItemQuantityController = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body; // The new quantity from the frontend

    // Input validation
    if (!productId) {
      return res.status(400).send({
        success: false,
        message: "Product ID is required.",
      });
    }
    if (quantity === undefined || quantity < 0) {
      // Quantity can be 0 if removing
      return res.status(400).send({
        success: false,
        message: "Quantity must be a non-negative number.",
      });
    }

    // Find the user's cart
    // Assuming req.user is populated from an authentication middleware
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).send({
        success: false,
        message: "Cart not found for this user.",
      });
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      const productInStock = await Product.findById(productId);

      if (!productInStock) {
        // If product doesn't exist, remove it from cart
        cart.items.splice(itemIndex, 1);
        await cart.save();
        return res.status(404).send({
          success: false,
          message: "Product not found, removed from cart.",
          cart: cart, // Send back the updated cart
        });
      }

      // If new quantity is 0, remove the item
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1);
        await cart.save();
        // Populate the product details before sending back
        await cart.populate(
          "items.product",
          "name photo price description slug"
        );
        return res.status(200).send({
          success: true,
          message: "Item removed from cart.",
          cart: cart,
        });
      }

      // Check against product stock (if applicable)
      // This line is correct as it fetches productInStock from the Product model
      // and expects the stock field to be named 'quantity' in that model.
      if (productInStock.quantity < quantity) {
        return res.status(400).send({
          success: false,
          message: `Only ${productInStock.quantity} of ${productInStock.name} are available in stock.`,
        });
      }

      // Update the quantity
      cart.items[itemIndex].quantity = quantity;
      // You might also want to update priceAtAddition here if prices can change
      // cart.items[itemIndex].priceAtAddition = productInStock.price;
    } else {
      // If item not found in cart, it might be an error or a stale request
      return res.status(404).send({
        success: false,
        message: "Item not found in cart.",
      });
    }

    // Save the updated cart
    await cart.save();

    // Re-populate product details for the frontend response
    // This ensures the frontend gets full product data after update
    // This line will populate with 'quantity' if that's what your Product model uses
    await cart.populate(
      "items.product",
      "name photo price description slug quantity"
    ); // Added quantity here for consistency

    res.status(200).send({
      success: true,
      message: "Cart quantity updated successfully.",
      cart: cart,
    });
  } catch (error) {
    console.error("Error in updateCartItemQuantityController:", error);
    res.status(500).send({
      success: false,
      message: "Error while updating cart quantity.",
      error,
    });
  }
};

// NEW: Function to remove all items from a user's cart
export const removeAllCartItemsController = async (req, res) => {
  try {
    const userId = req.user._id; // User ID from authentication middleware

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // If no cart is found for the user, it's already "empty" from their perspective.
      return res.status(200).json({
        success: true,
        message: "No cart found or cart already empty for this user.",
      });
    }

    // Clear the items array
    cart.items = [];
    await cart.save(); // Save the updated cart with an empty items array

    res.status(200).json({
      success: true,
      message: "All items removed from cart successfully.",
      cart: cart, // Optionally return the updated cart to the client
    });
  } catch (error) {
    console.error("Error removing all cart items:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart.",
      error: error.message,
    });
  }
};
