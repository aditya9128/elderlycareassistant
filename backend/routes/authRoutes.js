const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, checkAuthStatus } = require('../middleware/auth'); // Add checkAuthStatus
const {
    validateUserRegistration,
    validateUserLogin,
    validateCaregiverRegistration,
    validateForgotPassword,
    validateResetPassword,
    validate
} = require('../middleware/validation');

// Public Routes
router.post('/register/user', 
    validateUserRegistration, 
    validate, 
    authController.registerUser
);

router.post('/login/user', 
    validateUserLogin, 
    validate, 
    authController.loginUser
);

router.post('/register/caregiver', 
    validateCaregiverRegistration, 
    validate, 
    authController.registerCaregiver
);

router.post('/login/caregiver', 
    validateUserLogin, 
    validate, 
    authController.loginCaregiver
);

router.post('/forgot-password', 
    validateForgotPassword, 
    validate, 
    authController.forgotPassword
);

router.put('/reset-password/:token', 
    validateResetPassword, 
    validate, 
    authController.resetPassword
);

// NEW: Auth status check (public route)
router.get('/status', checkAuthStatus, (req, res) => {
    res.status(200).json(req.authStatus);
});

// Protected Routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;