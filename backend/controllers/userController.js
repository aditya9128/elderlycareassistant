const User = require('../models/User');
const Booking = require('../models/Booking');
const MedicalReminder = require('../models/MedicalReminder');

class UserController {
    
    // Get user profile
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Update user profile
    async updateProfile(req, res) {
        try {
            // Fields that can be updated
            const allowedUpdates = [
                'UName', 'UDob', 'UGender', 'UPhone', 'UStreet', 'UCity', 
                'UState', 'UPincode', 'bloodGroup', 'emergencyContacts',
                'medicalConditions', 'allergies', 'notificationSettings',
                'reminderSettings', 'caregiverPreferences'
            ];
            
            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                updates,
                { new: true, runValidators: true }
            );
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get user dashboard data
// Get user dashboard data - ENHANCED VERSION
async getDashboard(req, res) {
    try {
        const userId = req.user.id;
        
        // Get upcoming bookings
        const upcomingBookings = await Booking.find({
            userId: userId,
            status: { $in: ['Confirmed', 'Active'] },
            startDate: { $gte: new Date() }
        })
        .populate('caregiverId', 'cgName cgSpecialization cgProfileImage')
        .sort({ startDate: 1 })
        .limit(5);
        
        // Get active reminders
        const activeReminders = await MedicalReminder.find({
            userId: userId,
            isActive: true,
            status: 'Active'
        })
        .sort({ nextReminder: 1 })
        .limit(5);
        
        // Get recent bookings
        const recentBookings = await Booking.find({
            userId: userId
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('caregiverId', 'cgName cgSpecialization');
        
        // Get user with health metrics
        const user = await User.findById(userId).select('healthMetrics bloodGroup medicalConditions emergencyContacts');
        
        // Calculate health score
        let healthScore = 85; // Default base score
        
        if (user.healthMetrics) {
            const bp = user.healthMetrics.bloodPressure;
            const sugar = user.healthMetrics.bloodSugar;
            
            if (bp && bp.systolic < 140 && bp.diastolic < 90) healthScore += 5;
            if (sugar && sugar.fasting < 126) healthScore += 5;
            if (sugar && sugar.fasting < 100) healthScore += 5;
            
            healthScore = Math.min(100, Math.max(0, healthScore));
        }
        
        // Format dashboard data
        const dashboardData = {
            user: {
                name: req.user.UName,
                email: req.user.UEmail,
                profileImage: req.user.UProfileImage
            },
            stats: {
                upcomingAppointments: upcomingBookings.length,
                activeReminders: activeReminders.length,
                completedBookings: recentBookings.filter(b => b.status === 'Completed').length,
                caregiverRequests: 0, // You can add this logic later
                healthScore: `${healthScore}%`
            },
            upcomingAppointments: upcomingBookings.map(b => ({
                _id: b._id,
                caregiverName: b.caregiverId?.cgName,
                serviceType: b.serviceType,
                startDate: b.startDate,
                status: b.status
            })),
            activeReminders: activeReminders.map(r => ({
                _id: r._id,
                medicationName: r.medicationName,
                instructions: r.instructions,
                nextReminder: r.nextReminder
            })),
            healthMetrics: user.healthMetrics || {},
            recentActivity: recentBookings.map(booking => ({
                _id: booking._id,
                type: 'booking',
                description: `Appointment ${booking.status.toLowerCase()}`,
                details: booking.caregiverId?.cgName || 'Caregiver',
                status: booking.status,
                timestamp: booking.createdAt
            })),
            emergencyContacts: user.emergencyContacts || []
        };
        
        res.status(200).json({
            success: true,
            data: dashboardData
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard data'
        });
    }
}
    
    // Update health metrics
    async updateHealthMetrics(req, res) {
        try {
            const { bloodPressure, bloodSugar, weight } = req.body;
            
            const updates = {};
            
            if (bloodPressure) {
                updates['healthMetrics.bloodPressure'] = {
                    systolic: bloodPressure.systolic,
                    diastolic: bloodPressure.diastolic,
                    lastUpdated: new Date()
                };
            }
            
            if (bloodSugar) {
                updates['healthMetrics.bloodSugar'] = {
                    fasting: bloodSugar.fasting,
                    postPrandial: bloodSugar.postPrandial,
                    lastUpdated: new Date()
                };
            }
            
            if (weight) {
                updates['healthMetrics.weight'] = {
                    value: weight.value,
                    lastUpdated: new Date()
                };
            }
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                updates,
                { new: true }
            );
            
            res.status(200).json({
                success: true,
                message: 'Health metrics updated',
                data: user.healthMetrics
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get medical conditions
    async getMedicalConditions(req, res) {
        try {
            const user = await User.findById(req.user.id).select('medicalConditions');
            
            res.status(200).json({
                success: true,
                data: user.medicalConditions || []
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Add medical condition
    async addMedicalCondition(req, res) {
        try {
            const { condition, diagnosedDate, severity, notes } = req.body;
            
            const medicalCondition = {
                condition,
                diagnosedDate: diagnosedDate || new Date(),
                severity: severity || 'Medium',
                notes: notes || '',
                isActive: true
            };
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $push: { medicalConditions: medicalCondition } },
                { new: true }
            );
            
            res.status(201).json({
                success: true,
                message: 'Medical condition added',
                data: medicalCondition
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new UserController();