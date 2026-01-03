const authService = require('../services/authService');

class AuthController {
    
    // @desc    Register user
    // @route   POST /api/auth/register/user
    // @access  Public
    async registerUser(req, res) {
        try {
            const result = await authService.registerUser(req.body);
            
            // Set HttpOnly cookie
            this.setAuthCookies(res, result);
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    // Don't send token in response body when using cookies
                }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // @desc    Login user
    // @route   POST /api/auth/login/user
    // @access  Public
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email and password'
                });
            }

            const result = await authService.loginUser(email, password);
            
            // Set HttpOnly cookie
            this.setAuthCookies(res, result);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    // Don't send token in response body when using cookies
                }
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // @desc    Register caregiver
    // @route   POST /api/auth/register/caregiver
    // @access  Public
    async registerCaregiver(req, res) {
        try {
            const result = await authService.registerCaregiver(req.body);
            
            // Set HttpOnly cookie
            this.setAuthCookies(res, result);

            res.status(201).json({
                success: true,
                message: 'Caregiver registered successfully',
                data: {
                    user: result.user,
                    // Don't send token in response body when using cookies
                }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // @desc    Login caregiver
    // @route   POST /api/auth/login/caregiver
    // @access  Public
    async loginCaregiver(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email and password'
                });
            }

            const result = await authService.loginCaregiver(email, password);
            
            // Set HttpOnly cookie
            this.setAuthCookies(res, result);

            res.status(200).json({
                success: true,
                message: 'Caregiver login successful',
                data: {
                    user: result.user,
                    // Don't send token in response body when using cookies
                }
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // @desc    Logout user / clear cookies
    // @route   POST /api/auth/logout
    // @access  Private
    async logout(req, res) {
        // Clear all auth cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.clearCookie('user_role');
        res.clearCookie('user_id');

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    }

    // @desc    Get current logged in user
    // @route   GET /api/auth/me
    // @access  Private
    async getMe(req, res) {
        try {
            // User info is already in cookies, but we can validate/refresh
            let user;
            
            if (req.user.role === 'user') {
                user = await authService.getCurrentUser(req.user.id, 'user');
            } else if (req.user.role === 'caregiver') {
                user = await authService.getCurrentUser(req.user.id, 'caregiver');
            }

            if (!user) {
                // Clear cookies if user not found
                this.clearAuthCookies(res);
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Add role to user object
            const userWithRole = {
                ...user,
                role: req.user.role
            };

            res.status(200).json({
                success: true,
                data: userWithRole
            });
        } catch (error) {
            console.error('Error in getMe:', error);
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // @desc    Refresh access token
    // @route   POST /api/auth/refresh-token
    // @access  Private (requires refresh token in cookie)
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refresh_token;
            
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'No refresh token provided'
                });
            }

            const result = await authService.refreshAccessToken(refreshToken);
            
            // Set new access token cookie
            this.setAccessTokenCookie(res, result.accessToken);
            
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully'
            });

        } catch (error) {
            // Clear cookies if refresh fails
            this.clearAuthCookies(res);
            res.status(403).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    // @desc    Forgot password
    // @route   POST /api/auth/forgot-password
    // @access  Public
    async forgotPassword(req, res) {
        try {
            const { email, userType = 'user' } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email'
                });
            }

            const resetToken = await authService.generatePasswordResetToken(email, userType);
            
            // TODO: In production, send email with reset token
            // For development, we'll return some info
            const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
            
            res.status(200).json({
                success: true,
                message: 'Password reset email sent',
                data: process.env.NODE_ENV === 'development' ? {
                    resetUrl,
                    note: 'In production, this would be sent via email only'
                } : {}
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // @desc    Reset password
    // @route   PUT /api/auth/reset-password/:token
    // @access  Public
    async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { password, userType = 'user' } = req.body;

            if (!token || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide token and new password'
                });
            }

            await authService.resetPassword(token, password, userType);
            
            res.status(200).json({
                success: true,
                message: 'Password reset successful. You can now login with your new password.'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // @desc    Change password (for logged in users)
    // @route   PUT /api/auth/change-password
    // @access  Private
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const { id, role } = req.user;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide current and new password'
                });
            }

            await authService.changePassword(id, role, currentPassword, newPassword);
            
            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Helper method to set authentication cookies
    setAuthCookies(res, authResult) {
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Access Token Cookie (short-lived)
        const accessTokenOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        };

        // Refresh Token Cookie (longer-lived)
        const refreshTokenOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/auth/refresh-token' // Only accessible to refresh endpoint
        };

        // User Info Cookies (non-sensitive, accessible to frontend)
        const userInfoOptions = {
            httpOnly: false, // Accessible to JavaScript
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        };

        // Set cookies
        res.cookie('access_token', authResult.accessToken, accessTokenOptions);
        res.cookie('refresh_token', authResult.refreshToken, refreshTokenOptions);
        
        // Store user info in non-HttpOnly cookies for frontend access
        if (authResult.user) {

            const userRole = authResult.user.role || (authResult.user.cgEmail ? 'caregiver' : 'user');
            res.cookie('user_role', userRole, userInfoOptions);
            res.cookie('user_id', authResult.user.id || authResult.user._id, userInfoOptions);
            res.cookie('user_name', authResult.user.cgName || authResult.user.UName || authResult.user.name || '', userInfoOptions);
            res.cookie('user_email', authResult.user.cgEmail || authResult.user.UEmail || authResult.user.email || '', userInfoOptions);
        }
    }

    // Helper method to set only access token cookie
    setAccessTokenCookie(res, accessToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        
        const accessTokenOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        };

        res.cookie('access_token', accessToken, accessTokenOptions);
    }

    // Helper method to clear all auth cookies
    clearAuthCookies(res) {
        const cookies = [
            'access_token',
            'refresh_token',
            'user_role',
            'user_id',
            'user_name'
        ];

        cookies.forEach(cookieName => {
            res.clearCookie(cookieName);
        });
    }

    // @desc    Check authentication status
    // @route   GET /api/auth/status
    // @access  Public
    async checkAuthStatus(req, res) {
        try {
            const token = req.cookies.access_token;
            const refreshToken = req.cookies.refresh_token;
            
            if (!token && !refreshToken) {
                return res.status(200).json({
                    isAuthenticated: false,
                    message: 'Not authenticated'
                });
            }

            // If access token exists and is valid
            if (token) {
                try {
                    const user = await authService.verifyToken(token);
                    return res.status(200).json({
                        isAuthenticated: true,
                        user: {
                            id: user.id,
                            role: user.role,
                            name: req.cookies.user_name
                        }
                    });
                } catch (error) {
                    // Token is invalid or expired
                    if (refreshToken) {
                        return res.status(200).json({
                            isAuthenticated: false,
                            canRefresh: true,
                            message: 'Session expired, can refresh'
                        });
                    }
                }
            }

            res.status(200).json({
                isAuthenticated: false,
                message: 'Not authenticated'
            });

        } catch (error) {
            res.status(200).json({
                isAuthenticated: false,
                message: 'Not authenticated'
            });
        }
    }

        // @desc    Check authentication status
    // @route   GET /api/auth/status
    // @access  Public
    async getAuthStatus(req, res) {
        try {
            // This is handled by the checkAuthStatus middleware
            // Just return the authStatus set by middleware
            res.status(200).json({
                success: true,
                ...req.authStatus
            });
        } catch (error) {
            res.status(200).json({
                success: false,
                isAuthenticated: false,
                message: 'Not authenticated'
            });
        }
    }
}

// Create an instance
const authController = new AuthController();

// Bind methods to maintain 'this' context
const boundController = {
    registerUser: authController.registerUser.bind(authController),
    loginUser: authController.loginUser.bind(authController),
    registerCaregiver: authController.registerCaregiver.bind(authController),
    loginCaregiver: authController.loginCaregiver.bind(authController),
    logout: authController.logout.bind(authController),
    getMe: authController.getMe.bind(authController),
    refreshToken: authController.refreshToken.bind(authController),
    forgotPassword: authController.forgotPassword.bind(authController),
    resetPassword: authController.resetPassword.bind(authController),
    changePassword: authController.changePassword.bind(authController),
    checkAuthStatus: authController.checkAuthStatus.bind(authController),
    setAuthCookies: authController.setAuthCookies.bind(authController),
    setAccessTokenCookie: authController.setAccessTokenCookie.bind(authController),
    clearAuthCookies: authController.clearAuthCookies.bind(authController),
    getAuthStatus: authController.getAuthStatus.bind(authController)
};

module.exports = boundController;