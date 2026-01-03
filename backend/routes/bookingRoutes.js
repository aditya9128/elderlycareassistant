const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// User routes
router.post('/', protect, authorize('user'), bookingController.createBooking);
router.get('/', protect, authorize('user'), bookingController.getUserBookings);
router.get('/:id', protect, authorize('user', 'caregiver'), bookingController.getBookingById);
router.put('/:bookingId/cancel', protect, authorize('user'), bookingController.cancelBooking);

// Caregiver routes
router.get('/caregiver/all', protect, authorize('caregiver'), bookingController.getCaregiverBookings);
router.put('/:bookingId/status', protect, authorize('caregiver'), bookingController.updateBookingStatus);

module.exports = router;