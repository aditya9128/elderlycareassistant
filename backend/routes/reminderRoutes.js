const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { protect, authorize } = require('../middleware/auth');

// All reminder routes require user authentication
router.use(protect, authorize('user'));

// CRUD operations
router.post('/', reminderController.createReminder);
router.get('/', reminderController.getUserReminders);
router.get('/stats', reminderController.getReminderStats);
router.get('/due', reminderController.getDueReminders);
router.get('/:id', reminderController.getReminderById);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.put('/:reminderId/complete', reminderController.markAsCompleted);

module.exports = router;