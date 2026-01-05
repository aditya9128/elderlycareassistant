// hospitalRoutes.js
const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

// Public routes
router.get('/nearby', hospitalController.getNearbyHospitals);

module.exports = router;