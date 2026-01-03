// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
    'uploads/documents',
    'uploads/caregivers',
    'uploads/health-updates'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage for documents
const documentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'document-' + uniqueSuffix + ext);
    }
});

// Configure storage for caregiver profile images
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/caregivers/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDF/DOC files are allowed.'), false);
    }
};

// Limits
const limits = {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5 // Max 5 files per request
};

// Create upload instances
const uploadDocuments = multer({
    storage: documentStorage,
    fileFilter: fileFilter,
    limits: limits
});

const uploadProfile = multer({
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
        // Only allow images for profile
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile pictures.'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB max for profile images
    }
});

module.exports = {
    uploadDocuments,
    uploadProfile
};