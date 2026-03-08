const Booking = require('../models/Booking');
const Caregiver = require('../models/Caregiver');
const User = require('../models/User');

class BookingController {
    
    // Create new booking
    async createBooking(req, res) {
        try {
            const userId = req.user.id;
            const {
                caregiverId,
                elderName,
                elderAge,
                elderGender,
                cgSpecialization,
                careType,
                serviceType, // Accept both careType and serviceType
                startDate,
                endDate,
                startTime,
                endTime,
                location,
                address,
                message,
                notes, // Accept both message and notes
                urgency,
                servicesRequired
            } = req.body;
            
            // Check if caregiver exists and is available
            const caregiver = await Caregiver.findById(caregiverId);
            if (!caregiver || !caregiver.isActive) {
                return res.status(404).json({
                    success: false,
                    message: 'Caregiver not found or not available'
                });
            }
            
            // Check if caregiver is busy
            if (caregiver.isBusy) {
                return res.status(400).json({
                    success: false,
                    message: 'Caregiver is currently busy',
                    nextAvailable: caregiver.nextAvailableDate
                });
            }
            
            // Get user details for contact info
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Parse dates
            const parsedStartDate = new Date(startDate);
            const parsedEndDate = new Date(endDate);
            
            // Check for time conflicts (only for confirmed/active bookings)
            const conflictingBooking = await Booking.findOne({
                caregiverId: caregiverId,
                status: { $in: ['Confirmed', 'Active'] },
                $or: [
                    {
                        startDate: { $lte: parsedEndDate },
                        endDate: { $gte: parsedStartDate }
                    }
                ]
            });
            
            if (conflictingBooking) {
                return res.status(400).json({
                    success: false,
                    message: 'Caregiver is not available during this time'
                });
            }
            
            // Determine care type (accept both careType and serviceType)
            const finalCareType = careType || serviceType || 'Daily Care';
            
            // Determine specialization (from request or caregiver's primary specialization)
            const finalSpecialization = cgSpecialization || 
                (Array.isArray(caregiver.cgSpecialization) ? caregiver.cgSpecialization[0] : caregiver.cgSpecialization) || 
                'Elderly Care';
            
            // Build location object
            const locationData = {
                address: (typeof location === 'object' ? location.address : location) || address || user.UAddress || 'Not specified',
                city: (typeof location === 'object' ? location.city : null) || user.UCity || 'Not specified',
                state: (typeof location === 'object' ? location.state : null) || user.UState || 'Not specified',
                pincode: (typeof location === 'object' ? location.pincode : null) || user.UPincode || '000000'
            };
            
            // Create booking
            const bookingData = {
                userId,
                caregiverId,
                elderName,
                elderAge: parseInt(elderAge),
                elderGender,
                cgSpecialization: finalSpecialization,
                careType: finalCareType,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                startTime: startTime || '09:00',
                endTime: endTime || '17:00',
                location: locationData,
                contactPerson: {
                    name: user.UName || 'Not specified',
                    phone: user.UPhone || 'Not specified',
                    relationship: 'Self'
                },
                message: message || notes || '',
                urgency: urgency || 'Normal',
                servicesRequired: servicesRequired || [],
                status: 'Pending', // Explicitly set status to Pending
                payment: {
                    hourlyRate: caregiver.cgCharges?.hourly || 0
                }
            };
            
            const booking = await Booking.create(bookingData);
            
            // Update caregiver's pending requests
            await Caregiver.findByIdAndUpdate(caregiverId, {
                $inc: { pendingRequests: 1 }
            });
            
            // Populate response
            const populatedBooking = await Booking.findById(booking._id)
                .populate('caregiverId', 'cgName cgSpecialization cgProfileImage')
                .populate('userId', 'UName UPhone');
            
            res.status(201).json({
                success: true,
                message: 'Booking request sent successfully',
                data: populatedBooking
            });
        } catch (error) {
            console.error('Booking creation error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get user's bookings
    async getUserBookings(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const userId = req.user.id;
            
            const query = { userId };
            if (status) {
                query.status = status;
            }
            
            const skip = (page - 1) * limit;
            
            const bookings = await Booking.find(query)
                .populate('caregiverId', 'cgName cgSpecialization cgProfileImage cgRating')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            const total = await Booking.countDocuments(query);
            
            // Categorize bookings
            const upcoming = bookings.filter(b => b.isUpcoming);
            const active = bookings.filter(b => b.isActive);
            const past = bookings.filter(b => b.isPast);
            
            res.status(200).json({
                success: true,
                count: bookings.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                categories: {
                    upcoming: upcoming.length,
                    active: active.length,
                    past: past.length
                },
                data: bookings
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get caregiver's bookings
    async getCaregiverBookings(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const caregiverId = req.user.id;
            
            const query = { caregiverId };
            if (status) {
                query.status = status;
            }
            
            const skip = (page - 1) * limit;
            
            const bookings = await Booking.find(query)
                .populate('userId', 'UName UPhone UEmail')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            const total = await Booking.countDocuments(query);
            
            // Statistics
            const pendingCount = await Booking.countDocuments({ 
                caregiverId, 
                status: 'Pending' 
            });
            
            const activeCount = await Booking.countDocuments({ 
                caregiverId, 
                status: { $in: ['Confirmed', 'Active'] } 
            });
            
            res.status(200).json({
                success: true,
                count: bookings.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                stats: {
                    pending: pendingCount,
                    active: activeCount,
                    total: total
                },
                data: bookings
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Update booking status (for caregivers)
    async updateBookingStatus(req, res) {
        try {
            const { bookingId } = req.params;
            const { status, reason } = req.body;
            const caregiverId = req.user.id;
            
            const booking = await Booking.findById(bookingId);
            
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }
            
            if (booking.caregiverId.toString() !== caregiverId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this booking'
                });
            }
            
            // Update booking status
            await booking.updateStatus(status, caregiverId, 'Caregiver', reason);
            
            // Update caregiver's stats
            if (status === 'Accepted') {
                await Caregiver.findByIdAndUpdate(caregiverId, {
                    $inc: { pendingRequests: -1 }
                });
            }
            
            if (status === 'Rejected') {
                await Caregiver.findByIdAndUpdate(caregiverId, {
                    $inc: { pendingRequests: -1 }
                });
            }
            
            if (status === 'Active') {
                await Caregiver.findByIdAndUpdate(caregiverId, {
                    isBusy: true
                });
            }
            
            if (status === 'Completed') {
                await Caregiver.findByIdAndUpdate(caregiverId, {
                    isBusy: false,
                    $inc: { 
                        bookingCount: 1,
                        completedBookings: 1 
                    }
                });
            }
            
            const updatedBooking = await Booking.findById(bookingId)
                .populate('caregiverId', 'cgName cgProfileImage')
                .populate('userId', 'UName UPhone');
            
            res.status(200).json({
                success: true,
                message: `Booking ${status.toLowerCase()} successfully`,
                data: updatedBooking
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Cancel booking (for users)
    async cancelBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { reason } = req.body;
            const userId = req.user.id;
            
            const booking = await Booking.findById(bookingId);
            
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }
            
            if (booking.userId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to cancel this booking'
                });
            }
            
            // Only allow cancellation if booking is not active or completed
            if (['Active', 'Completed'].includes(booking.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot cancel booking with status: ${booking.status}`
                });
            }
            
            await booking.updateStatus('Cancelled', userId, 'User', reason);
            
            // Update caregiver's pending requests if it was pending
            if (booking.status === 'Pending') {
                await Caregiver.findByIdAndUpdate(booking.caregiverId, {
                    $inc: { pendingRequests: -1 }
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get booking by ID
    async getBookingById(req, res) {
        try {
            const booking = await Booking.findById(req.params.id)
                .populate('caregiverId', 'cgName cgSpecialization cgProfileImage cgPhone cgRating')
                .populate('userId', 'UName UPhone UEmail');
            
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }
            
            // Check authorization
            const isAuthorized = 
                booking.userId._id.toString() === req.user.id ||
                booking.caregiverId._id.toString() === req.user.id ||
                req.user.role === 'admin';
            
            if (!isAuthorized) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this booking'
                });
            }
            
            res.status(200).json({
                success: true,
                data: booking
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new BookingController();