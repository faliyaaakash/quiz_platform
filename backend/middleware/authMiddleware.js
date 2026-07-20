import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-123';
/**
 * Authentication Middleware
 * Intercepts incoming requests to protected routes, extracts the JWT from the Authorization header,
 * verifies it, and attaches the decoded user payload to the request object.
 */
export const authMiddleware = (req, res, next) => {
    // 🛡️ Prioritize the secure HttpOnly cookie over the Authorization header
    let token = req.cookies?.['jwt'];
    if (!token) {
        token = req.header('Authorization')?.replace('Bearer ', '');
    }
    // If no token is provided, reject the request
    if (!token) {
        return res.status(401).json({ message: 'Authentication required: session not found or expired' });
    }
    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach the decoded user data payload to the req object
        req.user = decoded;
        // Pass control to the next middleware or the actual route handler
        next();
    }
    catch (err) {
        // If the token is expired, tampered with, or invalid, reject the request
        res.status(401).json({ message: 'Token is not valid' });
    }
};
