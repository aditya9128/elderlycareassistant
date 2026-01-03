// ============================================
// ElderlyCare Assistant - Signup Module (FIXED)
// ============================================

// API Configuration - IMPORTANT: Use correct backend port
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentStep = 1;
let formData = {
    // Step 1: Basic Information
    UName: '',
    UEmail: '',
    UPhone: '',
    UDob: '',
    UGender: '',
    UStreet: '',
    UCity: '',
    UState: '',
    UPincode: '',
    
    // Step 2: Health Information (Optional)
    bloodGroup: '',
    emergencyContacts: [],
    medicalConditions: [],
    
    // Step 3: Account Setup
    UPassword: ''
};

// Initialize the application
function init() {
    console.log('Initializing signup form...');
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize step indicators
    updateStepIndicators();
    
    // Initialize password strength checker
    initPasswordStrengthChecker();
    
    // Initialize terms checkbox
    initTermsCheckbox();
    
    // Update current date display
    updateDatePlaceholders();
    
    console.log('Signup form initialized');
}

// Setup all event listeners
function setupEventListeners() {
    // Step navigation
    const nextStep1Btn = document.getElementById('nextStep1Btn');
    const prevStep2Btn = document.getElementById('prevStep2Btn');
    const nextStep2Btn = document.getElementById('nextStep2Btn');
    const prevStep3Btn = document.getElementById('prevStep3Btn');
    const addConditionBtn = document.getElementById('addConditionBtn');
    
    if (nextStep1Btn) nextStep1Btn.addEventListener('click', validateStep1);
    if (prevStep2Btn) prevStep2Btn.addEventListener('click', () => goToStep(1));
    if (nextStep2Btn) nextStep2Btn.addEventListener('click', () => goToStep(3));
    if (prevStep3Btn) prevStep3Btn.addEventListener('click', () => goToStep(2));
    
    // Form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSubmit);
    }
    
    // Medical conditions
    if (addConditionBtn) {
        addConditionBtn.addEventListener('click', addConditionField);
    }
    
    // Password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
}

// Load form data from localStorage
function loadFormData() {
    const savedData = localStorage.getItem('elderlycare_signup_data');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            formData = { ...formData, ...parsed };
            
            // Populate form fields
            Object.keys(parsed).forEach(key => {
                const element = document.getElementById(key);
                if (element && parsed[key]) {
                    element.value = parsed[key];
                }
            });
            
            console.log('Loaded saved form data from localStorage');
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Save form data to localStorage
function saveFormData() {
    try {
        // Update formData from current inputs
        updateFormDataFromInputs();
        localStorage.setItem('elderlycare_signup_data', JSON.stringify(formData));
    } catch (e) {
        console.error('Error saving form data:', e);
    }
}

// Update formData from current input values
function updateFormDataFromInputs() {
    // Step 1 fields
    formData.UName = getValue('UName');
    formData.UEmail = getValue('UEmail');
    formData.UPhone = getValue('UPhone');
    formData.UDob = getValue('UDob');
    formData.UGender = getValue('UGender');
    formData.UStreet = getValue('UStreet');
    formData.UCity = getValue('UCity');
    formData.UState = getValue('UState');
    formData.UPincode = getValue('UPincode');
    
    // Step 2 fields
    formData.bloodGroup = getValue('bloodGroup');
    
    // Step 3 fields
    formData.UPassword = getValue('UPassword');
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

// Step Navigation
function goToStep(stepNumber) {
    console.log(`Going to step ${stepNumber}`);
    
    // Hide all steps
    [1, 2, 3].forEach(step => {
        const stepElement = document.getElementById(`step${step}`);
        if (stepElement) {
            stepElement.classList.add('form-step-hidden');
        }
    });
    
    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.remove('form-step-hidden');
    }
    
    currentStep = stepNumber;
    updateStepIndicators();
}

// Update step indicators
function updateStepIndicators() {
    const indicators = document.querySelectorAll('.step-indicator');
    indicators.forEach((indicator, index) => {
        const stepNumber = index + 1;
        indicator.classList.remove('step-active', 'step-complete', 'step-inactive');
        
        if (stepNumber < currentStep) {
            indicator.classList.add('step-complete');
            indicator.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNumber === currentStep) {
            indicator.classList.add('step-active');
            indicator.innerHTML = `<span>${stepNumber}</span>`;
        } else {
            indicator.classList.add('step-inactive');
            indicator.innerHTML = `<span>${stepNumber}</span>`;
        }
    });
}

// Step 1 Validation - FIXED: No email check
function validateStep1(e) {
    e.preventDefault();
    console.log('Validating step 1...');
    
    // Get form elements
    const name = document.getElementById('UName');
    const email = document.getElementById('UEmail');
    const phone = document.getElementById('UPhone');
    const dob = document.getElementById('UDob');
    
    // Clear previous errors
    clearErrors();
    
    let isValid = true;
    
    // Validate Name
    if (!name.value.trim()) {
        showError('nameError', 'Name is required');
        name.classList.add('border-red-500');
        isValid = false;
    }
    
    // Validate Email
    if (!email.value.trim()) {
        showError('emailError', 'Email is required');
        email.classList.add('border-red-500');
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        showError('emailError', 'Please enter a valid email address');
        email.classList.add('border-red-500');
        isValid = false;
    }
    // REMOVED: Email check endpoint call
    
    // Validate Phone
    if (!phone.value.trim()) {
        showError('phoneError', 'Phone number is required');
        phone.classList.add('border-red-500');
        isValid = false;
    } else if (!isValidPhone(phone.value)) {
        showError('phoneError', 'Please enter a valid phone number (10-15 digits)');
        phone.classList.add('border-red-500');
        isValid = false;
    }
    
    // Validate Date of Birth
    if (!dob.value) {
        showError('dobError', 'Date of birth is required');
        dob.classList.add('border-red-500');
        isValid = false;
    }
    
    if (isValid) {
        saveFormData();
        goToStep(2);
    }
}

// Clear all errors
function clearErrors() {
    const errorIds = ['nameError', 'emailError', 'phoneError', 'dobError', 'pincodeError', 'confirmPasswordError'];
    errorIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });
    
    // Remove border classes
    document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
    });
}

// Form submission handler - FIXED
async function handleSubmit(e) {
    e.preventDefault();
    console.log('Handling form submission...');
    
    // Validate step 3
    if (!validateStep3()) {
        return;
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    
    try {
        // Prepare data
        updateFormDataFromInputs();
        
        // Create payload matching your User model
        const payload = {
            UName: formData.UName,
            UEmail: formData.UEmail,
            UPhone: formData.UPhone,
            UDob: formData.UDob,
            UGender: formData.UGender,
            UStreet: formData.UStreet,
            UCity: formData.UCity,
            UState: formData.UState,
            UPincode: formData.UPincode,
            UPassword: formData.UPassword
        };
        
        // Add optional fields if they have values
        if (formData.bloodGroup) payload.bloodGroup = formData.bloodGroup;
        
        console.log('Sending payload:', payload);
        
        // Send registration request
        const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Registration failed');
        }
        
        // Success
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        
        // Clear localStorage
        localStorage.removeItem('elderlycare_signup_data');
        
        // Show success modal
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.classList.remove('hidden');
        }
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Hide loading
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        
        // Show error
        alert('Registration failed: ' + error.message);
    }
}

// Step 3 Validation
function validateStep3() {
    let isValid = true;
    
    // Validate password
    const password = document.getElementById('UPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!password) {
        showError('confirmPasswordError', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showError('confirmPasswordError', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    // Validate password confirmation
    if (!confirmPassword) {
        showError('confirmPasswordError', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        isValid = false;
    }
    
    // Validate terms acceptance
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox || !termsCheckbox.checked) {
        alert('Please accept the Terms of Service and Privacy Policy');
        isValid = false;
    }
    
    return isValid;
}

// Medical Conditions Management
function addConditionField() {
    const conditionId = `condition-${Date.now()}`;
    const conditionDiv = document.createElement('div');
    conditionDiv.className = 'flex items-center space-x-3 mb-2';
    conditionDiv.id = conditionId;
    
    conditionDiv.innerHTML = `
        <input type="text" 
               class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60"
               placeholder="Condition (e.g., Diabetes, Hypertension)">
        <select class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
            <option value="Low">Low</option>
            <option value="Medium" selected>Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
        </select>
        <button type="button" class="remove-condition text-red-400 hover:text-red-300 p-2">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const conditionsContainer = document.getElementById('conditionsContainer');
    if (conditionsContainer) {
        conditionsContainer.appendChild(conditionDiv);
        
        // Add remove functionality
        const removeBtn = conditionDiv.querySelector('.remove-condition');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => conditionDiv.remove());
        }
    }
}

// Password Strength Checker
function initPasswordStrengthChecker() {
    const passwordInput = document.getElementById('UPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordConfirmation);
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('UPassword').value;
    const strengthMeter = document.getElementById('passwordStrengthMeter');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!strengthMeter || !strengthText) return;
    
    // Check criteria
    const hasLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    // Calculate strength
    const criteriaMet = [hasLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
    const strengthPercent = (criteriaMet / 4) * 100;
    
    // Update strength meter
    strengthMeter.style.width = `${strengthPercent}%`;
    strengthMeter.className = 'strength-meter rounded-full h-2';
    
    let strengthClass = 'strength-weak';
    let strengthMessage = 'Weak';
    
    if (strengthPercent >= 100) {
        strengthClass = 'strength-strong';
        strengthMessage = 'Strong';
    } else if (strengthPercent >= 75) {
        strengthClass = 'strength-good';
        strengthMessage = 'Good';
    } else if (strengthPercent >= 50) {
        strengthClass = 'strength-fair';
        strengthMessage = 'Fair';
    }
    
    strengthMeter.classList.add(strengthClass);
    strengthText.textContent = strengthMessage;
}

function checkPasswordConfirmation() {
    const password = document.getElementById('UPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword && password === confirmPassword) {
        document.getElementById('confirmPassword').classList.remove('border-red-500');
        document.getElementById('confirmPassword').classList.add('border-green-500');
    } else {
        document.getElementById('confirmPassword').classList.remove('border-green-500');
        document.getElementById('confirmPassword').classList.add('border-red-500');
    }
}

// Terms Checkbox - FIXED
function initTermsCheckbox() {
    const termsCheckbox = document.getElementById('terms');
    const termsCheckboxDiv = document.getElementById('termsCheckbox');
    
    if (!termsCheckbox || !termsCheckboxDiv) {
        console.warn('Terms checkbox elements not found');
        return;
    }
    
    // Click handler for checkbox div
    termsCheckboxDiv.addEventListener('click', function(e) {
        e.preventDefault();
        const isChecked = !termsCheckbox.checked;
        termsCheckbox.checked = isChecked;
        
        // Update check icon
        const checkIcon = termsCheckboxDiv.querySelector('i');
        if (checkIcon) {
            if (isChecked) {
                checkIcon.classList.remove('opacity-0');
                termsCheckboxDiv.classList.remove('border-red-500');
            } else {
                checkIcon.classList.add('opacity-0');
            }
        }
        
        console.log('Terms checkbox toggled:', isChecked);
    });
}

// Helper Functions
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[+]?[1-9][\d]{9,14}$/.test(phone);
}

function updateDatePlaceholders() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    
    const dobInput = document.getElementById('UDob');
    if (dobInput) {
        dobInput.max = maxDate.toISOString().split('T')[0];
        dobInput.min = minDate.toISOString().split('T')[0];
    }
}

function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const targetId = button.getAttribute('data-target');
    const targetInput = document.getElementById(targetId);
    const icon = button.querySelector('i');
    
    if (targetInput && icon) { 
        if (targetInput.type === 'password') {
            targetInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            targetInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);


// Debug helper
window.debugSignup = {
    getFormData: () => formData,
    goToStep,
    validateStep3
};