const mongoose = require('mongoose');

const healthUpdateSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    caregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    vitalSigns: {
        bloodPressure: {
            systolic: { type: Number, min: 50, max: 250 },
            diastolic: { type: Number, min: 30, max: 150 },
            unit: { type: String, default: 'mmHg' }
        },
        bloodSugar: {
            value: { type: Number, min: 30, max: 500 },
            unit: { type: String, default: 'mg/dL' },
            type: { 
                type: String, 
                enum: ['Fasting', 'Postprandial', 'Random'],
                default: 'Random'
            }
        },
        temperature: {
            value: { type: Number, min: 35, max: 42 },
            unit: { type: String, default: '°C' }
        },
        pulseRate: {
            value: { type: Number, min: 40, max: 200 },
            unit: { type: String, default: 'BPM' }
        },
        oxygenSaturation: {
            value: { type: Number, min: 70, max: 100 },
            unit: { type: String, default: '%' }
        },
        respiratoryRate: {
            value: { type: Number, min: 10, max: 40 },
            unit: { type: String, default: 'breaths/min' }
        }
    },
    clinicalNotes: {
        type: String,
        maxlength: 2000
    },
    medicationAdministered: [{
        name: String,
        dosage: String,
        time: Date,
        notes: String
    }],
    symptoms: [String],
    diet: {
        type: String,
        maxlength: 500
    },
    activityLevel: {
        type: String,
        enum: ['Bedridden', 'Limited', 'Moderate', 'Normal', 'Active'],
        default: 'Normal'
    },
    mood: {
        type: String,
        enum: ['Poor', 'Fair', 'Good', 'Excellent'],
        default: 'Good'
    },
    sleepQuality: {
        type: String,
        enum: ['Poor', 'Fair', 'Good', 'Excellent'],
        default: 'Good'
    },
    painLevel: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },
    additionalObservations: {
        type: String,
        maxlength: 1000
    },
    files: [{
        name: String,
        url: String,
        type: String
    }],
    isCritical: {
        type: Boolean,
        default: false
    },
    requiresAttention: {
        type: Boolean,
        default: false
    },
    nextCheckup: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
healthUpdateSchema.index({ patientId: 1, createdAt: -1 });
healthUpdateSchema.index({ caregiverId: 1, createdAt: -1 });
healthUpdateSchema.index({ bookingId: 1 });
healthUpdateSchema.index({ createdAt: -1 });
healthUpdateSchema.index({ isCritical: 1 });
healthUpdateSchema.index({ requiresAttention: 1 });

// Virtual for formatted blood pressure
healthUpdateSchema.virtual('formattedBloodPressure').get(function() {
    if (this.vitalSigns?.bloodPressure) {
        return `${this.vitalSigns.bloodPressure.systolic}/${this.vitalSigns.bloodPressure.diastolic} mmHg`;
    }
    return null;
});

// Method to check if vitals are normal
healthUpdateSchema.methods.checkVitalStatus = function() {
    const status = {
        bloodPressure: 'Normal',
        bloodSugar: 'Normal',
        temperature: 'Normal',
        pulseRate: 'Normal'
    };
    
    const bp = this.vitalSigns?.bloodPressure;
    if (bp) {
        if (bp.systolic > 140 || bp.diastolic > 90) status.bloodPressure = 'High';
        else if (bp.systolic < 90 || bp.diastolic < 60) status.bloodPressure = 'Low';
    }
    
    const bs = this.vitalSigns?.bloodSugar;
    if (bs) {
        if (bs.value > 200) status.bloodSugar = 'High';
        else if (bs.value < 70) status.bloodSugar = 'Low';
    }
    
    const temp = this.vitalSigns?.temperature;
    if (temp) {
        if (temp.value > 37.5) status.temperature = 'Fever';
        else if (temp.value < 36.0) status.temperature = 'Low';
    }
    
    const pulse = this.vitalSigns?.pulseRate;
    if (pulse) {
        if (pulse.value > 100) status.pulseRate = 'High';
        else if (pulse.value < 60) status.pulseRate = 'Low';
    }
    
    return status;
};

module.exports = mongoose.model('HealthUpdate', healthUpdateSchema);