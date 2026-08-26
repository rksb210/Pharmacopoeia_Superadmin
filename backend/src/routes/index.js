import { Router } from 'express';
import authRoutes from './auth.routes.js';
import rbacRoutes from './rbac.routes.js';
import adminRoutes from './admin.routes.js';
import subadminRoutes from './subadmin.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import subscriberRoutes from './subscriber.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import planRoutes from './plan.routes.js';
import couponRoutes from './coupon.routes.js';
import bulkImportRoutes from './bulkImport.routes.js';

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

// Role-Based Access Control (RBAC) routes
router.use('/rbac', rbacRoutes);

// Admin Management routes
router.use('/admins', adminRoutes);

// Sub Admin Management routes
router.use('/sub-admins', subadminRoutes);

// Aggregated Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Public Subscribers / Users Management routes
router.use('/subscribers', subscriberRoutes);

// Subscriptions Lifecycle Management routes
router.use('/subscriptions', subscriptionRoutes);

// Plans & Pricing Management routes
router.use('/plans', planRoutes);

// Discounts & Coupons Management routes
router.use('/coupons', couponRoutes);

// Bulk Subscriptions Management routes
router.use('/bulk-subscriptions', bulkImportRoutes);

export default router;
