const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    caregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver',
        required: true
    },
    documentType: {
        type: String,
        enum: [
            'ID Proof',
            'Medical Certificate', 
            'Police Verification',
            'Resume',
            'Other Certificate',
            'Profile Image',
            'Address Proof'
        ],
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number // in bytes
    },
    fileType: {
        type: String // MIME type
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Under Review'],
        default: 'Pending'
    },
    rejectionReason: String,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    uploadDate: {
        type: Date,
        default: Date.now
    },
    expirationDate: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        documentNumber: String,
        issuedBy: String,
        issueDate: Date,
        expiryDate: Date,
        notes: String
    }
}, {
    timestamps: true
});

// Indexes
documentSchema.index({ caregiverId: 1, documentType: 1 });
documentSchema.index({ caregiverId: 1, status: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ uploadDate: -1 });

// Virtual for document status badge
documentSchema.virtual('statusBadge').get(function() {
    const badges = {
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Approved': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800',
        'Under Review': 'bg-blue-100 text-blue-800'
    };
    return badges[this.status] || 'bg-gray-100 text-gray-800';
});

module.exports = mongoose.model('Document', documentSchema);