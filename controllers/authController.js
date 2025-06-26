import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
// Assuming orderModel is defined somewhere if used in getOrdersController
// import orderModel from "../models/orderModel.js"; // Uncomment if you have an order model

// Helper function for password validation
const validatePassword = (password) => {
  // At least 7 characters
  if (password.length < 7) {
    return {
      isValid: false,
      message: "Password must be at least 7 characters long.",
    };
  }
  // Contains at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter.",
    };
  }
  // Contains at least one special character (using a common set of special characters)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character.",
    };
  }
  // Contains at least one number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number.",
    };
  }
  return { isValid: true, message: "Password is valid." };
};

// Register - Methode POST
const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer, role } = req.body;
    console.log(name, email, password);

    // Validation for all required fields
    if (!name) return res.send({ message: "Name is required" });
    if (!email) return res.send({ message: "Email is required" });
    if (!password) return res.send({ message: "Password is required" });
    if (!phone) return res.send({ message: "Phone is required" });
    if (!address) return res.send({ message: "Address is required" });
    if (!answer) return res.send({ message: "Answer is required" });

    // Validate password against defined criteria
    const { isValid, message: passwordValidationMessage } =
      validatePassword(password);
    if (!isValid) {
      return res.status(400).send({
        success: false,
        message: passwordValidationMessage,
      });
    }

    // Check Existing user
    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "user already exists please login",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Save User
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
      role, // Ensure role is handled appropriately, e.g., default 'user' if not provided
    }).save();

    res.status(201).send({
      success: true,
      message: "user registered successfully",
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "error in Registration",
      err,
    });
  }
};

// Login - Methode POST
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation check if email or password not found
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "invalid email or password",
      });
    }

    // If email found then we can check password match
    const user = await userModel.findOne({ email });

    // if user not found
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "user is not registered",
      });
    }

    // if user found then we compare password with hashed password
    const match = await comparePassword(password, user.password);

    // if not password match
    if (!match) {
      // For security, avoid giving specific "wrong password" vs "user not found" messages
      // A generic "invalid credentials" is often better. However, following your provided code's style.
      return res.status(404).send({
        success: false,
        message: "wrong password",
      });
    }

    // If email and password matched we will create Token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    res.status(200).send({
      success: true,
      message: "login succesfull",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "error in login",
      err,
    });
  }
};

// forgot password || post
const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }
    if (!answer) {
      return res.status(400).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      return res.status(400).send({ message: "New Password is required" });
    }

    // Validate new password against defined criteria
    const { isValid, message: passwordValidationMessage } =
      validatePassword(newPassword);
    if (!isValid) {
      return res.status(400).send({
        success: false,
        message: passwordValidationMessage,
      });
    }

    // check user existence and answer
    const user = await userModel.findOne({ email, answer });

    // Validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email or Answer",
      });
    }

    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });

    res.status(200).send({
      success: true,
      message: "Password Reset successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "Something went wrong during password reset",
      err,
    });
  }
};

const testcontroller = async (req, res) => {
  res.status(200).send("test controller");
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    // req.user._id is expected from your authentication middleware
    const user = await userModel.findById(req.user._id);

    //password validation for update if password is provided
    let hashedPassword = user.password; // Default to existing password
    if (password) {
      const { isValid, message: passwordValidationMessage } =
        validatePassword(password);
      if (!isValid) {
        return res.status(400).send({
          success: false,
          message: passwordValidationMessage,
        });
      }
      hashedPassword = await hashPassword(password);
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword, // Use the new hashed password or the existing one
        phone: phone || user.phone,
        address: address || user.address,
        // Email should generally not be updated this way unless specific verification is done
        // email: email || user.email, // Removed as email changes often require separate verification
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error While Update profile",
      error,
    });
  }
};

//orders (assuming orderModel exists and is imported)
export const getOrdersController = async (req, res) => {
  try {
    // Ensure orderModel is imported if you use this controller
    // const orders = await orderModel
    //   .find({ buyer: req.user._id })
    //   .populate("products")
    //   .populate("buyer", "name");
    // res.json(orders);
    res.status(500).send({
      success: false,
      message:
        "Order functionality not fully implemented or 'orderModel' not imported.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};

export {
  registerController,
  loginController,
  testcontroller,
  forgotPasswordController,
};
