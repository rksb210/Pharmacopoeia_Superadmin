import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import { sanitizeNoSql, generalApiLimiter } from './middlewares/security.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Frontend (Vite)
// app.use(
//   cors({
//     origin:"*",// process.env.CORS_ORIGIN || 'http://localhost:5175',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );

// Security & Parsing Middlewares
app.use(helmet());
const allowedOrigins = [
  "http://localhost:5175",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// NoSQL Injection Sanitization & API Rate Limiting
app.use(sanitizeNoSql);
app.use('/api', generalApiLimiter);

// Mount API Routes
app.use('/api', apiRoutes);

// Fallback & Error Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server and Connect DB
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`[Server] NFI Backend running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error(`[Server] Failed to initialize:`, error);
  }
};

startServer();

export default app;
