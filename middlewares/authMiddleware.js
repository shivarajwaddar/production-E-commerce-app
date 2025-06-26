import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

const requireSignIn = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).send("Token missing");

    const decode = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decode; // Make sure this includes _id
    next();
  } catch (err) {
    console.error(err);
    res.status(401).send("Invalid or expired token");
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user || user.role !== "admin") {
      return res.status(403).send({ success: false, message: "Access denied" });
    }
    next();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ success: false, message: "Error in admin middleware" });
  }
};

export { requireSignIn, isAdmin };
