import { Router } from 'express';
import authRoutes from './auth.routes.js';
import jobsRoutes from './jobs.routes.js';
import chatRoutes from './chat.routes.js';
import uploadRoutes from './upload.routes.js';
import profileRoutes from './profile.routes.js';
import adminRoutes from './admin.routes.js';
import postRoutes from './post.routes.js';
import paymentRoutes from './payment.routes.js';
import workerRoutes from './worker.routes.js';
import serviceRoutes from './service.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);
router.use('/chat', chatRoutes);
router.use('/uploads', uploadRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/posts', postRoutes);

// Majstori (craftsmen) marketplace routes
router.use('/payments', paymentRoutes);
router.use('/workers', workerRoutes);
router.use('/services', serviceRoutes);

export default router;
