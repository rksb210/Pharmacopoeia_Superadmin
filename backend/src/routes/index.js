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
import notificationRoutes from './notification.routes.js';
import feedbackRoutes from './feedback.routes.js';
import crmRoutes from './crm.routes.js';
import orderRoutes from './order.routes.js';
import reportRoutes from './report.routes.js';
import auditRoutes from './audit.routes.js';
import configRoutes from './config.routes.js';
import marqueeAlertRoutes from './marqueeAlert.routes.js';
import departmentRoutes from './department.routes.js';
import designationRoutes from './designation.routes.js';
import dikshaRoutes from './diksha.routes.js';

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

// Notification Campaigns & Messaging routes
router.use('/notifications', notificationRoutes);

// Feedback & Content Comments routes
router.use('/feedback', feedbackRoutes);

// Customer Relationship Management (CRM) routes
router.use('/crm', crmRoutes);

// Orders, Invoicing & Payments routes
router.use('/orders', orderRoutes);

// Reports & Analytics routes
router.use('/reports', reportRoutes);

// Centralized Audit Log routes
router.use('/audit-logs', auditRoutes);

// Application Configuration Management routes
router.use('/config', configRoutes);

// CRM Marquee Broadcast Alerts routes
router.use('/marquee-alerts', marqueeAlertRoutes);

// Department & Designation Masters
router.use('/departments', departmentRoutes);
router.use('/designations', designationRoutes);

// DIKSHA (Digital Initiative for Knowledge & Skill Enhancement) LMS routes
router.use('/diksha', dikshaRoutes);

export default router;
