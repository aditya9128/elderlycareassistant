const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientType'
    },
    recipientType: {
        type: String,
        enum: ['User', 'Caregiver', 'Admin'],
        required: true
    },
    type: {
        type: String,
        enum: [
            'booking_request',
            'booking_accepted',
            'booking_declined',
            'booking_cancelled',
            'booking_completed',
            'payment_received',
            'payment_due',
            'health_update',
            'review_added',
            'message_received',
            'appointment_reminder',
            'verification_status',
            'system_alert',
            'promotion'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    actionUrl: String,
    expiresAt: Date
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ recipientType: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set expiresAt if not set
notificationSchema.pre('save', function(next) {
    if (!this.expiresAt) {
        // Default expiration: 30 days from creation
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.read = true;
    this.readAt = new Date();
    return this.save();
};

// Static method to mark multiple as read
notificationSchema.statics.markAllAsRead = function(recipientId, recipientType) {
    return this.updateMany(
        { recipientId, recipientType, read: false },
        { read: true, readAt: new Date() }
    );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(recipientId, recipientType) {
    return this.countDocuments({ 
        recipientId, 
        recipientType, 
        read: false 
    });
};

module.exports = mongoose.model('Notification', notificationSchema);