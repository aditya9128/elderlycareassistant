// ============================================
// ElderlyCare Assistant - Caregiver Login Module
// ============================================

// API Configuration
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api'
    : 'https://elderlycare-backend-f853.onrender.com/api';
    
let isCheckingAuth = false; // Prevent multiple auth checks

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('👩‍⚕️ Caregiver login page loading...');
    
    try {
        // Initialize everything
        initPasswordToggle();
        initCaregiverLogin();
        initFormValidation();
        
        // Auto-focus on email field
        autoFocusEmailField();
        
        // Setup enter key navigation
        setupEnterKeyNavigation();
        
        // Check auth status AFTER form initialization
        setTimeout(() => {
            checkAuthStatus();
        }, 500);
        
        console.log('✅ Caregiver login page ready');
        
    } catch (error) {
        console.error('❌ Error initializing caregiver login page:', error);
        showNotification('Error loading login page. Please refresh.', 'error');
    }
});

// Check if caregiver is already authenticated
async function checkAuthStatus() {
    if (isCheckingAuth) return;
    isCheckingAuth = true;
    
    console.log('🔍 Checking caregiver authentication status...');
    
    try {
        // First check if we have localStorage data (fast check)
        const userType = localStorage.getItem('userType');
        const userId = localStorage.getItem('userId');
        
        if (userType === 'caregiver' && userId) {
            console.log('✅ Found caregiver data in localStorage');
            
            // Verify with backend to ensure validity
            const isValid = await verifyAuthStatus();
            
            if (isValid) {
                console.log('✅ Backend validation successful, redirecting...');
                // Small delay to ensure page is ready
                setTimeout(() => {
                    window.location.href = 'caregiver-dashboard.html';
                }, 300);
                return;
            } else {
                console.log('❌ Backend validation failed, clearing storage');
                clearAuthStorage();
            }
        } else {
            console.log('❌ No caregiver data found in localStorage');
            
            // Check cookies as backup
            const userRole = getCookie('user_role');
            const cookieUserId = getCookie('user_id');
            
            if (userRole === 'caregiver' && cookieUserId) {
                console.log('✅ Found caregiver cookies, validating with backend...');
                
                const isValid = await verifyAuthStatus();
                if (isValid) {
                    // Store in localStorage for dashboard access
                    storeCaregiverInfoFromCookies();
                    
                    console.log('✅ Cookie validation successful, redirecting...');
                    setTimeout(() => {
                        window.location.href = 'caregiver-dashboard.html';
                    }, 300);
                    return;
                }
            }
        }
        
        console.log('❌ User not authenticated, showing login form');
        
    } catch (error) {
        console.error('❌ Error checking auth status:', error);
    } finally {
        isCheckingAuth = false;
    }
}

// Verify authentication status with backend
async function verifyAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('🔐 Auth status response:', data);
            return data.isAuthenticated && data.user?.role === 'caregiver';
        }
        return false;
    } catch (error) {
        console.error('Auth status verification error:', error);
        return false;
    }
}

// Get current caregiver from backend
async function getCurrentCaregiver() {
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
        console.error('Get current caregiver error:', error);
        return null;
    }
}

// Store caregiver info from cookies in localStorage for frontend access
function storeCaregiverInfoFromCookies() {
    const userId = getCookie('user_id');
    const userName = getCookie('user_name');
    const userRole = getCookie('user_role');
    const userEmail = getCookie('user_email');
    
    if (userId && userRole === 'caregiver') {
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', userName || '');
        localStorage.setItem('userType', 'caregiver');
        localStorage.setItem('userEmail', userEmail || '');
        
        console.log('✅ Caregiver info stored from cookies:', { userId, userName });
    }
}

// Clear authentication storage (ONLY when explicitly needed)
function clearAuthStorage() {
    console.log('⚠️ Clearing auth storage...');
    
    // Only clear if we're on login page (not redirecting)
    const currentPage = window.location.pathname;
    if (currentPage.includes('login') || currentPage.includes('caregiver-login')) {
        // Clear localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userType');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('caregiverProfileImage');
        localStorage.removeItem('verified');
        localStorage.removeItem('specialization');
        localStorage.removeItem('experience');
        localStorage.removeItem('city');
        localStorage.removeItem('rating');
        localStorage.removeItem('totalRatings');
        localStorage.removeItem('hourlyRate');
        
        console.log('✅ Auth storage cleared (login page)');
    } else {
        console.log('⚠️ Not clearing storage on non-login page');
    }
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
    const toggleBtns = document.querySelectorAll('.password-toggle');
    toggleBtns.forEach(toggleBtn => {
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
    });
    
    console.log('✅ Password toggle initialized');
}

// Initialize form validation
function initFormValidation() {
    const emailInput = document.getElementById('caregiverEmail');
    const passwordInput = document.getElementById('caregiverPassword');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmailField(this);
        });
        
        emailInput.addEventListener('input', function() {
            // Clear error on input
            const errorElement = document.getElementById('caregiverEmailError');
            if (errorElement) errorElement.textContent = '';
            this.classList.remove('border-red-500');
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            // Clear error on input
            const errorElement = document.getElementById('caregiverPasswordError');
            if (errorElement) errorElement.textContent = '';
            this.classList.remove('border-red-500');
        });
    }
}

// Validate email field
function validateEmailField(input) {
    const email = input.value.trim();
    
    if (!email) {
        showError('caregiverEmailError', 'Email is required');
        input.classList.add('border-red-500');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showError('caregiverEmailError', 'Please enter a valid email address');
        input.classList.add('border-red-500');
        return false;
    }
    
    input.classList.remove('border-red-500');
    return true;
}

// Initialize Caregiver Login
function initCaregiverLogin() {
    const caregiverLoginForm = document.getElementById('caregiverLoginForm');
    if (!caregiverLoginForm) {
        console.warn('Caregiver login form not found');
        return;
    }
    
    caregiverLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('👩‍⚕️ Caregiver login submitted');
        
        // Get form values
        const email = document.getElementById('caregiverEmail').value.trim();
        const password = document.getElementById('caregiverPassword').value;
        const rememberMe = document.getElementById('rememberMeCaregiver')?.checked || false;
        
        // Clear previous errors
        clearErrors(['caregiverEmailError', 'caregiverPasswordError']);
        
        // Validate
        let isValid = true;
        
        if (!email) {
            showError('caregiverEmailError', 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('caregiverEmailError', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!password) {
            showError('caregiverPasswordError', 'Password is required');
            isValid = false;
        }
        
        if (!isValid) {
            showNotification('Please fill in all fields correctly', 'error');
            return;
        }
        
        // Disable submit button
        const submitBtn = document.getElementById('caregiverLoginBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';
        
        // Show loading
        showLoading(true);
        
        try {
            // Send login request
            console.log('📤 Sending caregiver login request...');
            
            const response = await fetch(`${API_BASE_URL}/auth/login/caregiver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
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
                    throw new Error('Account is deactivated or not verified. Please contact support.');
                } else if (response.status === 400) {
                    throw new Error(data.message || 'Please check your credentials');
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
            console.log('✅ Caregiver login successful!');
            
            // Store caregiver info from response
            storeCaregiverInfo(data, rememberMe);
            
            // Show success message
            showNotification('Login successful! Redirecting to dashboard...', 'success');
            
            // IMPORTANT: Add a small delay before redirecting
            setTimeout(() => {
                window.location.href = 'caregiver-dashboard.html';
            }, 1500); // Increased delay to ensure cookies are set
            
        } catch (error) {
            console.error('❌ Caregiver login error:', error);
            
            // Show appropriate error message
            let errorMessage = error.message;
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to server. Please check your internet connection.';
            } else if (error.message.includes('invalid email') || error.message.includes('Invalid email')) {
                errorMessage = 'Please enter a valid email address';
            } else if (error.message.includes('not verified')) {
                errorMessage = 'Your account is not verified yet. Please check your email for verification instructions.';
            }
            
            showError('caregiverEmailError', errorMessage);
            showNotification(errorMessage, 'error');
            
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            // Hide loading
            showLoading(false);
        }
    });
    
    console.log('✅ Caregiver login initialized');
}

// Store caregiver information from response
function storeCaregiverInfo(data, rememberMe) {
    // Store user info based on rememberMe preference
    if (data.data && data.data.user) {
        const caregiver = data.data.user;
        
        // Always store basic info in localStorage (for dashboard access)
        localStorage.setItem('userId', caregiver.id || caregiver._id || '');
        localStorage.setItem('userName', caregiver.cgName || caregiver.name || '');
        localStorage.setItem('userType', 'caregiver');
        localStorage.setItem('userEmail', caregiver.cgEmail || caregiver.email || '');
        
        // Store additional info if rememberMe is checked
        if (rememberMe) {
            if (caregiver.cgProfileImage) {
                localStorage.setItem('caregiverProfileImage', caregiver.cgProfileImage);
            }
            
            if (caregiver.verified !== undefined) {
                localStorage.setItem('verified', caregiver.verified);
            }
            
            if (caregiver.cgSpecialization) {
                localStorage.setItem('specialization', JSON.stringify(caregiver.cgSpecialization));
            }
            
            if (caregiver.cgExpYears !== undefined) {
                localStorage.setItem('experience', caregiver.cgExpYears);
            }
            
            if (caregiver.cgWorkingCity) {
                localStorage.setItem('city', caregiver.cgWorkingCity);
            }
            
            if (caregiver.cgRating) {
                localStorage.setItem('rating', caregiver.cgRating.average || 0);
                localStorage.setItem('totalRatings', caregiver.cgRating.totalRatings || 0);
            }
            
            if (caregiver.cgCharges) {
                localStorage.setItem('hourlyRate', caregiver.cgCharges.hourly || 0);
            }
        } else {
            // For session-only, also store in sessionStorage
            sessionStorage.setItem('userId', caregiver.id || caregiver._id || '');
            sessionStorage.setItem('userName', caregiver.cgName || caregiver.name || '');
            sessionStorage.setItem('userType', 'caregiver');
            
            if (caregiver.verified !== undefined) {
                sessionStorage.setItem('verified', caregiver.verified);
            }
        }
        
        console.log('✅ Caregiver info stored:', { 
            name: caregiver.cgName || caregiver.name,
            email: caregiver.cgEmail || caregiver.email
        });
    }
    
    console.log('✅ Authentication cookies set by backend');
}

// Auto-focus on email field
function autoFocusEmailField() {
    setTimeout(() => {
        const emailInput = document.getElementById('caregiverEmail');
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
        if (activeElement.id === 'caregiverEmail') {
            e.preventDefault();
            
            const passwordInput = document.getElementById('caregiverPassword');
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
window.caregiverLoginDebug = {
    // Test caregiver login
    testCaregiverLogin: async function(email = 'caregiver@example.com', password = 'password123') {
        try {
            console.log('🧪 Testing caregiver login...');
            const response = await fetch(`${API_BASE_URL}/auth/login/caregiver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            
            const result = await response.json();
            console.log('🧪 Test result:', result);
            
            if (response.ok && result.success) {
                showNotification('Caregiver test login successful!', 'success');
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
    
    // Check localStorage status
    checkLocalStorage: function() {
        const userId = localStorage.getItem('userId');
        const userType = localStorage.getItem('userType');
        const userName = localStorage.getItem('userName');
        
        console.log('🧪 LocalStorage:', { userId, userType, userName });
        showNotification(`LocalStorage: ${userType ? `${userName} (${userType})` : 'Empty'}`, 'info');
        return { userId, userType, userName };
    },
    
    // Check cookie status
    checkCookies: function() {
        const cookies = document.cookie.split(';').map(c => {
            const [key, value] = c.trim().split('=');
            return { key, value: value ? value.substring(0, 20) + '...' : 'empty' };
        });
        
        console.log('🍪 Cookies:', cookies);
        showNotification(`Found ${cookies.length} cookie(s)`, 'info');
        return cookies;
    },
    
    // Clear all auth data
    clearAuthData: function() {
        localStorage.clear();
        sessionStorage.clear();
        
        // Call logout endpoint
        fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        }).catch(() => {
            // Fallback
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        });
        
        console.log('🧪 All caregiver auth data cleared');
        showNotification('All authentication data cleared', 'info');
    }
};

console.log('🔐 Caregiver login module loaded successfully');