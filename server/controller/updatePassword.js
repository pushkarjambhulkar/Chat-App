const UserModel = require("../models/UserModel");
const bcrypt = require("bcryptjs");

async function updatePassword(req, res) {
  try {
    // Get the email, newPassword, and confirmPassword from the request body
    const { email, newPassword, confirmPassword } = req.body;

    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
        success: false
      });
    }

    // Find the user by email
    const user = await UserModel.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    return res.json({
      message: "Password updated successfully",
      success: true
    });

  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      message: error.message || "Internal Server Error",
      success: false
    });
  }
}

module.exports = updatePassword;
