const mongoose = require('mongoose');

const medicalReminderSchema = new mongoose.Schema({
    // ========== USER & BASIC INFORMATION ==========
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },

    title: {
        type: String,
        required: [true, 'Reminder title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },

    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Medication',
            'Doctor Appointment',
            'Health Checkup',
            'Exercise',
            'Meal',
            'Water Intake',
            'Sleep',
            'Vaccination',
            'Lab Test',
            'Therapy',
            'Follow-up',
            'Other'
        ],
        default: 'Medication'
    },

    // ========== MEDICATION SPECIFIC FIELDS ==========
    medicineName: {
        type: String,
        required: function() {
            return this.category === 'Medication';
        },
        trim: true
    },

    dosage: {
        quantity: {
            type: Number,
            min: [0, 'Dosage quantity cannot be negative']
        },
        unit: {
            type: String,
            enum: ['mg', 'ml', 'tablet', 'capsule', 'spoon', 'drop', 'inhalation', 'injection', null]
        },
        frequency: {
            type: String,
            enum: ['Once', 'Twice', 'Thrice', 'Four Times', 'As Needed', 'Every Hour', null]
        }
    },

    dosageInfo: {
        type: String,
        maxlength: [200, 'Dosage info cannot exceed 200 characters']
    },

    medicineType: {
        type: String,
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Cream', 'Drops', 'Other', null]
    },

    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },

    // ========== TIMING & SCHEDULE ==========
    scheduleType: {
        type: String,
        required: [true, 'Schedule type is required'],
        enum: ['One-time', 'Daily', 'Weekly', 'Monthly', 'Custom', 'Interval'],
        default: 'Daily'
    },

    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        default: Date.now,
        validate: {
            validator: function(value) {
                return value >= new Date();
            },
            message: 'Start date cannot be in the past'
        }
    },

    endDate: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },

    // For one-time reminders
    reminderDateTime: {
        type: Date,
        required: function() {
            return this.scheduleType === 'One-time';
        },
        validate: {
            validator: function(value) {
                return value >= new Date();
            },
            message: 'Reminder date/time cannot be in the past'
        }
    },

    // For recurring reminders
    times: [{
        time: {
            type: String,
            required: [true, 'Time is required for recurring reminders'],
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format']
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // For weekly reminders
    daysOfWeek: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],

    // For interval reminders (every X hours/days)
    interval: {
        value: {
            type: Number,
            min: [1, 'Interval must be at least 1']
        },
        unit: {
            type: String,
            enum: ['hours', 'days', 'weeks', 'months']
        }
    },

    // ========== DURATION & FREQUENCY ==========
    duration: {
        value: {
            type: Number,
            min: [1, 'Duration must be at least 1']
        },
        unit: {
            type: String,
            enum: ['days', 'weeks', 'months', 'indefinite']
        }
    },

    frequency: {
        type: String,
        enum: ['Before Meal', 'After Meal', 'With Meal', 'Empty Stomach', 'Bedtime', 'Morning', 'Anytime', null]
    },

    // ========== NOTIFICATION SETTINGS ==========
    notifications: {
        email: {
            enabled: { type: Boolean, default: true },
            notifyingMail: {
                type: String,
                match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
            }
        },
        sms: {
            enabled: { type: Boolean, default: false },
            phone: {
                type: String,
                match: [/^[+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
            }
        },
        push: {
            enabled: { type: Boolean, default: true }
        },
        advanceTime: { // minutes before
            type: Number,
            default: 15,
            min: [0, 'Advance time cannot be negative'],
            max: [1440, 'Advance time cannot exceed 24 hours']
        },
        sound: {
            type: String,
            default: 'default',
            enum: ['default', 'gentle', 'urgent', 'chime', 'bell', 'silent']
        },
        vibration: {
            type: Boolean,
            default: true
        }
    },

    // ========== STATUS & TRACKING ==========
    status: {
        type: String,
        enum: ['Active', 'Paused', 'Completed', 'Cancelled', 'Expired'],
        default: 'Active'
    },

    isActive: {
        type: Boolean,
        default: true
    },

    lastTriggered: {
        type: Date
    },

    nextReminder: {
        type: Date,
        index: true
    },

    completionHistory: [{
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
        },
        status: {
            type: String,
            enum: ['Taken', 'Skipped', 'Missed', 'Delayed'],
            required: true
        },
        notes: {
            type: String,
            maxlength: [200, 'Notes cannot exceed 200 characters']
        },
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'completionHistory.confirmedByModel'
        },
        confirmedByModel: {
            type: String,
            enum: ['User', 'Caregiver', 'Family Member']
        }
    }],

    streak: {
        current: {
            type: Number,
            default: 0,
            min: 0
        },
        longest: {
            type: Number,
            default: 0,
            min: 0
        },
        lastUpdated: {
            type: Date
        }
    },

    // ========== HEALTH IMPACT ==========
    healthImpact: {
        monitored: {
            type: Boolean,
            default: false
        },
        parameters: [{
            name: {
                type: String,
                enum: ['Blood Pressure', 'Blood Sugar', 'Heart Rate', 'Weight', 'Pain Level', 'Mood', 'Energy Level']
            },
            before: {
                value: Number,
                unit: String
            },
            after: {
                value: Number,
                unit: String
            }
        }]
    },

    // ========== CAREGIVER & FAMILY INVOLVEMENT ==========
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'sharedWith.userModel'
        },
        userModel: {
            type: String,
            enum: ['User', 'Caregiver']
        },
        accessLevel: {
            type: String,
            enum: ['View Only', 'Can Mark Complete', 'Full Access'],
            default: 'View Only'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],

    caregiverAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver'
    },

    // ========== ATTACHMENTS ==========
    attachments: [{
        name: String,
        url: String,
        type: {
            type: String,
            enum: ['Prescription', 'Medicine Photo', 'Doctor Note', 'Instruction', 'Other']
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // ========== IMPORTANCE & PRIORITY ==========
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },

    importance: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },

    // ========== ADDITIONAL FIELDS ==========
    location: {
        type: String,
        maxlength: [200, 'Location cannot exceed 200 characters']
    },

    doctorName: {
        type: String,
        trim: true
    },

    doctorContact: {
        type: String,
        match: [/^[+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    },

    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },

    // ========== METADATA ==========
    source: {
        type: String,
        enum: ['Manual', 'Prescription Scan', 'Doctor Portal', 'Caregiver', 'Family Member'],
        default: 'Manual'
    },

    tags: [String],

    isArchived: {
        type: Boolean,
        default: false
    },

    archivedAt: Date,

    version: {
        type: Number,
        default: 1
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== VIRTUAL PROPERTIES ==========

// Check if reminder is due
medicalReminderSchema.virtual('isDue').get(function() {
    if (!this.nextReminder || this.status !== 'Active') return false;
    return this.nextReminder <= new Date();
});

// Days remaining
medicalReminderSchema.virtual('daysRemaining').get(function() {
    if (!this.endDate) return null;
    const today = new Date();
    const diffTime = this.endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Completion rate
medicalReminderSchema.virtual('completionRate').get(function() {
    if (!this.completionHistory || this.completionHistory.length === 0) return 0;
    
    const taken = this.completionHistory.filter(item => item.status === 'Taken').length;
    return (taken / this.completionHistory.length) * 100;
});

// Next reminder time in readable format
medicalReminderSchema.virtual('nextReminderReadable').get(function() {
    if (!this.nextReminder) return 'Not scheduled';
    
    const now = new Date();
    const reminderTime = new Date(this.nextReminder);
    const diffMs = reminderTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Overdue';
    if (diffHours < 1) return 'In less than an hour';
    if (diffHours < 24) return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
});

// Status color for UI
medicalReminderSchema.virtual('statusColor').get(function() {
    const colors = {
        'Active': 'green',
        'Paused': 'yellow',
        'Completed': 'blue',
        'Cancelled': 'red',
        'Expired': 'gray'
    };
    return colors[this.status] || 'gray';
});

// Priority color for UI
medicalReminderSchema.virtual('priorityColor').get(function() {
    const colors = {
        'Low': 'gray',
        'Medium': 'blue',
        'High': 'orange',
        'Critical': 'red'
    };
    return colors[this.priority] || 'gray';
});

// ========== INSTANCE METHODS ==========

// Mark as completed
medicalReminderSchema.methods.markAsCompleted = async function(status = 'Taken', notes = '', confirmedBy = null, confirmedByModel = 'User') {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    this.completionHistory.push({
        date: now,
        time: currentTime,
        status: status,
        notes: notes,
        confirmedBy: confirmedBy,
        confirmedByModel: confirmedByModel
    });
    
    // Update streak
    if (status === 'Taken') {
        this.streak.current += 1;
        if (this.streak.current > this.streak.longest) {
            this.streak.longest = this.streak.current;
        }
        this.streak.lastUpdated = now;
    } else if (status === 'Missed' || status === 'Skipped') {
        this.streak.current = 0;
    }
    
    this.lastTriggered = now;
    
    // Calculate next reminder if recurring
    if (this.scheduleType !== 'One-time' && this.isActive) {
        this.calculateNextReminder();
    }
    
    await this.save();
    return this;
};

// Calculate next reminder time
medicalReminderSchema.methods.calculateNextReminder = function() {
    if (this.scheduleType === 'One-time' || !this.isActive) {
        this.nextReminder = null;
        return;
    }
    
    const now = new Date();
    let nextDate = new Date();
    
    switch (this.scheduleType) {
        case 'Daily':
            // Find next active time slot today or tomorrow
            const currentTime = now.toTimeString().substring(0, 5);
            const todayTimes = this.times
                .filter(t => t.isActive)
                .map(t => t.time)
                .sort();
            
            let nextTime = todayTimes.find(time => time > currentTime);
            
            if (nextTime) {
                nextDate.setHours(parseInt(nextTime.split(':')[0]));
                nextDate.setMinutes(parseInt(nextTime.split(':')[1]));
            } else {
                // Next day first time
                nextDate.setDate(nextDate.getDate() + 1);
                const firstTime = todayTimes[0];
                if (firstTime) {
                    nextDate.setHours(parseInt(firstTime.split(':')[0]));
                    nextDate.setMinutes(parseInt(firstTime.split(':')[1]));
                }
            }
            break;
            
        case 'Weekly':
            // Simplified - next occurrence on same day next week
            nextDate.setDate(nextDate.getDate() + 7);
            break;
            
        case 'Monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
            
        case 'Interval':
            if (this.interval && this.interval.value && this.interval.unit) {
                const unitMap = {
                    'hours': 1000 * 60 * 60,
                    'days': 1000 * 60 * 60 * 24,
                    'weeks': 1000 * 60 * 60 * 24 * 7,
                    'months': 1000 * 60 * 60 * 24 * 30
                };
                const intervalMs = this.interval.value * (unitMap[this.interval.unit] || 0);
                nextDate = new Date(now.getTime() + intervalMs);
            }
            break;
    }
    
    this.nextReminder = nextDate;
};

// Get reminder summary
medicalReminderSchema.methods.getSummary = function() {
    return {
        id: this._id,
        title: this.title,
        category: this.category,
        status: this.status,
        priority: this.priority,
        nextReminder: this.nextReminder,
        isDue: this.isDue,
        completionRate: this.completionRate,
        streak: this.streak.current
    };
};

// ========== STATIC METHODS ==========

// Find active reminders for user
medicalReminderSchema.statics.findActiveForUser = function(userId) {
    return this.find({
        userId: userId,
        isActive: true,
        status: 'Active',
        nextReminder: { $gte: new Date() }
    }).sort({ nextReminder: 1 });
};

// Find due reminders
medicalReminderSchema.statics.findDueReminders = function() {
    return this.find({
        isActive: true,
        status: 'Active',
        nextReminder: { $lte: new Date() }
    }).populate('userId', 'UName UPhone UEmail');
};

// Find reminders by category
medicalReminderSchema.statics.findByCategory = function(userId, category) {
    return this.find({
        userId: userId,
        category: category,
        isActive: true
    }).sort({ priority: -1, nextReminder: 1 });
};

// Find high priority reminders
medicalReminderSchema.statics.findHighPriority = function(userId) {
    return this.find({
        userId: userId,
        priority: { $in: ['High', 'Critical'] },
        isActive: true
    }).sort({ nextReminder: 1 });
};

// Get reminder statistics
medicalReminderSchema.statics.getStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                    $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
                },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                },
                byCategory: { $push: '$category' }
            }
        }
    ]);
    
    return stats[0] || { total: 0, active: 0, completed: 0, byCategory: [] };
};

// ========== PRE-SAVE MIDDLEWARE ==========

// Calculate next reminder before saving
medicalReminderSchema.pre('save', function(next) {
    // Set next reminder if not set
    if (this.isActive && this.status === 'Active' && !this.nextReminder) {
        this.calculateNextReminder();
    }
    
    // Update isActive based on status
    if (['Completed', 'Cancelled', 'Expired'].includes(this.status)) {
        this.isActive = false;
    }
    
    // Set archivedAt if archived
    if (this.isArchived && !this.archivedAt) {
        this.archivedAt = new Date();
    }
    
    next();
});

// ========== INDEXES ==========

medicalReminderSchema.index({ userId: 1 });
medicalReminderSchema.index({ nextReminder: 1 });
medicalReminderSchema.index({ status: 1 });
medicalReminderSchema.index({ category: 1 });
medicalReminderSchema.index({ priority: 1 });
medicalReminderSchema.index({ isActive: 1 });
medicalReminderSchema.index({ 'sharedWith.user': 1 });
medicalReminderSchema.index({ caregiverAssigned: 1 });
medicalReminderSchema.index({ userId: 1, status: 1 });
medicalReminderSchema.index({ userId: 1, isActive: 1 });
medicalReminderSchema.index({ nextReminder: 1, status: 1 });
medicalReminderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MedicalReminder', medicalReminderSchema);