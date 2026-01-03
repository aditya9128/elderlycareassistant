const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');

// Protect routes - verify JWT token from HttpOnly cookies
const protect = async (req, res, next) => {
    try {
        let token;
        
        // Check for access token in HttpOnly cookie first
        if (req.cookies?.access_token) {
            token = req.cookies.access_token;
        }
        // Fallback: check Authorization header (for API testing, mobile apps, etc.)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login to access this resource.'
            });
        }

        // Verify access token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
        
        let user;
        
        // Find user based on role
        if (decoded.role === 'user') {
            user = await User.findById(decoded.userId || decoded.id).select('-UPassword');
        } else if (decoded.role === 'caregiver') {
            user = await Caregiver.findById(decoded.userId || decoded.id).select('-cgPassword');
        }

        if (!user) {
            // Clear invalid auth cookies
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            clearAuthCookies(res);
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Add user to request object
        req.user = {
            id: user._id,
            role: decoded.role,
            userData: user.toObject ? user.toObject() : user
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        // Clear cookies on any auth error
        clearAuthCookies(res);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            // Check if refresh token exists for auto-refresh scenario
            if (req.cookies?.refresh_token) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired',
                    canRefresh: true
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this resource'
        });
    }
};

// Refresh token middleware (for token refresh endpoint only)
const requireRefreshToken = async (req, res, next) => {
    try {
        let refreshToken;
        
        // Check for refresh token in HttpOnly cookie
        if (req.cookies?.refresh_token) {
            refreshToken = req.cookies.refresh_token;
        }
        // Fallback: check Authorization header with "Refresh" prefix
        else if (req.headers.authorization && req.headers.authorization.startsWith('Refresh ')) {
            refreshToken = req.headers.authorization.split(' ')[1];
        }

        if (!refreshToken) {
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        
        let user;
        
        // Find user based on role
        if (decoded.role === 'user') {
            user = await User.findById(decoded.userId || decoded.id).select('_id role isActive');
        } else if (decoded.role === 'caregiver') {
            user = await Caregiver.findById(decoded.userId || decoded.id).select('_id role isActive');
        }

        if (!user) {
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            clearAuthCookies(res);
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Add refresh token data to request
        req.refreshTokenData = {
            token: refreshToken,
            userId: user._id,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        console.error('Refresh token middleware error:', error.message);
        
        // Clear all auth cookies on refresh token error
        clearAuthCookies(res);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired. Please login again.'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Optional authentication (for public routes that have optional auth)
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        
        // Check for access token in cookie
        if (req.cookies?.access_token) {
            token = req.cookies.access_token;
        }
        // Fallback to Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
                
                let user;
                
                if (decoded.role === 'user') {
                    user = await User.findById(decoded.userId || decoded.id).select('-UPassword');
                } else if (decoded.role === 'caregiver') {
                    user = await Caregiver.findById(decoded.userId || decoded.id).select('-cgPassword');
                }

                if (user && user.isActive) {
                    req.user = {
                        id: user._id,
                        role: decoded.role,
                        userData: user.toObject ? user.toObject() : user
                    };
                }
            } catch (error) {
                // If token is invalid or expired, don't set req.user
                // Check if it's just expired and we have a refresh token
                if (error.name === 'TokenExpiredError' && req.cookies?.refresh_token) {
                    req.canRefresh = true;
                }
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Admin-only middleware (example of specific role check)
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Helper function to clear auth cookies
const clearAuthCookies = (res) => {
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
};

// Middleware to check if user is authenticated (for frontend status checks)
// Middleware to check if user is authenticated (for frontend status checks)
const checkAuthStatus = async (req, res, next) => {
    try {
        let token;
        
        // Check for access token in HttpOnly cookie
        if (req.cookies?.access_token) {
            token = req.cookies.access_token;
        }
        
        if (token) {
            try {
                // Verify access token
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
                
                // Get user info from token (more reliable than cookies)
                req.authStatus = {
                    isAuthenticated: true,
                    user: {
                        id: decoded.userId || decoded.id,
                        role: decoded.role,
                        name: req.cookies?.user_name || ''
                    }
                };
                
                // Optional: Verify user exists and is active
                try {
                    let user;
                    if (decoded.role === 'user') {
                        user = await User.findById(decoded.userId || decoded.id).select('_id isActive');
                    } else if (decoded.role === 'caregiver') {
                        user = await Caregiver.findById(decoded.userId || decoded.id).select('_id isActive');
                    }
                    
                    if (!user || !user.isActive) {
                        req.authStatus = {
                            isAuthenticated: false,
                            message: 'User not found or account inactive'
                        };
                    }
                } catch (dbError) {
                    // Database check failed, but token is still valid
                    console.error('Database check in auth status:', dbError);
                }
                
            } catch (error) {
                // Token invalid or expired
                if (error.name === 'TokenExpiredError') {
                    // Check if refresh token exists
                    if (req.cookies?.refresh_token) {
                        req.authStatus = {
                            isAuthenticated: false,
                            canRefresh: true,
                            message: 'Session expired, can refresh'
                        };
                    } else {
                        req.authStatus = {
                            isAuthenticated: false,
                            message: 'Session expired'
                        };
                    }
                } else {
                    req.authStatus = {
                        isAuthenticated: false,
                        message: 'Invalid token'
                    };
                }
            }
        } else {
            // No token found - fallback to cookie check
            const userRole = req.cookies?.user_role;
            const userId = req.cookies?.user_id;
            
            if (userRole && userId) {
                req.authStatus = {
                    isAuthenticated: true,
                    user: {
                        id: userId,
                        role: userRole,
                        name: req.cookies?.user_name || ''
                    }
                };
            } else {
                req.authStatus = {
                    isAuthenticated: false,
                    message: 'No authentication found'
                };
            }
        }
    } catch (error) {
        console.error('Auth status check error:', error);
        req.authStatus = {
            isAuthenticated: false,
            message: 'Authentication check failed'
        };
    }
    
    next();
};

module.exports = {
    protect,           // Main auth middleware - requires valid access token
    requireRefreshToken, // For refresh token endpoint only
    authorize,         // Role-based access control
    optionalAuth,      // Optional authentication
    requireAdmin,      // Admin-only access
    checkAuthStatus,   // Check auth status from cookies
    clearAuthCookies   // Helper function to clear cookies
};