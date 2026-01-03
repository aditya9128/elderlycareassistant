// caregiverRoutes.js - SIMPLIFIED WORKING VERSION
const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocuments, uploadProfile } = require('../middleware/upload');
const Notification = require('../models/Notification');

// ========== PUBLIC ROUTES ==========
router.get('/', caregiverController.getCaregivers);
router.get('/search', caregiverController.searchBySpecialization);
router.get('/top-rated', caregiverController.getTopRated);
router.get('/:id', caregiverController.getCaregiverById);

// ========== PROTECTED ROUTES (CAREGIVER ONLY) ==========
router.get('/profile/me', protect, authorize('caregiver'), caregiverController.getProfile);
router.put('/profile/me', protect, authorize('caregiver'), caregiverController.updateProfile);

// ========== DASHBOARD ROUTES ==========

// Get assigned patients
router.get('/patients/assigned', protect, authorize('caregiver'), caregiverController.getAssignedPatients);

// Get pending care requests
router.get('/requests/pending', protect, authorize('caregiver'), caregiverController.getPendingRequests);

// Get new requests count
router.get('/requests/new-count', protect, authorize('caregiver'), caregiverController.getNewRequestsCount);

// Accept a care request
router.post('/requests/:id/accept', protect, authorize('caregiver'), caregiverController.acceptRequest);

// Decline a care request
router.post('/requests/:id/decline', protect, authorize('caregiver'), caregiverController.declineRequest);

// Submit health update
router.post('/health-update', protect, authorize('caregiver'), caregiverController.submitHealthUpdate);

// Get appointments
router.get('/appointments', protect, authorize('caregiver'), caregiverController.getAppointments);

// Get performance metrics
router.get('/performance', protect, authorize('caregiver'), caregiverController.getPerformance);

// ========== SIMPLIFIED UPLOAD ROUTES ==========

// Upload documents (simplified - single file at a time)
router.post('/upload-document', 
    protect,
    authorize('caregiver'),
    (req, res, next) => {
        // Simple file upload middleware
        const multer = require('multer');
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, 'uploads/documents/');
            },
            filename: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, 'doc-' + uniqueSuffix + '-' + file.originalname);
            }
        });
        
        const upload = multer({ 
            storage: storage,
            limits: { fileSize: 5 * 1024 * 1024 } // 5MB
        }).single('document');
        
        upload(req, res, function(err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const caregiverId = req.user.id;
            const { documentType = 'Other Certificate' } = req.body;

            // Create document record
            const Document = require('../models/Document');
            const document = await Document.create({
                caregiverId,
                documentType,
                fileName: req.file.originalname,
                fileUrl: `/uploads/documents/${req.file.filename}`,
                fileSize: req.file.size,
                fileType: req.file.mimetype,
                status: 'Pending'
            });

            // Update caregiver verification status
            const Caregiver = require('../models/Caregiver');
            const caregiver = await Caregiver.findById(caregiverId);
            
            // Determine which verification status to update
            if (documentType === 'ID Proof') {
                caregiver.verificationStatus.idProof = true;
            } else if (documentType === 'Medical Certificate') {
                caregiver.verificationStatus.medicalCertificate = true;
            } else if (documentType === 'Police Verification') {
                caregiver.verificationStatus.policeVerification = true;
            }
            
            await caregiver.save();

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                data: document
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ========== OTHER ROUTES ==========

// Get notifications
router.get('/notifications', protect, authorize('caregiver'), caregiverController.getNotifications);

// Mark notification as read
router.put('/notifications/:id/read', protect, authorize('caregiver'), caregiverController.markNotificationRead);

// Mark all notifications as read
router.put('/notifications/read-all', protect, authorize('caregiver'), caregiverController.markAllNotificationsRead);

// Get earnings summary
router.get('/earnings/summary', protect, authorize('caregiver'), caregiverController.getEarningsSummary);

// Get verification status
router.get('/verification/status', protect, authorize('caregiver'), caregiverController.getVerificationStatus);

// Update availability
router.put('/availability', protect, authorize('caregiver'), caregiverController.updateAvailability);

// Get dashboard stats
router.get('/dashboard/stats', protect, authorize('caregiver'), caregiverController.getDashboardStats);

// ========== DASHBOARD ROUTES ==========

// Get assigned patients - FIXED
router.get('/patients/assigned', protect, authorize('caregiver'), caregiverController.getAssignedPatients);

// Get pending care requests - FIXED
router.get('/requests/pending', protect, authorize('caregiver'), caregiverController.getPendingRequests);

// Get appointments - FIXED
router.get('/appointments', protect, authorize('caregiver'), caregiverController.getAppointments);

// Get health updates - FIXED
router.get('/health-updates', protect, authorize('caregiver'), caregiverController.getHealthUpdates);

// Get dashboard stats - FIXED
router.get('/dashboard/stats', protect, authorize('caregiver'), caregiverController.getDashboardStats);

module.exports = router;