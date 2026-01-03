const { body, validationResult } = require('express-validator');

// User Registration Validation
const validateUserRegistration = [
    body('UName')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('UEmail')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('UPhone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[+]?[1-9][\d]{9,14}$/).withMessage('Please provide a valid phone number (10-15 digits)'),
    
    body('UPassword')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
        .withMessage('Password must contain at least one uppercase, one lowercase, and one number'),
    
    body('UDob')
        .notEmpty().withMessage('Date of birth is required')
        .isISO8601().withMessage('Please provide a valid date in YYYY-MM-DD format')
        .custom((value) => {
            const dob = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            if (age < 18) throw new Error('You must be at least 18 years old');
            if (age > 120) throw new Error('Please provide a valid date of birth');
            return true;
        }),
    
    body('UGender')
        .isIn(['Male', 'Female', 'Other']).withMessage('Please select a valid gender'),
    
    body('UStreet')
        .trim()
        .notEmpty().withMessage('Street address is required'),
    
    body('UCity')
        .trim()
        .notEmpty().withMessage('City is required'),
    
    body('UState')
        .trim()
        .notEmpty().withMessage('State is required'),
    
    body('UPincode')
        .trim()
        .notEmpty().withMessage('Pincode is required')
        .matches(/^\d{6}$/).withMessage('Please provide a valid 6-digit pincode')
];

// User Login Validation
const validateUserLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

// Caregiver Registration Validation
const validateCaregiverRegistration = [
    body('cgName')
        .trim()
        .notEmpty().withMessage('Name is required'),
    
    body('cgEmail')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    
    body('cgPhone')
        .trim()
        .notEmpty().withMessage('Phone number is required'),
    
    body('cgPassword')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    body('cgDob')
        .notEmpty().withMessage('Date of birth is required')
        .isISO8601().withMessage('Please provide a valid date'),
    
    body('cgGender')
        .isIn(['Male', 'Female', 'Other']).withMessage('Please select a valid gender'),
    
    body('cgAddress')
        .trim()
        .notEmpty().withMessage('Address is required'),
    
    body('cgWorkingState')
        .trim()
        .notEmpty().withMessage('Working state is required'),
    
    body('cgWorkingCity')
        .trim()
        .notEmpty().withMessage('Working city is required'),
    
    body('cgExpYears')
        .isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),
    
    body('cgSpecialization')
        .notEmpty().withMessage('Specialization is required'),
    
    body('cgSkills')
        .notEmpty().withMessage('Skills are required'),
    
    body('cgLanguages')
        .notEmpty().withMessage('Languages are required'),
    
    body('jobType')
        .isIn(['Full-time', 'Part-time', 'Weekends', 'Freelance', 'Contract']).withMessage('Please select a valid job type'),
    
    body('cgCharges')
        .notEmpty().withMessage('Charges information is required')
        .custom((value) => {
            // Check if it's an object
            if (typeof value !== 'object' || value === null) {
                throw new Error('Charges must be an object');
            }
            
            // Check if hourly property exists and is valid
            if (value.hourly === undefined || value.hourly === null) {
                throw new Error('Hourly charges are required');
            }
            
            const hourly = parseFloat(value.hourly);
            if (isNaN(hourly) || hourly < 0) {
                throw new Error('Hourly charges must be a positive number');
            }
            
            // Optional: Validate other charge types if provided
            if (value.daily !== undefined) {
                const daily = parseFloat(value.daily);
                if (isNaN(daily) || daily < 0) {
                    throw new Error('Daily charges must be a positive number');
                }
            }
            
            if (value.weekly !== undefined) {
                const weekly = parseFloat(value.weekly);
                if (isNaN(weekly) || weekly < 0) {
                    throw new Error('Weekly charges must be a positive number');
                }
            }
            
            if (value.monthly !== undefined) {
                const monthly = parseFloat(value.monthly);
                if (isNaN(monthly) || monthly < 0) {
                    throw new Error('Monthly charges must be a positive number');
                }
            }
            
            return true;
        }),
];

// Forgot Password Validation
const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    
    body('userType')
        .optional()
        .isIn(['user', 'caregiver']).withMessage('User type must be either user or caregiver')
];

// Reset Password Validation
const validateResetPassword = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    body('userType')
        .optional()
        .isIn(['user', 'caregiver']).withMessage('User type must be either user or caregiver')
];

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(400).json({
        success: false,
        errors: extractedErrors
    });
};

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateCaregiverRegistration,
    validateForgotPassword,
    validateResetPassword,
    validate
};