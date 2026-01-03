const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // ========== USER & CAREGIVER INFORMATION ==========
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User ID is required']
    },

    caregiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Caregiver', 
        required: [true, 'Caregiver ID is required']
    },

    // ========== ELDER INFORMATION ==========
    elderName: { 
        type: String, 
        required: [true, 'Elder name is required'],
        trim: true
    },

    elderAge: { 
        type: Number, 
        required: [true, 'Elder age is required'],
        min: [1, 'Age must be at least 1'],
        max: [120, 'Age seems unrealistic']
    },

    elderGender: {    
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Elder gender is required']
    },

    elderMedicalConditions: [{
        condition: String,
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical']
        },
        notes: String
    }],

    // ========== SERVICE DETAILS ==========
    cgSpecialization: {
        type: String,
        required: [true, 'Specialization is required'],
        enum: [
            'Elderly Care',
            'Post-Surgery Care',
            'Dementia Care',
            'Physical Therapy',
            'Palliative Care',
            'Medication Management',
            'Mobility Assistance',
            'Companionship',
            'Meal Preparation',
            'Housekeeping',
            'Physiotherapy',
            'Nursing Care',
            'Geriatric Care',
            'Home Care'
        ]
    },

    careType: {
        type: String,
        required: [true, 'Care type is required'],
        enum: [
            'Hourly Care',
            'Daily Care', 
            'Overnight Care',
            '24/7 Live-in Care',
            'Respite Care',
            'Post-Hospitalization Care',
            'Palliative Care',
            'Companionship Only'
        ]
    },

    servicesRequired: [{
        type: String,
        enum: [
            'Medication Assistance',
            'Personal Hygiene',
            'Mobility Support',
            'Meal Preparation',
            'House Cleaning',
            'Laundry',
            'Grocery Shopping',
            'Medical Appointments',
            'Exercise Assistance',
            'Memory Care Activities'
        ]
    }],

    // ========== TIMING & DURATION ==========
    bookingDate: { 
        type: Date, 
        default: Date.now 
    },

    startDate: { 
        type: Date, 
        required: [true, 'Start date is required'],
        validate: {
            validator: function(value) {
                return value >= new Date();
            },
            message: 'Start date cannot be in the past'
        }
    },

    endDate: { 
        type: Date, 
        required: [true, 'End date is required'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },

    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format']
    },

    endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format']
    },

    recurring: {
        isRecurring: { type: Boolean, default: false },
        frequency: {
            type: String,
            enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', null]
        },
        daysOfWeek: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        endAfter: Date, // End date for recurring bookings
        occurrences: Number // Number of occurrences
    },

    totalHours: {
        type: Number,
        min: 0,
        default: 0
    },

    // ========== LOCATION & CONTACT ==========
    location: {
        address: {
            type: String,
            required: [true, 'Address is required']
        },
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        pincode: {
            type: String,
            required: [true, 'Pincode is required'],
            match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
        },
        landmark: String,
        latitude: Number,
        longitude: Number
    },

    contactPerson: {
        name: {
            type: String,
            required: [true, 'Contact person name is required']
        },
        phone: {
            type: String,
            required: [true, 'Contact phone is required']
        },
        relationship: {
            type: String,
            enum: ['Self', 'Spouse', 'Child', 'Sibling', 'Friend', 'Other'],
            required: true
        }
    },

    emergencyContact: {
        name: String,
        phone: String
    },

    // ========== URGENCY & PRIORITY ==========
    urgency: {
        type: String,
        enum: ['Normal', 'Urgent', 'Emergency'],
        default: 'Normal'
    },

    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },

    // ========== PAYMENT & CHARGES ==========
    payment: {
        hourlyRate: {
            type: Number,
            required: [true, 'Hourly rate is required'],
            min: [0, 'Hourly rate cannot be negative']
        },
        totalAmount: {
            type: Number,
            min: [0, 'Total amount cannot be negative'],
            default: 0
        },
        advancePaid: {
            type: Number,
            default: 0,
            min: 0
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Advance Paid', 'Partially Paid', 'Fully Paid', 'Refunded', 'Cancelled'],
            default: 'Pending'
        },
        paymentMethod: {
            type: String,
            enum: ['Cash', 'Online Transfer', 'UPI', 'Credit Card', 'Debit Card', 'Wallet', null],
            default: null
        },
        transactionId: String,
        paymentDate: Date
    },

    // ========== STATUS & WORKFLOW ==========
    status: { 
        type: String, 
        enum: [
            'Draft',
            'Pending',      // Sent to caregiver, waiting for response
            'Accepted',     // Caregiver accepted
            'Rejected',     // Caregiver rejected
            'Confirmed',    // Payment made, booking confirmed
            'Active',       // Service in progress
            'Completed',    // Service completed successfully
            'Cancelled',    // Booking cancelled
            'No Show',      // Caregiver didn't show up
            'Disputed'      // Issue raised
        ], 
        default: 'Draft'
    },

    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'statusHistory.changedByModel'
        },
        changedByModel: {
            type: String,
            enum: ['User', 'Caregiver', 'Admin']
        },
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // ========== COMMUNICATION & MESSAGES ==========
    message: { 
        type: String,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },

    specialInstructions: {
        type: String,
        maxlength: [500, 'Special instructions cannot exceed 500 characters']
    },

    caregiverNotes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },

    // ========== REVIEW & FEEDBACK ==========
    review: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            maxlength: [500, 'Review comment cannot exceed 500 characters']
        },
        date: Date,
        caregiverResponse: {
            comment: String,
            date: Date
        }
    },

    // ========== ATTACHMENTS ==========
    attachments: [{
        name: String,
        url: String,
        type: {
            type: String,
            enum: ['Medical Report', 'Prescription', 'ID Proof', 'Other']
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'attachments.uploadedByModel'
        },
        uploadedByModel: {
            type: String,
            enum: ['User', 'Caregiver']
        }
    }],

    // ========== REMINDERS & NOTIFICATIONS ==========
    reminders: {
        beforeStart: {
            sent: { type: Boolean, default: false },
            sentAt: Date
        },
        followUp: {
            sent: { type: Boolean, default: false },
            sentAt: Date
        }
    },

    // ========== METADATA ==========
    source: {
        type: String,
        enum: ['Web', 'Mobile App', 'Phone', 'Referral'],
        default: 'Web'
    },

    cancellationReason: {
        type: String,
        enum: [
            'Schedule Conflict',
            'Found Another Caregiver',
            'Too Expensive',
            'Not Satisfied',
            'Emergency',
            'Other',
            null
        ],
        default: null
    },

    cancellationNotes: String,

    isArchived: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== VIRTUAL PROPERTIES ==========

// Duration in days
bookingSchema.virtual('durationDays').get(function() {
    if (!this.startDate || !this.endDate) return 0;
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Is upcoming booking
bookingSchema.virtual('isUpcoming').get(function() {
    if (!this.startDate) return false;
    return this.status === 'Confirmed' && this.startDate > new Date();
});

// Is active booking
bookingSchema.virtual('isActive').get(function() {
    if (!this.startDate || !this.endDate) return false;
    const now = new Date();
    return this.status === 'Active' || (
        this.status === 'Confirmed' && 
        this.startDate <= now && 
        this.endDate >= now
    );
});

// Is past booking
bookingSchema.virtual('isPast').get(function() {
    if (!this.endDate) return false;
    return this.endDate < new Date() && ['Completed', 'Cancelled'].includes(this.status);
});

// Booking status color for UI
bookingSchema.virtual('statusColor').get(function() {
    const statusColors = {
        'Draft': 'gray',
        'Pending': 'orange',
        'Accepted': 'blue',
        'Confirmed': 'green',
        'Active': 'purple',
        'Completed': 'teal',
        'Cancelled': 'red',
        'Rejected': 'red',
        'No Show': 'red',
        'Disputed': 'red'
    };
    return statusColors[this.status] || 'gray';
});

// ========== INSTANCE METHODS ==========

// Update status with history
bookingSchema.methods.updateStatus = async function(newStatus, changedBy, changedByModel, reason = '') {
    const oldStatus = this.status;
    this.status = newStatus;
    
    this.statusHistory.push({
        status: newStatus,
        changedBy: changedBy,
        changedByModel: changedByModel,
        reason: reason,
        timestamp: new Date()
    });
    
    await this.save();
    return { oldStatus, newStatus };
};

// Calculate total amount
bookingSchema.methods.calculateTotalAmount = function() {
    if (!this.totalHours || !this.payment.hourlyRate) return 0;
    
    // Calculate based on hours and rate
    const total = this.totalHours * this.payment.hourlyRate;
    
    // Apply urgency premium (if any)
    if (this.urgency === 'Urgent') {
        return total * 1.2; // 20% premium
    } else if (this.urgency === 'Emergency') {
        return total * 1.5; // 50% premium
    }
    
    return total;
};

// Get booking summary
bookingSchema.methods.getSummary = function() {
    return {
        id: this._id,
        elderName: this.elderName,
        caregiverId: this.caregiverId,
        specialization: this.cgSpecialization,
        startDate: this.startDate,
        endDate: this.endDate,
        status: this.status,
        totalAmount: this.payment.totalAmount,
        isUpcoming: this.isUpcoming,
        isActive: this.isActive
    };
};

// ========== STATIC METHODS ==========

// Find bookings by user
bookingSchema.statics.findByUser = function(userId, status = null) {
    const query = { userId: userId };
    if (status) query.status = status;
    return this.find(query)
        .populate('caregiverId', 'cgName cgSpecialization cgRating cgProfileImage')
        .sort({ startDate: 1 });
};

// Find bookings by caregiver
bookingSchema.statics.findByCaregiver = function(caregiverId, status = null) {
    const query = { caregiverId: caregiverId };
    if (status) query.status = status;
    return this.find(query)
        .populate('userId', 'UName UPhone UEmail')
        .sort({ startDate: 1 });
};

// Find upcoming bookings
bookingSchema.statics.findUpcoming = function(limit = 10) {
    return this.find({
        status: { $in: ['Confirmed', 'Active'] },
        startDate: { $gte: new Date() }
    })
    .populate('caregiverId', 'cgName cgSpecialization')
    .populate('userId', 'UName UPhone')
    .sort({ startDate: 1 })
    .limit(limit);
};

// Find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } },
            { 
                $and: [
                    { startDate: { $lte: startDate } },
                    { endDate: { $gte: endDate } }
                ]
            }
        ]
    });
};

// ========== PRE-SAVE MIDDLEWARE ==========

// Calculate total hours before saving
bookingSchema.pre('save', function(next) {
    // Calculate total hours if we have time information
    if (this.startTime && this.endTime && this.startDate && this.endDate) {
        // This is a simplified calculation - you might want more complex logic
        const start = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
        const end = new Date(`${this.endDate.toDateString()} ${this.endTime}`);
        const hours = Math.ceil((end - start) / (1000 * 60 * 60));
        this.totalHours = Math.max(hours, 1);
        
        // Calculate total amount
        if (this.payment.hourlyRate) {
            this.payment.totalAmount = this.calculateTotalAmount();
        }
    }
    
    // Set booking date if not set
    if (!this.bookingDate) {
        this.bookingDate = new Date();
    }
    
    next();
});

// ========== INDEXES ==========

bookingSchema.index({ userId: 1 });
bookingSchema.index({ caregiverId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startDate: 1 });
bookingSchema.index({ endDate: 1 });
bookingSchema.index({ 'location.city': 1 });
bookingSchema.index({ cgSpecialization: 1 });
bookingSchema.index({ urgency: 1 });
bookingSchema.index({ 'payment.paymentStatus': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ caregiverId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);