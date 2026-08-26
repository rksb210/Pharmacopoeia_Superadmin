import { Router } from 'express';
import {
  getFeedbackStats,
  getFeedbackList,
  getFeedbackById,
  submitPublicFeedback,
  assignFeedback,
  updateFeedbackStatus,
  replyToFeedback,
} from '../controllers/feedback.controller.js';
import {
  validateCreateFeedback,
  validateReply,
  validateStatusUpdate,
} from '../validators/feedback.validator.js';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Public / Subscriber Submission Endpoint (Optionally captures user if logged in)
router.post('/submit', optionalAuthenticate, validateCreateFeedback, submitPublicFeedback);

// Administrative Routes (Protected)
router.use(authenticate);

router.get('/stats', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getFeedbackStats);
router.get('/', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getFeedbackList);
router.get('/:id', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getFeedbackById);

// Ticket Mutations
router.patch(
  '/:id/assign',
  requirePermission('USERS', 'SUBSCRIBERS', 'EDIT'),
  assignFeedback
);
router.patch(
  '/:id/status',
  requirePermission('USERS', 'SUBSCRIBERS', 'EDIT'),
  validateStatusUpdate,
  updateFeedbackStatus
);
router.post(
  '/:id/reply',
  requirePermission('USERS', 'SUBSCRIBERS', 'EDIT'),
  validateReply,
  replyToFeedback
);

export default router;
