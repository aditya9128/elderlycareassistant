const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Profile routes
router.get('/profile', protect, authorize('user'), userController.getProfile);
router.put('/profile', protect, authorize('user'), userController.updateProfile);

// Dashboard routes
router.get('/dashboard', protect, authorize('user'), userController.getDashboard);

// Health routes
router.put('/health-metrics', protect, authorize('user'), userController.updateHealthMetrics);
router.get('/medical-conditions', protect, authorize('user'), userController.getMedicalConditions);
router.post('/medical-conditions', protect, authorize('user'), userController.addMedicalCondition);

module.exports = router;