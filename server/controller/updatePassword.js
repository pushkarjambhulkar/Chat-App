const User = require('../models/UserModel');
const bcrypt = require('bcrypt');

const updatePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Check if fields are provided
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email and new password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if new password is different from the old one
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password' });
        }

        // Password validation (min 8 chars, uppercase, lowercase, number, special char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        return res.status(500).json({ success: false, message: 'Error updating password' });
    }
};

module.exports = updatePassword;
