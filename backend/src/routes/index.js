import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'NFI Pharmacopoeia Superadmin API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
router.use('/auth', authRoutes);

export default router;
