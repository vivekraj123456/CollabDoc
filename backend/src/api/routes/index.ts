import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import annotationRoutes from './annotation.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/', annotationRoutes); // Annotation routes are nested under documents

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
