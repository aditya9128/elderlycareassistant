const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

// Public routes
router.get('/nearby', hospitalController.findHospitals);
router.get('/emergency', hospitalController.getEmergencyHospitals);

module.exports = router;