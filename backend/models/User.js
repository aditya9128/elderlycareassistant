const mongoose = require('mongoose');
const hashPassword = require('../middleware/passwordHash');

const userSchema = new mongoose.Schema({
    // Personal Information (From Your Original)
    UName: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },

    UDob: {
        type: Date,
        required: [true, 'Please provide your date of birth']
    },

    UGender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: [true, 'Please specify your gender']
    },

    UEmail: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },

    UPhone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true,
        match: [
            /^[+]?[1-9][\d]{0,15}$/,
            'Please provide a valid phone number'
        ]
    },

    // Address (From Your Original)
    UStreet: {
        type: String,
        required: [true, 'Please provide your street address']
    },

    UCity: {
        type: String,
        required: [true, 'Please provide your city']
    },

    UState: {
        type: String,
        required: [true, 'Please provide your state']
    },

    UPincode: {
        type: String,
        required: [true, 'Please provide your pincode'],
        match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    },

    UPassword: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },

    // Profile Information (From Dashboard)
    UProfileImage: {
        type: String,
        default: 'default-user.png'
    },

    // Account Status & Security
    isActive: {
        type: Boolean,
        default: true
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    isPhoneVerified: {
        type: Boolean,
        default: false
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    emailVerifyToken: String,
    emailVerifyExpire: Date,

    lastLogin: Date,

    // Health Information (From Dashboard - Health Metrics)
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', null],
        default: null
    },

    medicalConditions: [{
        condition: {
            type: String,
            required: true
        },
        diagnosedDate: Date,
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical']
        },
        notes: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    allergies: [{
        allergen: String,
        reaction: String,
        severity: {
            type: String,
            enum: ['Mild', 'Moderate', 'Severe']
        }
    }],

    // Emergency Contacts (From Dashboard - Emergency Panel)
    emergencyContacts: [{
        name: {
            type: String,
            required: true
        },
        relationship: {
            type: String,
            enum: ['Spouse', 'Child', 'Sibling', 'Friend', 'Neighbor', 'Other']
        },
        phone: {
            type: String,
            required: true
        },
        email: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],

    // Medical Preferences (From Dashboard - Settings)
    preferredHospitals: [{
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital'
        },
        name: String,
        distance: Number // in km
    }],

    preferredPharmacies: [{
        name: String,
        address: String,
        phone: String
    }],

    // Health Metrics Tracking (From Dashboard - Health Metrics)
    healthMetrics: {
        bloodPressure: {
            systolic: Number, // top number
            diastolic: Number, // bottom number
            lastUpdated: Date
        },
        bloodSugar: {
            fasting: Number, // mg/dL
            postPrandial: Number, // mg/dL
            lastUpdated: Date
        },
        weight: {
            value: Number, // in kg
            lastUpdated: Date
        },
        height: Number, // in cm
        bmi: Number,
        lastCheckup: Date
    },

    // Reminder Preferences (From Dashboard - Medical Reminders)
    reminderSettings: {
        medicationReminders: {
            enabled: {
                type: Boolean,
                default: true
            },
            advanceTime: { // minutes before
                type: Number,
                default: 15
            }
        },
        appointmentReminders: {
            enabled: {
                type: Boolean,
                default: true
            },
            advanceTime: { // hours before
                type: Number,
                default: 24
            }
        },
        voiceAssistance: {
            enabled: {
                type: Boolean,
                default: false
            },
            language: {
                type: String,
                default: 'English'
            }
        }
    },

    // Notification Preferences
    notificationSettings: {
        email: {
            reminders: { type: Boolean, default: true },
            appointments: { type: Boolean, default: true },
            caregiverUpdates: { type: Boolean, default: true },
            healthTips: { type: Boolean, default: true }
        },
        sms: {
            reminders: { type: Boolean, default: false },
            appointments: { type: Boolean, default: false },
            emergency: { type: Boolean, default: true }
        },
        push: {
            reminders: { type: Boolean, default: true },
            appointments: { type: Boolean, default: true },
            caregiverMessages: { type: Boolean, default: true }
        }
    },

    // Caregiver Preferences (From Dashboard - Find Caregivers)
    caregiverPreferences: {
        genderPreference: {
            type: String,
            enum: ['Male', 'Female', 'No Preference', null],
            default: null
        },
        languagePreference: [String],
        experienceMin: {
            type: Number,
            default: 0
        },
        specializations: [String]
    },

    // Subscription/Premium Features
    subscription: {
        plan: {
            type: String,
            enum: ['Free', 'Basic', 'Premium', 'Family'],
            default: 'Free'
        },
        startDate: Date,
        endDate: Date,
        autoRenew: {
            type: Boolean,
            default: false
        }
    },

    // Activity Tracking (From Dashboard - Recent Activity)
    lastActivity: {
        type: Date,
        default: Date.now
    },

    // Privacy Settings
    privacySettings: {
        profileVisibility: {
            type: String,
            enum: ['Public', 'Caregivers Only', 'Private'],
            default: 'Caregivers Only'
        },
        healthDataSharing: {
            type: String,
            enum: ['Full', 'Limited', 'Emergency Only', 'None'],
            default: 'Limited'
        }
    },

    // Metadata
    signupSource: {
        type: String,
        enum: ['Web', 'Mobile', 'Referral', 'Other'],
        default: 'Web'
    },

    referralCode: String,
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== VIRTUAL PROPERTIES ==========

// Calculate age from DOB
userSchema.virtual('age').get(function() {
    if (!this.UDob) return null;
    
    const today = new Date();
    const birthDate = new Date(this.UDob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Full address
userSchema.virtual('fullAddress').get(function() {
    return `${this.UStreet}, ${this.UCity}, ${this.UState} - ${this.UPincode}`;
});

// Health status based on metrics
userSchema.virtual('healthStatus').get(function() {
    if (!this.healthMetrics) return 'Unknown';
    
    const bp = this.healthMetrics.bloodPressure;
    const sugar = this.healthMetrics.bloodSugar;
    
    if (!bp || !sugar) return 'Needs Assessment';
    
    // Simple health assessment
    if (bp.systolic > 140 || bp.diastolic > 90 || sugar.fasting > 126) {
        return 'Needs Attention';
    } else if (bp.systolic > 120 || bp.diastolic > 80 || sugar.fasting > 100) {
        return 'Monitor';
    } else {
        return 'Good';
    }
});

// Primary emergency contact
userSchema.virtual('primaryEmergencyContact').get(function() {
    if (!this.emergencyContacts || this.emergencyContacts.length === 0) {
        return null;
    }
    
    const primary = this.emergencyContacts.find(contact => contact.isPrimary);
    return primary || this.emergencyContacts[0];
});

// ========== INSTANCE METHODS ==========

// Check if senior citizen (60+ years)
userSchema.methods.isSeniorCitizen = function() {
    return this.age >= 60;
};

// Get health summary
userSchema.methods.getHealthSummary = function() {
    return {
        age: this.age,
        bloodGroup: this.bloodGroup,
        healthStatus: this.healthStatus,
        conditionsCount: this.medicalConditions?.length || 0,
        lastCheckup: this.healthMetrics?.lastCheckup || null,
        bmi: this.healthMetrics?.bmi || null
    };
};

// ========== STATIC METHODS ==========

// Find users by city
userSchema.statics.findByCity = function(city) {
    return this.find({ UCity: new RegExp(city, 'i') });
};

// Find seniors (60+)
userSchema.statics.findSeniors = function() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 60);
    return this.find({ UDob: { $lte: cutoffDate } });
};

// In User.js model - Ensure these virtual properties exist:

userSchema.virtual('age').get(function() {
    if (!this.UDob) return null;
    
    const today = new Date();
    const birthDate = new Date(this.UDob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

userSchema.virtual('healthStatus').get(function() {
    if (!this.healthMetrics) return 'Unknown';
    
    const bp = this.healthMetrics.bloodPressure;
    const sugar = this.healthMetrics.bloodSugar;
    
    if (!bp || !sugar) return 'Needs Assessment';
    
    // Simple health assessment
    if (bp.systolic > 140 || bp.diastolic > 90 || sugar.fasting > 126) {
        return 'Needs Attention';
    } else if (bp.systolic > 120 || bp.diastolic > 80 || sugar.fasting > 100) {
        return 'Monitor';
    } else {
        return 'Good';
    }
});

// ========== INDEXES ==========

userSchema.index({ UEmail: 1 }, { unique: true });
userSchema.index({ UPhone: 1 }, { unique: true });
userSchema.index({ UCity: 1 });
userSchema.index({ UState: 1 });
userSchema.index({ UPincode: 1 });
userSchema.index({ 'emergencyContacts.phone': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// ========== PRE-SAVE MIDDLEWARE ==========

// Calculate BMI if weight/height updated
userSchema.pre('save', function(next) {
    if (this.healthMetrics && this.healthMetrics.weight && this.healthMetrics.height) {
        const heightInMeters = this.healthMetrics.height / 100;
        this.healthMetrics.bmi = this.healthMetrics.weight / (heightInMeters * heightInMeters);
    }
    next();
});

// Update lastActivity on certain operations
userSchema.pre('findOneAndUpdate', function(next) {
    this.set({ 'lastActivity': new Date() });
    next();
});


userSchema.pre('save', hashPassword);
userSchema.pre('findOneAndUpdate', hashPassword);

module.exports = mongoose.model('User', userSchema);