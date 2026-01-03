// middleware/passwordHash.js
const bcrypt = require('bcryptjs');

const hashPassword = async function(next) {
    try {
        // For Caregiver password hashing
        if (this.cgPassword && !this.cgPassword.startsWith('$2a$')) {
            console.log('🔐 Hashing caregiver password...');
            const salt = await bcrypt.genSalt(10);
            this.cgPassword = await bcrypt.hash(this.cgPassword, salt);
        }
        
        // For User password hashing
        if (this.UPassword && !this.UPassword.startsWith('$2a$')) {
            console.log('🔐 Hashing user password...');
            const salt = await bcrypt.genSalt(10);
            this.UPassword = await bcrypt.hash(this.UPassword, salt);
        }
        
        // For findOneAndUpdate operations (caregiver)
        if (this._update && this._update.$set && this._update.$set.cgPassword) {
            const cgPassword = this._update.$set.cgPassword;
            if (!cgPassword.startsWith('$2a$')) {
                console.log('🔐 Hashing caregiver password in update...');
                const salt = await bcrypt.genSalt(10);
                this._update.$set.cgPassword = await bcrypt.hash(cgPassword, salt);
            }
        }
        
        // For findOneAndUpdate operations (user)
        if (this._update && this._update.$set && this._update.$set.UPassword) {
            const UPassword = this._update.$set.UPassword;
            if (!UPassword.startsWith('$2a$')) {
                console.log('🔐 Hashing user password in update...');
                const salt = await bcrypt.genSalt(10);
                this._update.$set.UPassword = await bcrypt.hash(UPassword, salt);
            }
        }
        
        next();
    } catch (error) {
        console.error('❌ Password hashing error:', error);
        next(error);
    }
};

module.exports = hashPassword;