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
import { publicSubmissionLimiter } from '../middlewares/security.middleware.js';

const router = Router();

// Public / Subscriber Submission Endpoint (Rate Limited)
router.post('/submit', publicSubmissionLimiter, optionalAuthenticate, validateCreateFeedback, submitPublicFeedback);

// Administrative Routes (Protected)
router.use(authenticate);

router.get('/stats', requirePermission('ENGAGEMENT', 'FEEDBACK', 'VIEW'), getFeedbackStats);
router.get('/', requirePermission('ENGAGEMENT', 'FEEDBACK', 'VIEW'), getFeedbackList);
router.get('/:id', requirePermission('ENGAGEMENT', 'FEEDBACK', 'VIEW'), getFeedbackById);

// Ticket Mutations
router.patch(
  '/:id/assign',
  requirePermission('ENGAGEMENT', 'FEEDBACK', 'EDIT'),
  assignFeedback
);
router.patch(
  '/:id/status',
  requirePermission('ENGAGEMENT', 'FEEDBACK', 'EDIT'),
  validateStatusUpdate,
  updateFeedbackStatus
);
router.post(
  '/:id/reply',
  requirePermission('ENGAGEMENT', 'FEEDBACK', 'EDIT'),
  validateReply,
  replyToFeedback
);

export default router;
