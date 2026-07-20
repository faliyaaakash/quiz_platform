import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User from '../models/userModel.js';
import sendEmail from '../utils/sendEmail.js';
import { error } from 'console';
// Initialize Google OAuth client only if Client ID is provided
const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
// Fetch the secret key used to sign JWT tokens. If not found in .env, use a fallback string
const JWT_SECRET = process.env.JWT_SECRET;
/**
 * Handle Google Login/Signup
 */
export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!client) {
            res.status(400).json({ message: 'Google authentication is currently disabled on this server.' });
            return;
        }
        // Verify the ID token using the Google Auth Library using our Client ID
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        // Extract user data payload after verification
        const payload = ticket.getPayload();
        if (!payload) {
            res.status(400).json({ message: 'Invalid Google token' });
            return;
        }
        const { email, name, picture } = payload;
        // Check if an account with this email already exists in our database
        let user = await User.findOne({ email });
        if (!user) {
            // Create user for first-time Google sign-in
            // Generate a random secure password for them since authentication is handled via Google
            user = new User({
                fullName: name,
                email: email,
                password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
                avatar: picture,
                isEmailVerified: true // Auto-verify email because Google verified it
            });
            await user.save();
            // Send Welcome Email to new Google user
            const welcomeSubject = 'Welcome to Quiz App!';
            const welcomeText = `Hi ${user.fullName},\n\nWelcome to Quiz App! We're excited to have you on board. You can now create and take quizzes to test your knowledge.\n\nBest regards,\nThe Quiz App Team`;
            const welcomeHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4F46E5; text-align: center;">Welcome to Quiz App!</h2>
                    <p>Hi <strong>${user.fullName}</strong>,</p>
                    <p>We're absolutely thrilled to have you join our community!</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;">With Quiz App, you can:</p>
                        <ul style="color: #374151;">
                            <li>Create custom quizzes with ease</li>
                            <li>Take challenging assessments</li>
                            <li>Analyze your performance with detailed reports</li>
                        </ul>
                    </div>
                    <p>Ready to get started? Head over to your dashboard and create your first quiz!</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                    </div>
                    <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">Best regards,<br>The Quiz App Team</p>
                </div>
            `;
            try {
                await sendEmail(user.email, welcomeSubject, welcomeText, welcomeHtml);
            }
            catch (emailError) {
                // Error handled silently
            }
        }
        // Generate a JSON Web Token holding their ID and Email, valid for 7 days
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        // 🛡️ Set Cookies
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        // 💡 Non-HttpOnly hint for frontend to know user is logged in
        res.cookie('is_logged_in', 'true', {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: 'Google login successful',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });
    }
    catch (error) {
        // Error handled silently
        res.status(500).json({ message: 'Error during Google authentication' });
    }
};
/**
 * Handle user registration (Standard Email/Password)
 * Takes user details, checks for existing accounts, hashes the password, and issues a JWT.
 */
export const signUp = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        // 1. Basic Validation: ensure all required fields are present
        if (!fullName || !email || !password) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }
        // 2. Check if a user with this email address already holds an account
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }
        // 3. Hash the password using bcrypt and a salt of factor 10 for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // 4. Create and save the new user record into MongoDB
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });
        const savedUser = await newUser.save();
        // Send Welcome Email to new registered user
        const welcomeSubject = 'Welcome to Quiz App!';
        const welcomeText = `Hi ${savedUser.fullName},\n\nWelcome to Quiz App! We're excited to have you on board. You can now create and take quizzes to test your knowledge.\n\nBest regards,\nThe Quiz App Team`;
        const welcomeHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4F46E5; text-align: center;">Welcome to Quiz App!</h2>
                    <p>Hi <strong>${savedUser.fullName}</strong>,</p>
                    <p>We're absolutely thrilled to have you join our community!</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;">With Quiz App, you can:</p>
                        <ul style="color: #374151;">
                            <li>Create custom quizzes with ease</li>
                            <li>Take challenging assessments</li>
                            <li>Analyze your performance with detailed reports</li>
                        </ul>
                    </div>
                    <p>Ready to get started? Head over to your dashboard and create your first quiz!</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                    </div>
                    <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">Best regards,<br>The Quiz App Team</p>
                </div>
            `;
        try {
            await sendEmail(savedUser.email, welcomeSubject, welcomeText, welcomeHtml);
        }
        catch (emailError) {
            // Error handled silently
        }
        // 5. Generate a JWT Token valid for 7 days
        const token = jwt.sign({ id: savedUser._id, email: savedUser.email }, JWT_SECRET, { expiresIn: '7d' });
        // 🛡️ Set Cookies
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        // 💡 Non-HttpOnly hint for frontend
        res.cookie('is_logged_in', 'true', {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        // 6. Return response to client
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: savedUser._id,
                fullName: savedUser.fullName,
                email: savedUser.email,
                avatar: savedUser.avatar,
                createdAt: savedUser.createdAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};
/**
 * Handle user login (Standard Email/Password)
 * Authenticates credentials, compares hashed passwords, and returns a JWT if valid.
 */
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            res.status(401).json({ message: 'Email and password are required' });
            return;
        }
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: "Please sign up!" });
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials!' });
            return;
        }
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        // 🛡️ Set Cookies
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        // 💡 Non-HttpOnly hint for frontend
        res.cookie('is_logged_in', 'true', {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate reset token and send email
 */
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const db = mongoose.connection.db;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
            return;
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        const message = `Click this link to reset password: ${resetUrl}`;
        try {
            await sendEmail(user.email, 'Password Reset', message);
            res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
        }
        catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({ message: 'Email could not be sent' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Verify token and update password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!user) {
            res.status(400).json({ message: 'Token invalid or expired' });
            return;
        }
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({ message: 'Password reset successful' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = async (req, res) => {
    try {
        const authReq = req; // Cast to access user attached by middleware
        if (!authReq.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const user = await User.findById(authReq.user.id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
/**
 * Handle Logout
 * Clears authentication cookies
 */
export const logout = async (_req, res) => {
    res.clearCookie('jwt');
    res.clearCookie('is_logged_in');
    res.json({ message: 'Logged out successfully' });
};
