const Caregiver = require('../models/Caregiver');
const Booking = require('../models/Booking');
const User = require('../models/User'); // Add this import at the top
const HealthUpdate = require('../models/HealthUpdate');
const Document = require('../models/Document');


class CaregiverController {


    async getAssignedPatients(req, res) {
        try {
            // Find bookings where this caregiver is assigned and status is active/completed
            const bookings = await Booking.find({
                caregiverId: req.user.id,
                status: { $in: ['Active', 'Completed', 'Confirmed'] }
            }).populate('userId', 'UName UEmail UPhone UDob UGender healthMetrics');
            
            // Extract patient information from bookings
            const patients = bookings.map(booking => {
                const user = booking.userId;
                return {
                    _id: user._id,
                    UName: user.UName,
                    UEmail: user.UEmail,
                    UPhone: user.UPhone,
                    age: user.age, // Virtual property from User model
                    UCity: user.UCity,
                    healthStatus: user.healthStatus, // Virtual property
                    healthMetrics: user.healthMetrics,
                    assignedDate: booking.createdAt,
                    bookingId: booking._id,
                    serviceType: booking.serviceType,
                    nextAppointment: booking.nextAppointmentDate
                };
            });
            
            res.status(200).json({
                success: true,
                count: patients.length,
                data: patients
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 2. Get pending care requests
    async getPendingRequests(req, res) {
        try {
            const requests = await Booking.find({
                caregiverId: req.user.id,
                status: 'Pending'
            }).populate('userId', 'UName UEmail UPhone UDob UGender UCity');
            
            const formattedRequests = requests.map(request => ({
                _id: request._id,
                patient: {
                    _id: request.userId._id,
                    UName: request.userId.UName,
                    UEmail: request.userId.UEmail,
                    UPhone: request.userId.UPhone,
                    age: request.userId.age,
                    UCity: request.userId.UCity
                },
                serviceType: request.serviceType,
                duration: request.duration,
                startDate: request.startDate,
                endDate: request.endDate,
                budget: request.budget,
                notes: request.notes,
                createdAt: request.createdAt,
                status: request.status
            }));
            
            res.status(200).json({
                success: true,
                count: formattedRequests.length,
                data: formattedRequests
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 3. Accept a care request
    async acceptRequest(req, res) {
        try {
            const { id } = req.params;
            
            const booking = await Booking.findOneAndUpdate(
                {
                    _id: id,
                    caregiverId: req.user.id,
                    status: 'Pending'
                },
                {
                    status: 'Confirmed',
                    confirmedAt: new Date()
                },
                { new: true }
            );
            
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Request not found or already processed'
                });
            }
            
            // Update caregiver's pending requests count
            await Caregiver.findByIdAndUpdate(req.user.id, {
                $inc: { pendingRequests: -1 },
                $inc: { bookingCount: 1 }
            });
            
            res.status(200).json({
                success: true,
                message: 'Request accepted successfully',
                data: booking
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 4. Decline a care request
    async declineRequest(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            
            const booking = await Booking.findOneAndUpdate(
                {
                    _id: id,
                    caregiverId: req.user.id,
                    status: 'Pending'
                },
                {
                    status: 'Declined',
                    declineReason: reason || 'No reason provided',
                    declinedAt: new Date()
                },
                { new: true }
            );
            
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Request not found or already processed'
                });
            }
            
            // Update caregiver's pending requests count
            await Caregiver.findByIdAndUpdate(req.user.id, {
                $inc: { pendingRequests: -1 }
            });
            
            res.status(200).json({
                success: true,
                message: 'Request declined successfully',
                data: booking
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 5. Submit health update for patient
    async submitHealthUpdate(req, res) {
        try {
            const { patientId, vitalSigns, clinicalNotes, medicationAdministered } = req.body;
            
            // Verify that caregiver is assigned to this patient
            const booking = await Booking.findOne({
                userId: patientId,
                caregiverId: req.user.id,
                status: { $in: ['Active', 'Confirmed'] }
            });
            
            if (!booking) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to this patient'
                });
            }
            
            // Create health update record
            const healthUpdate = await HealthUpdate.create({
                patientId,
                caregiverId: req.user.id,
                vitalSigns,
                clinicalNotes,
                medicationAdministered,
                bookingId: booking._id
            });
            
            // Update patient's health metrics in User model
            if (vitalSigns) {
                const updateData = {};
                
                if (vitalSigns.bloodPressure) {
                    const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map(Number);
                    updateData['healthMetrics.bloodPressure.systolic'] = systolic;
                    updateData['healthMetrics.bloodPressure.diastolic'] = diastolic;
                    updateData['healthMetrics.bloodPressure.lastUpdated'] = new Date();
                }
                
                if (vitalSigns.bloodSugar) {
                    updateData['healthMetrics.bloodSugar.fasting'] = vitalSigns.bloodSugar;
                    updateData['healthMetrics.bloodSugar.lastUpdated'] = new Date();
                }
                
                if (vitalSigns.temperature) {
                    updateData['healthMetrics.temperature'] = vitalSigns.temperature;
                    updateData['healthMetrics.temperatureLastUpdated'] = new Date();
                }
                
                if (vitalSigns.pulseRate) {
                    updateData['healthMetrics.pulseRate'] = vitalSigns.pulseRate;
                    updateData['healthMetrics.pulseRateLastUpdated'] = new Date();
                }
                
                if (Object.keys(updateData).length > 0) {
                    await User.findByIdAndUpdate(patientId, updateData);
                }
            }
            
            res.status(201).json({
                success: true,
                message: 'Health update saved successfully',
                data: healthUpdate
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get all caregivers with filtering
    async getCaregivers(req, res) {
        try {
            const { 
                specialization, 
                city, 
                minExperience, 
                maxRate,
                minRating,
                availability,
                page = 1,
                limit = 10
            } = req.query;
            
            const query = { isActive: true };
            
            // Apply filters
            if (specialization) {
                query.cgSpecialization = { $in: [specialization] };
            }
            
            if (city) {
                query.cgWorkingCity = new RegExp(city, 'i');
            }
            
            if (minExperience) {
                query.cgExpYears = { $gte: parseInt(minExperience) };
            }
            
            if (maxRate) {
                query['cgCharges.hourly'] = { $lte: parseFloat(maxRate) };
            }
            
            if (minRating) {
                query['cgRating.average'] = { $gte: parseFloat(minRating) };
            }
            
            if (availability) {
                query.availabilityDays = { $in: [availability] };
            }
            
            const skip = (page - 1) * limit;
            
            const caregivers = await Caregiver.find(query)
                .select('-cgPassword -resetPasswordToken -resetPasswordExpire')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ 'cgRating.average': -1, 'cgRating.totalRatings': -1 });
            
            const total = await Caregiver.countDocuments(query);
            
            res.status(200).json({
                success: true,
                count: caregivers.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                data: caregivers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get caregiver by ID
    async getCaregiverById(req, res) {
        try {
            const caregiver = await Caregiver.findById(req.params.id)
                .select('-cgPassword -resetPasswordToken -resetPasswordExpire');
            
            if (!caregiver) {
                return res.status(404).json({
                    success: false,
                    message: 'Caregiver not found'
                });
            }
            
            // Get caregiver's availability
            const upcomingBookings = await Booking.find({
                caregiverId: req.params.id,
                status: { $in: ['Confirmed', 'Active'] },
                startDate: { $gte: new Date() }
            }).sort({ startDate: 1 });
            
            const caregiverData = {
                ...caregiver.toObject(),
                upcomingBookings: upcomingBookings.length,
                nextAvailable: caregiver.nextAvailableDate
            };
            
            res.status(200).json({
                success: true,
                data: caregiverData
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get caregiver profile (for logged in caregiver)
    async getProfile(req, res) {
        try {
            const caregiver = await Caregiver.findById(req.user.id)
                .select('-cgPassword -resetPasswordToken -resetPasswordExpire');
            
            // Get caregiver's bookings
            const pendingBookings = await Booking.countDocuments({
                caregiverId: req.user.id,
                status: 'Pending'
            });
            
            const activeBookings = await Booking.countDocuments({
                caregiverId: req.user.id,
                status: { $in: ['Confirmed', 'Active'] }
            });
            
            const earnings = await Booking.aggregate([
                {
                    $match: {
                        caregiverId: req.user._id,
                        status: 'Completed',
                        'payment.paymentStatus': 'Fully Paid'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$payment.totalAmount' }
                    }
                }
            ]);
            
            const profileData = {
                ...caregiver.toObject(),
                stats: {
                    pendingBookings,
                    activeBookings,
                    totalEarnings: earnings[0]?.total || 0,
                    rating: caregiver.cgRating.average,
                    totalRatings: caregiver.cgRating.totalRatings
                }
            };
            
            res.status(200).json({
                success: true,
                data: profileData
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Update caregiver profile
    async updateProfile(req, res) {
        try {
            const allowedUpdates = [
                'cgName', 'cgPhone', 'cgAddress', 'cgWorkingCity', 'cgWorkingState',
                'cgSpecialization', 'cgSkills', 'cgLanguages', 'cgProfileDescription',
                'cgCharges', 'availabilityDays', 'availabilityTimings', 'jobType',
                'preferences', 'cgProfileImage'
            ];
            
            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });
            
            const caregiver = await Caregiver.findByIdAndUpdate(
                req.user.id,
                updates,
                { new: true, runValidators: true }
            ).select('-cgPassword -resetPasswordToken -resetPasswordExpire');
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: caregiver
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Search caregivers by specialization
    async searchBySpecialization(req, res) {
        try {
            const { specialization } = req.query;
            
            if (!specialization) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a specialization'
                });
            }
            
            const caregivers = await Caregiver.find({
                cgSpecialization: { $in: [specialization] },
                isActive: true,
                verified: true
            })
            .select('cgName cgSpecialization cgExpYears cgRating cgCharges cgWorkingCity cgProfileImage')
            .limit(20);
            
            res.status(200).json({
                success: true,
                count: caregivers.length,
                specialization: specialization,
                data: caregivers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get top-rated caregivers
    async getTopRated(req, res) {
        try {
            const caregivers = await Caregiver.find({
                isActive: true,
                verified: true,
                'cgRating.totalRatings': { $gte: 5 }
            })
            .select('cgName cgSpecialization cgExpYears cgRating cgProfileImage cgWorkingCity')
            .sort({ 'cgRating.average': -1, 'cgRating.totalRatings': -1 })
            .limit(10);
            
            res.status(200).json({
                success: true,
                count: caregivers.length,
                data: caregivers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

async getAppointments(req, res) {
    try {
        const { 
            startDate, 
            endDate, 
            status, 
            type = 'upcoming',
            limit = 20,
            page = 1 
        } = req.query;
        
        const caregiverId = req.user.id;
        const skip = (page - 1) * limit;
        
        const query = { caregiverId: caregiverId };
        
        // Filter by date range
        if (startDate && endDate) {
            query.startDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (type === 'upcoming') {
            query.startDate = { $gte: new Date() };
        } else if (type === 'past') {
            query.startDate = { $lt: new Date() };
        }
        
        // Filter by status
        if (status) {
            if (status === 'active') {
                query.status = { $in: ['Accepted', 'Confirmed', 'Active'] };
            } else {
                query.status = status;
            }
        }
        
        const appointments = await Booking.find(query)
            .populate('userId', 'UName UEmail UPhone UProfileImage')
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Booking.countDocuments(query);
        
        const formattedAppointments = appointments.map(appointment => ({
            _id: appointment._id,
            patient: {
                _id: appointment.userId?._id,
                name: appointment.userId?.UName || 'Patient',
                email: appointment.userId?.UEmail || '',
                phone: appointment.userId?.UPhone || '',
                profileImage: appointment.userId?.UProfileImage
            },
            serviceType: appointment.serviceType || 'General Care',
            startDate: appointment.startDate,
            endDate: appointment.endDate,
            duration: appointment.duration,
            status: appointment.status,
            location: appointment.location?.address || 'Patient\'s Home',
            notes: appointment.notes,
            budget: appointment.budget,
            payment: appointment.payment,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt
        }));
        
        res.status(200).json({
            success: true,
            count: formattedAppointments.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: formattedAppointments
        });
    } catch (error) {
        console.error('Error in getAppointments:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
    
    // 12. Get performance metrics
    async getPerformance(req, res) {
        try {
            const caregiverId = req.user.id;
            const { period = 'month' } = req.query; // day, week, month, year
            
            // Calculate date range
            const now = new Date();
            let startDate;
            
            switch (period) {
                case 'day':
                    startDate = new Date(now.setDate(now.getDate() - 1));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
            }
            
            // Get all relevant bookings
            const bookings = await Booking.find({
                caregiverId,
                createdAt: { $gte: startDate }
            });
            
            // Calculate metrics
            const totalBookings = bookings.length;
            const completedBookings = bookings.filter(b => b.status === 'Completed').length;
            const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
            const activeBookings = bookings.filter(b => b.status === 'Active').length;
            const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
            
            // Calculate response time (for accepted/rejected requests)
            const respondedRequests = bookings.filter(b => 
                (b.status === 'Confirmed' || b.status === 'Declined') && 
                b.createdAt && 
                (b.confirmedAt || b.declinedAt)
            );
            
            let totalResponseTime = 0;
            respondedRequests.forEach(booking => {
                const responseDate = booking.confirmedAt || booking.declinedAt;
                const responseTime = (responseDate - booking.createdAt) / (1000 * 60 * 60); // in hours
                totalResponseTime += responseTime;
            });
            
            const avgResponseTime = respondedRequests.length > 0 ? 
                (totalResponseTime / respondedRequests.length).toFixed(1) : 0;
            
            // Calculate earnings
            const totalEarnings = bookings
                .filter(b => b.payment?.paymentStatus === 'Fully Paid')
                .reduce((sum, b) => sum + (b.payment?.totalAmount || 0), 0);
            
            // Get caregiver rating
            const caregiver = await Caregiver.findById(caregiverId).select('cgRating');
            
            // Calculate completion rate
            const completionRate = totalBookings > 0 ? 
                Math.round((completedBookings / totalBookings) * 100) : 0;
            
            // Calculate satisfaction rate (based on rating)
            const satisfactionRate = caregiver.cgRating.average * 20; // Convert 0-5 to 0-100
            
            // Calculate response rate
            const responseRate = pendingBookings + respondedRequests.length > 0 ?
                Math.round((respondedRequests.length / (pendingBookings + respondedRequests.length)) * 100) : 0;
            
            // Prepare metrics data
            const metrics = {
                overview: {
                    totalBookings,
                    completedBookings,
                    activeBookings,
                    pendingBookings,
                    cancelledBookings,
                    totalEarnings: Math.round(totalEarnings)
                },
                rates: {
                    completionRate,
                    satisfactionRate: Math.round(satisfactionRate),
                    responseRate,
                    cancellationRate: totalBookings > 0 ? 
                        Math.round((cancelledBookings / totalBookings) * 100) : 0
                },
                averages: {
                    responseTime: avgResponseTime + ' hours',
                    rating: caregiver.cgRating.average.toFixed(1),
                    totalRatings: caregiver.cgRating.totalRatings
                },
                period: period,
                periodStart: startDate,
                periodEnd: new Date()
            };
            
            // Get trend data for charts
            const trendData = await this.getPerformanceTrends(caregiverId, period);
            
            res.status(200).json({
                success: true,
                data: {
                    metrics,
                    trendData
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Helper method for performance trends
    async getPerformanceTrends(caregiverId, period) {
        let groupFormat;
        let dateField = 'createdAt';
        
        switch (period) {
            case 'day':
                groupFormat = { hour: { $hour: `$${dateField}` } };
                break;
            case 'week':
                groupFormat = { day: { $dayOfMonth: `$${dateField}` } };
                break;
            case 'month':
                groupFormat = { day: { $dayOfMonth: `$${dateField}` } };
                break;
            case 'year':
                groupFormat = { month: { $month: `$${dateField}` } };
                break;
            default:
                groupFormat = { day: { $dayOfMonth: `$${dateField}` } };
        }
        
        const bookingsTrend = await Booking.aggregate([
            {
                $match: {
                    caregiverId: caregiverId,
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                }
            },
            {
                $group: {
                    _id: groupFormat,
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    earnings: {
                        $sum: { $cond: [
                            { $eq: ['$payment.paymentStatus', 'Fully Paid'] },
                            '$payment.totalAmount',
                            0
                        ]}
                    }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        return bookingsTrend;
    }
    
    // 13. Upload documents for verification
    async uploadDocuments(req, res) {
        try {
            const caregiverId = req.user.id;
            const files = req.files; // Assuming you have multer middleware for file uploads
            
            if (!files || Object.keys(files).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }
            
            const uploadedDocuments = [];
            
            // Process each uploaded file
            for (const [fieldName, fileArray] of Object.entries(files)) {
                const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
                
                // Determine document type from field name
                let documentType;
                switch (fieldName) {
                    case 'idProof':
                        documentType = 'ID Proof';
                        break;
                    case 'medicalCertificate':
                        documentType = 'Medical Certificate';
                        break;
                    case 'policeVerification':
                        documentType = 'Police Verification';
                        break;
                    case 'resume':
                        documentType = 'Resume';
                        break;
                    default:
                        documentType = 'Other Certificate';
                }
                
                // Create document record
                const document = await Document.create({
                    caregiverId,
                    documentType,
                    fileName: file.originalname,
                    fileUrl: `/uploads/documents/${file.filename}`,
                    fileSize: file.size,
                    fileType: file.mimetype,
                    status: 'Pending'
                });
                
                uploadedDocuments.push(document);
                
                // Update caregiver verification status
                const updateField = `verificationStatus.${fieldName}`;
                await Caregiver.findByIdAndUpdate(caregiverId, {
                    [updateField]: true,
                    $addToSet: { 'documents': file.filename }
                });
            }
            
            // Check if all required documents are uploaded
            const caregiver = await Caregiver.findById(caregiverId);
            const verificationStatus = caregiver.verificationStatus;
            
            let allUploaded = true;
            const requiredDocs = ['idProof', 'medicalCertificate'];
            
            requiredDocs.forEach(doc => {
                if (!verificationStatus[doc]) {
                    allUploaded = false;
                }
            });
            
            // If all required docs uploaded, update verification status
            if (allUploaded) {
                await Caregiver.findByIdAndUpdate(caregiverId, {
                    verificationStatus: {
                        ...verificationStatus,
                        allSubmitted: true
                    }
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Documents uploaded successfully',
                count: uploadedDocuments.length,
                data: uploadedDocuments,
                allRequiredUploaded: allUploaded
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 14. Get new requests count
    // Update this method in caregiverController.js
async getNewRequestsCount(req, res) {
    try {
        const caregiverId = req.user.id;
        
        // Count pending requests from last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const pendingCount = await Booking.countDocuments({
            caregiverId,
            status: 'Pending',
            createdAt: { $gte: twentyFourHoursAgo }
        });
        
        // Count unread notifications
        const Notification = require('../models/Notification');
        const notificationCount = await Notification.countDocuments({
            recipientId: caregiverId,
            recipientType: 'Caregiver',
            read: false
        });
        
        res.status(200).json({
            success: true,
            data: {
                pendingRequests: pendingCount,
                unreadNotifications: notificationCount,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
    
    // 15. Submit health update (enhanced version)
    async submitHealthUpdate(req, res) {
        try {
            const caregiverId = req.user.id;
            const { 
                patientId, 
                vitalSigns, 
                clinicalNotes, 
                medicationAdministered,
                symptoms,
                diet,
                activityLevel,
                mood,
                sleepQuality,
                painLevel,
                additionalObservations,
                isCritical,
                requiresAttention,
                nextCheckup
            } = req.body;
            
            // Verify that caregiver is assigned to this patient
            const booking = await Booking.findOne({
                userId: patientId,
                caregiverId: caregiverId,
                status: { $in: ['Active', 'Confirmed'] }
            });
            
            if (!booking) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to this patient'
                });
            }
            
            // Parse vital signs if provided as string
            let parsedVitalSigns = vitalSigns;
            if (typeof vitalSigns === 'string') {
                try {
                    parsedVitalSigns = JSON.parse(vitalSigns);
                } catch (e) {
                    parsedVitalSigns = {};
                }
            }
            
            // Parse medication if provided as string
            let parsedMedication = medicationAdministered;
            if (typeof medicationAdministered === 'string') {
                try {
                    parsedMedication = JSON.parse(medicationAdministered);
                } catch (e) {
                    parsedMedication = [];
                }
            }
            
            // Create health update record
            const healthUpdate = await HealthUpdate.create({
                patientId,
                caregiverId,
                bookingId: booking._id,
                vitalSigns: parsedVitalSigns,
                clinicalNotes,
                medicationAdministered: parsedMedication,
                symptoms: symptoms || [],
                diet,
                activityLevel,
                mood,
                sleepQuality,
                painLevel: painLevel || 0,
                additionalObservations,
                isCritical: isCritical || false,
                requiresAttention: requiresAttention || false,
                nextCheckup: nextCheckup ? new Date(nextCheckup) : null
            });
            
            // Update patient's health metrics in User model
            if (parsedVitalSigns) {
                const updateData = {};
                
                if (parsedVitalSigns.bloodPressure) {
                    updateData['healthMetrics.bloodPressure.systolic'] = parsedVitalSigns.bloodPressure.systolic;
                    updateData['healthMetrics.bloodPressure.diastolic'] = parsedVitalSigns.bloodPressure.diastolic;
                    updateData['healthMetrics.bloodPressure.lastUpdated'] = new Date();
                }
                
                if (parsedVitalSigns.bloodSugar) {
                    updateData['healthMetrics.bloodSugar.fasting'] = parsedVitalSigns.bloodSugar.value;
                    updateData['healthMetrics.bloodSugar.lastUpdated'] = new Date();
                }
                
                if (parsedVitalSigns.temperature) {
                    updateData['healthMetrics.temperature'] = parsedVitalSigns.temperature.value;
                    updateData['healthMetrics.temperatureLastUpdated'] = new Date();
                }
                
                if (parsedVitalSigns.pulseRate) {
                    updateData['healthMetrics.pulseRate'] = parsedVitalSigns.pulseRate.value;
                    updateData['healthMetrics.pulseRateLastUpdated'] = new Date();
                }
                
                if (Object.keys(updateData).length > 0) {
                    await User.findByIdAndUpdate(patientId, updateData);
                }
            }
            
            // Create notification for patient
            await Notification.create({
                recipientId: patientId,
                recipientType: 'User',
                type: 'health_update',
                title: 'Health Update Recorded',
                message: `Your caregiver has recorded a new health update.`,
                data: {
                    healthUpdateId: healthUpdate._id,
                    caregiverName: req.user.cgName
                },
                priority: isCritical ? 'high' : 'medium'
            });
            
            res.status(201).json({
                success: true,
                message: 'Health update saved successfully',
                data: healthUpdate
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 16. Get health updates history
async getHealthUpdates(req, res) {
    try {
        const { patientId, limit = 10, page = 1 } = req.query;
        const caregiverId = req.user.id;
        const skip = (page - 1) * limit;
        
        const query = { caregiverId: caregiverId };
        if (patientId) {
            query.patientId = patientId;
        }
        
        const healthUpdates = await HealthUpdate.find(query)
            .populate('patientId', 'UName UEmail UPhone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await HealthUpdate.countDocuments(query);
        
        const formattedUpdates = healthUpdates.map(update => {
            const vitalStatus = update.checkVitalStatus ? update.checkVitalStatus() : { bloodPressure: 'Normal' };
            return {
                _id: update._id,
                patient: {
                    _id: update.patientId?._id,
                    name: update.patientId?.UName || 'Patient',
                    email: update.patientId?.UEmail || ''
                },
                vitalSigns: update.vitalSigns || {},
                formattedBloodPressure: update.formattedBloodPressure || '--/--',
                clinicalNotes: update.clinicalNotes || '',
                medicationAdministered: update.medicationAdministered || [],
                vitalStatus: vitalStatus,
                isCritical: update.isCritical || false,
                requiresAttention: update.requiresAttention || false,
                createdAt: update.createdAt,
                timeAgo: update.createdAt ? this.formatTimeAgo(update.createdAt) : 'Recently'
            };
        });
        
        res.status(200).json({
            success: true,
            count: formattedUpdates.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: formattedUpdates
        });
    } catch (error) {
        console.error('Error in getHealthUpdates:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
    
    // 17. Update availability
    async updateAvailability(req, res) {
        try {
            const caregiverId = req.user.id;
            const { 
                availabilityDays, 
                availabilityTimings, 
                isBusy, 
                nextAvailableDate,
                preferences 
            } = req.body;
            
            const updateData = {};
            
            if (availabilityDays) updateData.availabilityDays = availabilityDays;
            if (availabilityTimings) updateData.availabilityTimings = availabilityTimings;
            if (isBusy !== undefined) updateData.isBusy = isBusy;
            if (nextAvailableDate) updateData.nextAvailableDate = new Date(nextAvailableDate);
            if (preferences) updateData.preferences = preferences;
            
            const caregiver = await Caregiver.findByIdAndUpdate(
                caregiverId,
                updateData,
                { new: true, runValidators: true }
            ).select('-cgPassword -resetPasswordToken -resetPasswordExpire');
            
            res.status(200).json({
                success: true,
                message: 'Availability updated successfully',
                data: caregiver
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 18. Get earnings summary
    async getEarningsSummary(req, res) {
        try {
            const caregiverId = req.user.id;
            const { period = 'month' } = req.query;
            
            const now = new Date();
            let startDate;
            
            switch (period) {
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
            }
            
            // Get earnings from completed bookings
            const earnings = await Booking.aggregate([
                {
                    $match: {
                        caregiverId: caregiverId,
                        status: 'Completed',
                        'payment.paymentStatus': 'Fully Paid',
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalEarnings: { $sum: '$payment.totalAmount' },
                        totalBookings: { $sum: 1 },
                        avgEarningPerBooking: { $avg: '$payment.totalAmount' }
                    }
                }
            ]);
            
            // Get monthly breakdown
            const monthlyBreakdown = await Booking.aggregate([
                {
                    $match: {
                        caregiverId: caregiverId,
                        status: 'Completed',
                        'payment.paymentStatus': 'Fully Paid'
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        totalEarnings: { $sum: '$payment.totalAmount' },
                        bookingCount: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 }
            ]);
            
            // Get pending payments
            const pendingPayments = await Booking.aggregate([
                {
                    $match: {
                        caregiverId: caregiverId,
                        status: 'Completed',
                        'payment.paymentStatus': { $in: ['Pending', 'Partially Paid'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalPending: { $sum: '$payment.totalAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            const summary = {
                totalEarnings: earnings[0]?.totalEarnings || 0,
                totalBookings: earnings[0]?.totalBookings || 0,
                avgEarningPerBooking: earnings[0]?.avgEarningPerBooking || 0,
                pendingPayments: pendingPayments[0]?.totalPending || 0,
                pendingCount: pendingPayments[0]?.count || 0,
                period: period,
                monthlyBreakdown: monthlyBreakdown.map(item => ({
                    month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
                    earnings: item.totalEarnings,
                    bookings: item.bookingCount
                }))
            };
            
            res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 19. Get verification status
    async getVerificationStatus(req, res) {
        try {
            const caregiverId = req.user.id;
            
            const caregiver = await Caregiver.findById(caregiverId)
                .select('verified verificationStatus documents');
            
            // Get uploaded documents
            const documents = await Document.find({ 
                caregiverId,
                isActive: true 
            }).sort({ documentType: 1 });
            
            const verificationStatus = {
                isVerified: caregiver.verified,
                verificationStatus: caregiver.verificationStatus,
                documents: documents,
                missingDocuments: []
            };
            
            // Check for missing required documents
            const requiredDocs = [
                { key: 'idProof', name: 'ID Proof', required: true },
                { key: 'medicalCertificate', name: 'Medical Certificate', required: true },
                { key: 'backgroundCheck', name: 'Background Check', required: false },
                { key: 'policeVerification', name: 'Police Verification', required: false }
            ];
            
            requiredDocs.forEach(doc => {
                if (doc.required && !caregiver.verificationStatus[doc.key]) {
                    verificationStatus.missingDocuments.push(doc.name);
                }
            });
            
            res.status(200).json({
                success: true,
                data: verificationStatus
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // 20. Get dashboard statistics (combined)
    async getDashboardStats(req, res) {
        try {
            const caregiverId = req.user.id;
            
            // Get counts in parallel for efficiency
            const [
                currentPatients,
                pendingRequests,
                totalEarnings,
                upcomingAppointments,
                healthUpdatesToday
            ] = await Promise.all([
                Booking.countDocuments({
                    caregiverId,
                    status: { $in: ['Active', 'Confirmed'] }
                }),
                Booking.countDocuments({
                    caregiverId,
                    status: 'Pending',
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }),
                Booking.aggregate([
                    {
                        $match: {
                            caregiverId,
                            status: 'Completed',
                            'payment.paymentStatus': 'Fully Paid'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$payment.totalAmount' }
                        }
                    }
                ]),
                Booking.countDocuments({
                    caregiverId,
                    status: { $in: ['Confirmed', 'Active'] },
                    startDate: { 
                        $gte: new Date(),
                        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
                    }
                }),
                HealthUpdate.countDocuments({
                    caregiverId,
                    createdAt: { 
                        $gte: new Date().setHours(0, 0, 0, 0)
                    }
                })
            ]);
            
            // Get caregiver rating
            const caregiver = await Caregiver.findById(caregiverId)
                .select('cgRating verified');
            
            const stats = {
                currentPatients: currentPatients || 0,
                pendingRequests: pendingRequests || 0,
                totalEarnings: totalEarnings[0]?.total || 0,
                upcomingAppointments: upcomingAppointments || 0,
                healthUpdatesToday: healthUpdatesToday || 0,
                rating: caregiver.cgRating.average,
                totalRatings: caregiver.cgRating.totalRatings,
                isVerified: caregiver.verified,
                lastUpdated: new Date()
            };
            
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Helper method: Format time ago
    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
        }
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
        }
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
        }
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
        }
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
        }
        return Math.floor(seconds) + ' seconds ago';
    }

    // caregiverController.js - Add these methods to the existing class

// Upload profile image
async uploadProfileImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const caregiverId = req.user.id;
        const profileImage = req.file.filename;

        // Update caregiver profile
        const caregiver = await Caregiver.findByIdAndUpdate(
            caregiverId,
            { cgProfileImage: profileImage },
            { new: true }
        ).select('-cgPassword');

        res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            data: {
                profileImage: caregiver.cgProfileImage,
                profileImageUrl: `/uploads/caregivers/${caregiver.cgProfileImage}`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get notifications
async getNotifications(req, res) {
    try {
        const { limit = 20, page = 1, unreadOnly } = req.query;
        const skip = (page - 1) * limit;

        const query = {
            recipientId: req.user.id,
            recipientType: 'Caregiver'
        };

        if (unreadOnly === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            recipientId: req.user.id,
            recipientType: 'Caregiver',
            read: false
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Mark notification as read
async markNotificationRead(req, res) {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                recipientId: req.user.id,
                recipientType: 'Caregiver'
            },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Mark all notifications as read
async markAllNotificationsRead(req, res) {
    try {
        await Notification.updateMany(
            {
                recipientId: req.user.id,
                recipientType: 'Caregiver',
                read: false
            },
            { read: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get performance metrics (simplified version)
async getPerformance(req, res) {
    try {
        const caregiverId = req.user.id;

        // Get basic counts
        const currentPatients = await Booking.countDocuments({
            caregiverId,
            status: { $in: ['Active', 'Confirmed'] }
        });

        const pendingRequests = await Booking.countDocuments({
            caregiverId,
            status: 'Pending'
        });

        const completedBookings = await Booking.countDocuments({
            caregiverId,
            status: 'Completed'
        });

        // Get earnings
        const earningsResult = await Booking.aggregate([
            {
                $match: {
                    caregiverId,
                    status: 'Completed',
                    'payment.paymentStatus': 'Fully Paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$payment.totalAmount' }
                }
            }
        ]);

        const totalEarnings = earningsResult[0]?.totalEarnings || 0;

        // Get caregiver rating
        const caregiver = await Caregiver.findById(caregiverId).select('cgRating');
        
        // Calculate response time (mock data for now)
        const responseTime = '2.5 hours'; // This would be calculated from actual data
        
        // Calculate completion rate
        const totalBookings = await Booking.countDocuments({ caregiverId });
        const completionRate = totalBookings > 0 ? 
            Math.round((completedBookings / totalBookings) * 100) : 0;

        const performanceData = {
            currentPatients,
            pendingRequests,
            completedBookings,
            totalEarnings,
            rating: caregiver.cgRating.average,
            totalRatings: caregiver.cgRating.totalRatings,
            responseTime,
            completionRate,
            satisfactionRate: Math.min(100, Math.round(caregiver.cgRating.average * 20))
        };

        res.status(200).json({
            success: true,
            data: performanceData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
}

module.exports = new CaregiverController();