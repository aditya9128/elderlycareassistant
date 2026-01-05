// ============================================
// ElderlyCare Assistant - User Login Module
// ============================================

// API Configuration
// const API_BASE_URL = '/api';
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api'
    : 'https://elderlycare-backend-f853.onrender.com/api';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 User login page loading...');
    
    try {
        // Initialize everything
        initPasswordToggle();
        initUserLogin();
        initFormValidation();
        
        // Check if user is already logged in
        checkAuthStatus();
        
        // Auto-focus on email field
        autoFocusEmailField();
        
        // Setup enter key navigation
        setupEnterKeyNavigation();
        
        console.log('✅ User login page ready');
        
    } catch (error) {
        console.error('❌ Error initializing login page:', error);
        showNotification('Error loading login page. Please refresh.', 'error');
    }
});

// Check if user is already authenticated
function checkAuthStatus() {
    console.log('🔍 Checking authentication status...');
    
    // Check cookies for user info (non-HttpOnly cookies set by backend)
    const userRole = getCookie('user_role');
    const userId = getCookie('user_id');
    
    if (userRole === 'user' && userId) {
        console.log('✅ User already logged in via cookies');
        
        // Verify authentication with backend
        verifyAuthStatus().then(isAuthenticated => {
            if (isAuthenticated) {
                console.log('✅ User authenticated, redirecting to dashboard...');
                
                // Store user info from cookies in localStorage for frontend access
                storeUserInfoFromCookies();
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Not authenticated, clear storage
                clearAuthStorage();
            }
        }).catch(() => {
            clearAuthStorage();
        });
    } else {
        console.log('❌ No valid auth cookies found');
        clearAuthStorage();
    }
}

// Verify authentication status with backend
async function verifyAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
            method: 'GET',
            credentials: 'include' // Important: sends cookies automatically
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.isAuthenticated && data.user?.role === 'user';
        }
        return false;
    } catch (error) {
        console.error('Auth status verification error:', error);
        return false;
    }
}

// Get current user from backend
async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                return data.data;
            }
        }
        return null;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

// Store user info from cookies in localStorage for frontend access
function storeUserInfoFromCookies() {
    const userId = getCookie('user_id');
    const userName = getCookie('user_name');
    const userRole = getCookie('user_role');
    const userEmail = getCookie('user_email');
    
    if (userId && userRole === 'user') {
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', userName || '');
        localStorage.setItem('userType', 'user');
        localStorage.setItem('userEmail', userEmail || '');
        
        // Also store in sessionStorage for session-only access
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('userName', userName || '');
        sessionStorage.setItem('userType', 'user');
        
        console.log('✅ User info stored from cookies:', { userId, userName });
    }
}

// Clear authentication storage
function clearAuthStorage() {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('✅ Auth storage cleared');
}

// Get cookie value by name
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

// Initialize password visibility toggle
function initPasswordToggle() {
    const toggleBtn = document.querySelector('.password-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (!input || !icon) return;
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
                this.setAttribute('title', 'Hide password');
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
                this.setAttribute('title', 'Show password');
            }
        });
    }
    
    console.log('✅ Password toggle initialized');
}

// Initialize form validation
function initFormValidation() {
    const emailInput = document.getElementById('userEmail');
    const passwordInput = document.getElementById('userPassword');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmailField(this);
        });
        
        emailInput.addEventListener('input', function() {
            // Clear error on input
            const errorElement = document.getElementById('userEmailError');
            if (errorElement) errorElement.textContent = '';
            this.classList.remove('border-red-500');
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            // Clear error on input
            const errorElement = document.getElementById('userPasswordError');
            if (errorElement) errorElement.textContent = '';
            this.classList.remove('border-red-500');
        });
    }
}

// Validate email field
function validateEmailField(input) {
    const email = input.value.trim();
    
    if (!email) {
        showError('userEmailError', 'Email is required');
        input.classList.add('border-red-500');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showError('userEmailError', 'Please enter a valid email address');
        input.classList.add('border-red-500');
        return false;
    }
    
    input.classList.remove('border-red-500');
    return true;
}

// Initialize User Login
function initUserLogin() {
    const userLoginForm = document.getElementById('userLoginForm');
    if (!userLoginForm) {
        console.warn('User login form not found');
        return;
    }
    
    userLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('👤 User login submitted');
        
        // Get form values
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        // Clear previous errors
        clearErrors(['userEmailError', 'userPasswordError']);
        
        // Validate
        let isValid = true;
        
        if (!email) {
            showError('userEmailError', 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('userEmailError', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!password) {
            showError('userPasswordError', 'Password is required');
            isValid = false;
        }
        
        if (!isValid) {
            showNotification('Please fill in all fields correctly', 'error');
            return;
        }
        
        // Disable submit button
        const submitBtn = document.getElementById('userLoginBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';
        
        // Show loading
        showLoading(true);
        
        try {
            // Send login request
            console.log('📤 Sending user login request...');
            
            const response = await fetch(`${API_BASE_URL}/auth/login/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include' // Important: sends cookies automatically
            });
            
            console.log('📥 Response status:', response.status);
            
            let data;
            try {
                data = await response.json();
                console.log('📥 Response data:', data);
            } catch (parseError) {
                console.error('❌ Failed to parse response:', parseError);
                throw new Error('Server returned invalid response');
            }
            
            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                } else if (response.status === 403) {
                    throw new Error('Account is deactivated. Please contact support.');
                } else if (data.message) {
                    throw new Error(data.message);
                } else {
                    throw new Error('Login failed. Please try again.');
                }
            }
            
            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Login successful
            console.log('✅ User login successful!');
            
            // Store user info from response
            storeUserInfo(data, rememberMe);
            
            // Show success message
            showNotification('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ User login error:', error);
            
            // Show appropriate error message
            let errorMessage = error.message;
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to server. Please check your internet connection.';
            } else if (error.message.includes('invalid email') || error.message.includes('Invalid email')) {
                errorMessage = 'Please enter a valid email address';
            }
            
            showError('userEmailError', errorMessage);
            showNotification(errorMessage, 'error');
            
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            // Hide loading
            showLoading(false);
        }
    });
    
    console.log('✅ User login initialized');
}

// Store user information from response
function storeUserInfo(data, rememberMe) {
    // Backend now sets HttpOnly cookies automatically
    // We only need to store non-sensitive user info in localStorage/sessionStorage
    
    if (data.data && data.data.user) {
        const user = data.data.user;
        
        // Store user info based on rememberMe preference
        if (rememberMe) {
            // Store in localStorage for persistent login
            localStorage.setItem('userId', user.id || user._id || '');
            localStorage.setItem('userName', user.UName || user.name || '');
            localStorage.setItem('userType', 'user');
            localStorage.setItem('userEmail', user.UEmail || user.email || '');
            if (user.UProfileImage) {
                localStorage.setItem('userProfileImage', user.UProfileImage);
            }
        } else {
            // Store in sessionStorage for session-only
            sessionStorage.setItem('userId', user.id || user._id || '');
            sessionStorage.setItem('userName', user.UName || user.name || '');
            sessionStorage.setItem('userType', 'user');
        }
        
        console.log('✅ User info stored:', { 
            name: user.UName || user.name,
            email: user.UEmail || user.email 
        });
    }
    
    // Note: Tokens are now automatically stored in HttpOnly cookies by the backend
    console.log('✅ Authentication cookies set by backend');
}

// Auto-focus on email field
function autoFocusEmailField() {
    setTimeout(() => {
        const emailInput = document.getElementById('userEmail');
        if (emailInput) {
            emailInput.focus();
        }
    }, 300);
}

// Setup enter key navigation
function setupEnterKeyNavigation() {
    document.addEventListener('keydown', function(e) {
        // Only handle enter key
        if (e.key !== 'Enter') return;
        
        // Get active element
        const activeElement = document.activeElement;
        
        // If focus is on email field, move to password field
        if (activeElement.id === 'userEmail') {
            e.preventDefault();
            
            const passwordInput = document.getElementById('userPassword');
            if (passwordInput) {
                passwordInput.focus();
            }
        }
    });
}

// Helper Functions
function clearErrors(errorIds) {
    errorIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '';
            element.classList.remove('text-red-300');
        }
    });
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('text-red-300');
        
        // Also add error styling to the input field if it exists
        const inputId = elementId.replace('Error', '');
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.add('border-red-500');
            inputElement.classList.remove('border-white/20');
        }
    }
}

function showLoading(show) {
    const loadingElement = document.getElementById('loginLoading');
    if (loadingElement) {
        if (show) {
            loadingElement.classList.remove('hidden');
            loadingElement.classList.add('flex');
        } else {
            loadingElement.classList.add('hidden');
            loadingElement.classList.remove('flex');
        }
    }
}

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-up ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'warning' ? 'bg-yellow-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after appropriate time
    const duration = type === 'success' ? 3000 : 5000;
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Debug helper for testing
window.loginDebug = {
    // Test user login
    testUserLogin: async function(email = 'test@example.com', password = 'password123') {
        try {
            console.log('🧪 Testing user login...');
            const response = await fetch(`${API_BASE_URL}/auth/login/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            
            const result = await response.json();
            console.log('🧪 Test result:', result);
            
            if (response.ok && result.success) {
                showNotification('Test login successful!', 'success');
                return result;
            } else {
                showNotification('Test failed: ' + (result.message || 'Unknown error'), 'error');
                return result;
            }
        } catch (error) {
            console.error('🧪 Test error:', error);
            showNotification('Test error: ' + error.message, 'error');
            return { error: error.message };
        }
    },
    
    // Get current user
    getCurrentUser: async function() {
        try {
            console.log('🧪 Getting current user...');
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            console.log('🧪 Current user:', result);
            return result;
        } catch (error) {
            console.error('🧪 Get user error:', error);
            return { error: error.message };
        }
    },
    
    // Check auth status
    checkAuthStatus: async function() {
        try {
            console.log('🧪 Checking auth status...');
            const response = await fetch(`${API_BASE_URL}/auth/status`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            console.log('🧪 Auth status:', result);
            showNotification('Auth status: ' + (result.isAuthenticated ? 'Logged in' : 'Not logged in'), 'info');
            return result;
        } catch (error) {
            console.error('🧪 Auth status error:', error);
            return { error: error.message };
        }
    },
    
    // Clear all auth data
    clearAuthData: function() {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear cookies (including HttpOnly by making API call)
        fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        }).catch(() => {
            // Fallback: try to clear cookies client-side (won't clear HttpOnly)
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        });
        
        console.log('🧪 All auth data cleared');
        showNotification('All authentication data cleared', 'info');
    },
    
    // Fill test credentials
    fillTestCredentials: function() {
        document.getElementById('userEmail').value = 'test@example.com';
        document.getElementById('userPassword').value = 'password123';
        showNotification('Test credentials filled', 'info');
    },
    
    // Show current cookies
    showCookies: function() {
        const cookies = document.cookie.split(';');
        const cookieInfo = cookies.map(cookie => {
            const [key, value] = cookie.trim().split('=');
            return { key, value: value ? value.substring(0, 20) + '...' : 'empty' };
        });
        
        console.log('🍪 Current cookies:', cookieInfo);
        showNotification(`Found ${cookieInfo.length} cookie(s)`, 'info');
        return cookieInfo;
    }
};

console.log('🔐 User login module loaded successfully');