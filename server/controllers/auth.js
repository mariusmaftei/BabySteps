import User from "../models/Auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Register a new user
export const register = async (req, res) => {
  try {
    console.log("Register endpoint called with body:", req.body);

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    console.log("User created successfully:", newUser.id);

    try {
      // Check if JWT_SECRET exists
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined in environment variables");
        return res.status(500).json({
          message: "Server configuration error - JWT_SECRET not defined",
        });
      }

      // Create JWT token with simplified payload
      console.log(
        "Creating JWT token with secret:",
        process.env.JWT_SECRET ? "Secret exists" : "No secret found"
      );

      const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Verify the token to ensure it's valid
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token verified successfully:", decoded);

        // Return user data and token
        return res.status(201).json({
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            profileImage: newUser.profileImage || null,
          },
        });
      } catch (verifyError) {
        console.error("Token verification failed:", verifyError);
        return res.status(500).json({
          message: "Error verifying authentication token",
          error: verifyError.message,
        });
      }
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      return res.status(500).json({
        message: "Error generating authentication token",
        error: tokenError.message,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// Login a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token with simplified payload
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Verify the token
    try {
      jwt.verify(token, process.env.JWT_SECRET);

      // Return user data and token
      res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage || null,
        },
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(500).json({
        message: "Error verifying authentication token",
        error: verifyError.message,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error getting user data" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { username, email, profileImage } = req.body;

    // Find user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    // Return updated user
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || null,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};
