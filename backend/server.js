import './loadEnv.js'; // 🛡️ LOAD BEFORE EVERYTHING ELSE
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';
// 🛡️ Strict Environment Variable Validation
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
    console.error(`❌ CRITICAL ERROR: Missing environment variables: ${missingEnvVars.join(', ')}`);
    // During local development, we want to see the error but not necessarily crash immediately
    // In production/Vercel, we crash to prevent running in an insecure/broken state
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        console.error('Fatal: Missing production environment variables. Exiting.');
        process.exit(1);
    }
}
// 🛡️ Normalize FRONTEND_URL: Remove trailing slash if present to avoid CORS issues
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.endsWith('/')) {
    process.env.FRONTEND_URL = process.env.FRONTEND_URL.slice(0, -1);
}
// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
// --- Middleware ---
// Manual Cookie Parser (Avoiding extra package)
app.use((req, _res, next) => {
    const cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach((c) => {
            const [name, ...value] = c.split('=');
            if (name)
                cookies[name.trim()] = value.join('=').trim();
        });
    }
    req.cookies = cookies;
    next();
});

// Use compression for Gzip/Brotli response compression
app.use(compression());
// Enable CORS strictly bound to the frontend URL
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : (process.env.FRONTEND_URL || 'http://localhost:5173'),
    exposedHeaders: ['Content-Disposition'],
    credentials: true
};
app.use(cors(corsOptions));
// Parse incoming JSON payloads in the request body
app.use(express.json());
// --- Routes ---
// Mount authentication-related routes (signup, login, google login) under /api/auth
app.use('/api/auth', authRoutes);
// Mount quiz-related routes (create, get, publish, fetch my quizzes) under /api/quiz
app.use('/api/quiz', quizRoutes);
// --- Health check endpoint ---
// A simple endpoint to verify the server is running and responsive
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// --- Error Handling ---
// Global error middleware should be the last middleware
app.use(errorMiddleware);
// --- Database Connection & Server Start ---
// Attempt to connect to MongoDB using Mongoose
const startServer = async () => {
    try {
        let uri = MONGODB_URI;
        if (uri === 'memory') {
            console.log('Spinning up in-memory MongoDB...');
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        // Once connected to the database, start starting the Express server to listen for requests
        if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        }
    }
    catch (err) {
        // If the database connection fails, log the error and exit the process
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
};
startServer();
export default app;
