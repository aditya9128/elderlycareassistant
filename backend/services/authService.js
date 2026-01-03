const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthService {
    
    // User Registration
    async registerUser(userData) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [
                    { UEmail: userData.UEmail },
                    { UPhone: userData.UPhone }
                ]
            });

            if (existingUser) {
                throw new Error('User with this email or phone already exists');
            }

            // Create new user
            const user = await User.create(userData);

            // Generate tokens
            const tokens = this.generateTokens(user._id, 'user');

            return {
                success: true,
                user: this.sanitizeUser(user),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };

        } catch (error) {
            throw new Error(`Registration failed: ${error.message}`);
        }
    }

    // User Login
    async loginUser(email, password) {
        try {
            // Find user by email with password selected
            const user = await User.findOne({ UEmail: email }).select('+UPassword');

            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated. Please contact support.');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.UPassword);

            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });

            // Generate tokens
            const tokens = this.generateTokens(user._id, 'user');

            return {
                success: true,
                user: this.sanitizeUser(user),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };

        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    // Caregiver Registration
    async registerCaregiver(caregiverData) {
        try {
            // Check if caregiver already exists
            const existingCaregiver = await Caregiver.findOne({ 
                $or: [
                    { cgEmail: caregiverData.cgEmail },
                    { cgPhone: caregiverData.cgPhone }
                ]
            });

            if (existingCaregiver) {
                throw new Error('Caregiver with this email or phone already exists');
            }

            // Create new caregiver
            const caregiver = await Caregiver.create(caregiverData);

            // Generate tokens
            const tokens = this.generateTokens(caregiver._id, 'caregiver');

            return {
                success: true,
                user: this.sanitizeCaregiver(caregiver),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };

        } catch (error) {
            throw new Error(`Caregiver registration failed: ${error.message}`);
        }
    }

    // Caregiver Login
    async loginCaregiver(email, password) {
        try {
            // Find caregiver by email with password selected
            const caregiver = await Caregiver.findOne({ cgEmail: email }).select('+cgPassword');

            if (!caregiver) {
                throw new Error('Invalid email or password');
            }

            // Check if caregiver is active
            if (!caregiver.isActive) {
                throw new Error('Account is deactivated. Please contact support.');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, caregiver.cgPassword);

            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Update last login
            caregiver.lastLogin = new Date();
            await caregiver.save({ validateBeforeSave: false });

            // Generate tokens
            const tokens = this.generateTokens(caregiver._id, 'caregiver');

            return {
                success: true,
                user: this.sanitizeCaregiver(caregiver),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };

        } catch (error) {
            throw new Error(`Caregiver login failed: ${error.message}`);
        }
    }

    // Generate both access and refresh tokens
    generateTokens(userId, role) {
        const accessToken = jwt.sign(
            { 
                userId: userId,
                role: role
            },
            process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
        );

        const refreshToken = jwt.sign(
            { 
                userId: userId,
                role: role,
                type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
        );

        return { accessToken, refreshToken };
    }

    // Generate access token only (for refresh token endpoint)
    generateAccessToken(userId, role) {
        return jwt.sign(
            { 
                userId: userId,
                role: role
            },
            process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
        );
    }

    // Verify access token
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token expired');
            }
            throw new Error('Invalid access token');
        }
    }

    // Verify refresh token
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            }
            throw new Error('Invalid refresh token');
        }
    }

    // Refresh access token using refresh token
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = this.verifyRefreshToken(refreshToken);
            
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // Check if user still exists and is active
            let user;
            if (decoded.role === 'user') {
                user = await User.findById(decoded.userId).select('_id isActive');
            } else if (decoded.role === 'caregiver') {
                user = await Caregiver.findById(decoded.userId).select('_id isActive');
            } else {
                throw new Error('Invalid user role');
            }

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            // Generate new access token
            const newAccessToken = this.generateAccessToken(decoded.userId, decoded.role);

            return { accessToken: newAccessToken };

        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }

    // Generate Password Reset Token
    async generatePasswordResetToken(email, userType = 'user') {
        try {
            let user;
            
            if (userType === 'user') {
                user = await User.findOne({ UEmail: email });
            } else {
                user = await Caregiver.findOne({ cgEmail: email });
            }

            if (!user) {
                throw new Error('User not found with this email');
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // Hash token and save to database
            const passwordResetToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Set token and expiry (15 minutes)
            user.resetPasswordToken = passwordResetToken;
            user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
            
            await user.save({ validateBeforeSave: false });

            return resetToken;

        } catch (error) {
            throw new Error(`Password reset failed: ${error.message}`);
        }
    }

    // Reset Password
    async resetPassword(token, newPassword, userType = 'user') {
        try {
            const passwordResetToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            let user;
            
            if (userType === 'user') {
                user = await User.findOne({
                    resetPasswordToken: passwordResetToken,
                    resetPasswordExpire: { $gt: Date.now() }
                });
            } else {
                user = await Caregiver.findOne({
                    resetPasswordToken: passwordResetToken,
                    resetPasswordExpire: { $gt: Date.now() }
                });
            }

            if (!user) {
                throw new Error('Invalid or expired reset token');
            }

            // Set new password (models handle hashing via pre-save middleware)
            if (userType === 'user') {
                user.UPassword = newPassword;
            } else {
                user.cgPassword = newPassword;
            }
            
            // Clear reset token fields
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            
            await user.save();

            return true;

        } catch (error) {
            throw new Error(`Password reset failed: ${error.message}`);
        }
    }

    // Change Password (for logged-in users)
    async changePassword(userId, role, currentPassword, newPassword) {
        try {
            let user;
            
            if (role === 'user') {
                user = await User.findById(userId).select('+UPassword');
            } else if (role === 'caregiver') {
                user = await Caregiver.findById(userId).select('+cgPassword');
            } else {
                throw new Error('Invalid user role');
            }

            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const passwordField = role === 'user' ? 'UPassword' : 'cgPassword';
            const isPasswordValid = await bcrypt.compare(currentPassword, user[passwordField]);

            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Set new password (models handle hashing via pre-save middleware)
            user[passwordField] = newPassword;
            await user.save();

            return true;

        } catch (error) {
            throw new Error(`Password change failed: ${error.message}`);
        }
    }

    // Get Current User
    async getCurrentUser(userId, userType) {
        try {
            let user;
            
            if (userType === 'user') {
                user = await User.findById(userId);
            } else if (userType === 'caregiver') {
                user = await Caregiver.findById(userId);
            } else {
                throw new Error('Invalid user type');
            }

            if (!user) {
                throw new Error('User not found');
            }

            // Return the sanitized user
            return userType === 'user' 
                ? this.sanitizeUser(user)
                : this.sanitizeCaregiver(user);

        } catch (error) {
            console.error('Error in getCurrentUser:', error);
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }

    // Verify token (generic - for backward compatibility)
    verifyToken(token) {
        try {
            // Try access token secret first
            try {
                return jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
            } catch (accessError) {
                // If not an access token, try refresh token secret
                return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
            }
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            throw new Error('Invalid token');
        }
    }

    // Remove sensitive data from user object
    sanitizeUser(user) {
        if (!user) return null;
        
        const userObject = user.toObject ? user.toObject() : { ...user };
        
        // Remove sensitive fields
        delete userObject.UPassword;
        delete userObject.resetPasswordToken;
        delete userObject.resetPasswordExpire;
        delete userObject.__v;
        
        // Ensure consistent ID field
        if (userObject._id) {
            userObject.id = userObject._id;
            delete userObject._id;
        }
        
        return userObject;
    }

    // Remove sensitive data from caregiver object
    sanitizeCaregiver(caregiver) {
        if (!caregiver) return null;
        
        const caregiverObject = caregiver.toObject ? caregiver.toObject() : { ...caregiver };
        
        // Remove sensitive fields
        delete caregiverObject.cgPassword;
        delete caregiverObject.resetPasswordToken;
        delete caregiverObject.resetPasswordExpire;
        delete caregiverObject.__v;
        
        // Ensure consistent ID field
        if (caregiverObject._id) {
            caregiverObject.id = caregiverObject._id;
            delete caregiverObject._id;
        }
        
        return caregiverObject;
    }

    // Validate user from token (for middleware use)
    async validateUserFromToken(token, tokenType = 'access') {
        try {
            let decoded;
            
            if (tokenType === 'access') {
                decoded = this.verifyAccessToken(token);
            } else if (tokenType === 'refresh') {
                decoded = this.verifyRefreshToken(token);
            } else {
                decoded = this.verifyToken(token);
            }

            let user;
            if (decoded.role === 'user') {
                user = await User.findById(decoded.userId || decoded.id);
            } else if (decoded.role === 'caregiver') {
                user = await Caregiver.findById(decoded.userId || decoded.id);
            }

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            return {
                userId: user._id,
                role: decoded.role,
                userData: this.sanitizeUser(user)
            };

        } catch (error) {
            throw new Error(`User validation failed: ${error.message}`);
        }
    }

    // Logout user (invalidate refresh token - optional)
    async invalidateRefreshToken(userId, role) {
        // In a more advanced implementation, you could store refresh tokens in a database
        // and invalidate them here. For now, we'll rely on short expiration times.
        // This is a placeholder for future implementation.
        return true;
    }
}

module.exports = new AuthService();