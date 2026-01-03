const mongoose = require('mongoose');
const hashPassword = require('../middleware/passwordHash');

const caregiverSchema = new mongoose.Schema({
    // ========== PERSONAL INFORMATION ==========
    cgName: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },

    cgEmail: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },

    cgPhone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true,
        match: [/^[+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    },

    cgPassword: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },

    cgDob: {
        type: Date,
        required: [true, 'Please provide your date of birth']
    },

    cgGender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: [true, 'Please specify your gender']
    },

    cgAddress: {
        type: String,
        required: [true, 'Please provide your address']
    },

    // ========== WORK LOCATION ==========
    cgWorkingState: {
        type: String,
        required: [true, 'Please provide working state']
    },

    cgWorkingCity: {
        type: String,
        required: [true, 'Please provide working city']
    },

    cgPincode: {
        type: String,
        match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    },

    // ========== PROFESSIONAL INFORMATION ==========
    cgExpYears: {
        type: Number,
        required: [true, 'Please provide years of experience'],
        min: [0, 'Experience cannot be negative'],
        max: [50, 'Experience seems unrealistic']
    },

    cgSpecialization: {
        type: [String], // Changed to array for multiple specializations
        required: [true, 'Please provide at least one specialization'],
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
            'Home Care',
            'Memory Care',
            'Respite Care',
            'Hospice Care',
            'Diabetes Care',
            'Stroke Recovery',
            'Parkinson Care'
        ]
    },

    cgSkills: {
        type: [String], // Changed to array
        required: [true, 'Please provide your skills'],
        default: []
    },

    cgLanguages: {
        type: [String], // Changed to array
        required: [true, 'Please provide languages you speak'],
        default: []
    },

    // ========== JOB & AVAILABILITY ==========
    jobType: {
        type: String,
        enum: ["Full-time", "Part-time", "Weekends", "Freelance", "Contract"],
        required: [true, 'Please specify job type']
    },

    availabilityDays: {
        type: [String], // Changed to array
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },

    availabilityTimings: {
        morning: { type: Boolean, default: true },
        afternoon: { type: Boolean, default: true },
        evening: { type: Boolean, default: true },
        night: { type: Boolean, default: false }
    },

    // ========== PROFILE & RATINGS ==========
    cgProfileDescription: {
        type: String,
        required: [true, 'Please provide a profile description'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    cgProfileImage: {
        type: String,
        default: 'default-caregiver.png'
    },

    cgRating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
            set: v => Math.round(v * 10) / 10 // 1 decimal place
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        breakdown: {
            5: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            1: { type: Number, default: 0 }
        },
        reviews: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                maxlength: [500, 'Review cannot exceed 500 characters']
            },
            date: {
                type: Date,
                default: Date.now
            },
            response: {
                comment: String,
                date: Date
            }
        }]
    },

    // ========== FEES & BOOKINGS ==========
    cgCharges: {
        hourly: {
            type: Number,
            required: [true, 'Please provide hourly charges'],
            min: [0, 'Charges cannot be negative']
        },
        daily: {
            type: Number,
            min: [0, 'Charges cannot be negative']
        },
        weekly: {
            type: Number,
            min: [0, 'Charges cannot be negative']
        },
        monthly: {
            type: Number,
            min: [0, 'Charges cannot be negative']
        }
    },

    pendingRequests: {
        type: Number,
        default: 0,
        min: 0
    },

    bookingCount: {
        type: Number,
        default: 0,
        min: 0
    },

    completedBookings: {
        type: Number,
        default: 0,
        min: 0
    },

    cancellationRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    isBusy: {
        type: Boolean,
        default: false
    },

    nextAvailableDate: {
        type: Date
    },

    // ========== VERIFICATION & DOCUMENTS ==========
    verified: {
        type: Boolean,
        default: false
    },

    isAuthenticated: {
        type: Boolean,
        default: false
    },

    verificationStatus: {
        email: { type: Boolean, default: false },
        phone: { type: Boolean, default: false },
        idProof: { type: Boolean, default: false },
        backgroundCheck: { type: Boolean, default: false },
        medicalCertification: { type: Boolean, default: false }
    },

    documents: {
        idProof: {
            type: String,
            required: [true, 'ID proof is required for verification']
        },
        medicalCertificate: String,
        policeVerification: String,
        resume: String,
        otherCertificates: [String]
    },

    // ========== BANK & PAYMENT INFORMATION ==========
    bankDetails: {
        bankName: {
            type: String,
            required: [true, 'Please provide bank name']
        },
        accountNumber: {
            type: String,
            required: [true, 'Please provide account number']
        },
        accountHolderName: {
            type: String,
            required: [true, 'Please provide account holder name']
        },
        ifscCode: {
            type: String,
            required: [true, 'Please provide IFSC code'],
            match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please provide a valid IFSC code']
        },
        upiId: String
    },

    // ========== PREFERENCES & SETTINGS ==========
    preferences: {
        maxDistance: { // in km
            type: Number,
            default: 20
        },
        preferredJobTypes: [String],
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        },
        notificationSettings: {
            email: {
                newRequests: { type: Boolean, default: true },
                bookingUpdates: { type: Boolean, default: true },
                reviews: { type: Boolean, default: true },
                payments: { type: Boolean, default: true }
            },
            sms: {
                newRequests: { type: Boolean, default: false },
                urgentAlerts: { type: Boolean, default: true }
            },
            push: {
                newRequests: { type: Boolean, default: true },
                messages: { type: Boolean, default: true }
            }
        }
    },

    // ========== STATISTICS & PERFORMANCE ==========
    statistics: {
        responseTime: { // average in hours
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        repeatClients: {
            type: Number,
            default: 0
        },
        lastActive: {
            type: Date,
            default: Date.now
        }
    },

    // ========== ACCOUNT STATUS ==========
    isActive: {
        type: Boolean,
        default: true
    },

    suspensionReason: String,
    suspensionEndDate: Date,

    // ========== SECURITY ==========
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    lockUntil: {
        type: Date,
        select: false
    },

    // ========== METADATA ==========
    signupSource: {
        type: String,
        enum: ['Web', 'Mobile', 'Agency', 'Referral'],
        default: 'Web'
    },

    referralCode: String,
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== VIRTUAL PROPERTIES ==========

// Calculate age
caregiverSchema.virtual('age').get(function() {
    if (!this.cgDob) return null;
    
    const today = new Date();
    const birthDate = new Date(this.cgDob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Full work location
caregiverSchema.virtual('fullWorkLocation').get(function() {
    return `${this.cgWorkingCity}, ${this.cgWorkingState}`;
});

// Experience level
caregiverSchema.virtual('experienceLevel').get(function() {
    if (!this.cgExpYears) return 'Beginner';
    
    if (this.cgExpYears < 2) return 'Beginner';
    if (this.cgExpYears < 5) return 'Intermediate';
    if (this.cgExpYears < 10) return 'Experienced';
    return 'Expert';
});

// Rating category
caregiverSchema.virtual('ratingCategory').get(function() {
    if (!this.cgRating?.average) return 'Not Rated';
    
    const rating = this.cgRating.average;
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'Below Average';
});

// Availability status
caregiverSchema.virtual('availabilityStatus').get(function() {
    if (this.isBusy) return 'Busy';
    if (this.pendingRequests >= 5) return 'Limited Availability';
    return 'Available';
});

// ========== INSTANCE METHODS ==========

// Add review and update rating
caregiverSchema.methods.addReview = async function(userId, rating, comment) {
    const review = {
        user: userId,
        rating: rating,
        comment: comment
    };
    
    this.cgRating.reviews.push(review);
    
    // Update rating breakdown
    this.cgRating.breakdown[rating] = (this.cgRating.breakdown[rating] || 0) + 1;
    this.cgRating.totalRatings += 1;
    
    // Calculate new average
    const totalScore = Object.entries(this.cgRating.breakdown).reduce((sum, [stars, count]) => {
        return sum + (parseInt(stars) * count);
    }, 0);
    
    this.cgRating.average = totalScore / this.cgRating.totalRatings;
    
    await this.save();
    return this.cgRating;
};

// Check availability for date
caregiverSchema.methods.isAvailableOnDate = function(date) {
    if (this.isBusy) return false;
    
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    return this.availabilityDays.includes(day);
};

// Get profile summary
caregiverSchema.methods.getProfileSummary = function() {
    return {
        name: this.cgName,
        specialization: this.cgSpecialization,
        experience: this.cgExpYears,
        rating: this.cgRating.average,
        charges: this.cgCharges.hourly,
        city: this.cgWorkingCity,
        availability: this.availabilityStatus
    };
};

// ========== STATIC METHODS ==========

// Find caregivers by specialization
caregiverSchema.statics.findBySpecialization = function(specialization) {
    return this.find({ cgSpecialization: { $in: [specialization] } });
};

// Find caregivers by city
caregiverSchema.statics.findByCity = function(city) {
    return this.find({ cgWorkingCity: new RegExp(city, 'i') });
};

// Find top-rated caregivers
caregiverSchema.statics.findTopRated = function(limit = 10) {
    return this.find({ 
        'cgRating.totalRatings': { $gte: 5 },
        'cgRating.average': { $gte: 4.0 }
    })
    .sort({ 'cgRating.average': -1, 'cgRating.totalRatings': -1 })
    .limit(limit);
};

// Find available caregivers
caregiverSchema.statics.findAvailable = function() {
    return this.find({ 
        isBusy: false,
        isActive: true,
        verified: true
    });
};

// ========== INDEXES ==========

caregiverSchema.index({ cgEmail: 1 }, { unique: true });
caregiverSchema.index({ cgPhone: 1 }, { unique: true });
caregiverSchema.index({ cgWorkingCity: 1 });
caregiverSchema.index({ cgWorkingState: 1 });
caregiverSchema.index({ cgSpecialization: 1 });
caregiverSchema.index({ 'cgRating.average': -1 });
caregiverSchema.index({ cgCharges: 1 });
caregiverSchema.index({ isBusy: 1 });
caregiverSchema.index({ verified: 1 });
caregiverSchema.index({ createdAt: -1 });
caregiverSchema.index({ lastLogin: -1 });

// ========== PRE-SAVE MIDDLEWARE ==========

// Update nextAvailableDate if busy
caregiverSchema.pre('save', function(next) {
    if (this.isBusy && !this.nextAvailableDate) {
        // Set next available date to 3 days from now
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 3);
        this.nextAvailableDate = nextDate;
    }
    next();
});

// In Caregiver.js model, add this pre-save middleware:
caregiverSchema.pre('save', function(next) {
    // Handle cgCharges if it comes in as just hourly rate
    if (this.cgCharges && typeof this.cgCharges === 'object') {
        // If only hourly is provided, calculate others
        if (this.cgCharges.hourly && !this.cgCharges.daily) {
            const hourly = parseFloat(this.cgCharges.hourly);
            this.cgCharges = {
                hourly: hourly,
                daily: hourly * 8,    // 8 hours per day
                weekly: hourly * 8 * 6, // 6 days per week
                monthly: hourly * 8 * 6 * 4 // 4 weeks per month
            };
        }
    } else if (typeof this.cgCharges === 'number') {
        // If it's just a number, convert to object
        const hourly = this.cgCharges;
        this.cgCharges = {
            hourly: hourly,
            daily: hourly * 8,
            weekly: hourly * 8 * 6,
            monthly: hourly * 8 * 6 * 4
        };
    }
    
    next();
});

// Update lastActive on certain operations
caregiverSchema.pre('findOneAndUpdate', function(next) {
    this.set({ 'statistics.lastActive': new Date() });
    next();
});

caregiverSchema.pre('save', hashPassword);
caregiverSchema.pre('findOneAndUpdate', hashPassword);

module.exports = mongoose.model('Caregiver', caregiverSchema);