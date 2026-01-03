// ============================================
// ElderlyCare Assistant - Signup Module
// ============================================

// API Configuration
const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:5000/api' 
    : '/api'; // Relative URL for production

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

// DOM Elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const nextStep1Btn = document.getElementById('nextStep1Btn');
const prevStep2Btn = document.getElementById('prevStep2Btn');
const nextStep2Btn = document.getElementById('nextStep2Btn');
const prevStep3Btn = document.getElementById('prevStep3Btn');
const submitBtn = document.getElementById('submitBtn');
const conditionsContainer = document.getElementById('conditionsContainer');
const addConditionBtn = document.getElementById('addConditionBtn');
const termsCheckbox = document.getElementById('terms');
const termsCheckboxDiv = document.getElementById('termsCheckbox');
const loadingOverlay = document.getElementById('loadingOverlay');
const successModal = document.getElementById('successModal');
const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
const passwordStrengthText = document.getElementById('passwordStrengthText');
const passwordInput = document.getElementById('UPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const confirmPasswordError = document.getElementById('confirmPasswordError');

// Password strength indicators
const lengthCheck = document.getElementById('lengthCheck');
const uppercaseCheck = document.getElementById('uppercaseCheck');
const lowercaseCheck = document.getElementById('lowercaseCheck');
const numberCheck = document.getElementById('numberCheck');

// Initialize the application
function init() {
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
}

// Setup all event listeners
function setupEventListeners() {
    // Step navigation
    nextStep1Btn.addEventListener('click', validateStep1);
    prevStep2Btn.addEventListener('click', goToStep1);
    nextStep2Btn.addEventListener('click', validateStep2);
    prevStep3Btn.addEventListener('click', goToStep2);
    
    // Form submission
    document.getElementById('signupForm').addEventListener('submit', handleSubmit);
    
    // Medical conditions
    addConditionBtn.addEventListener('click', addConditionField);
    
    // Real-time validation
    setupRealTimeValidation();
    
    // Password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
}

// Load form data from localStorage
function loadFormData() {
    const savedData = localStorage.getItem('elderlycare_signup_data');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        formData = { ...formData, ...parsed };
        
        // Populate form fields
        Object.keys(parsed).forEach(key => {
            const element = document.getElementById(key);
            if (element && parsed[key]) {
                if (element.type === 'date') {
                    element.value = parsed[key].split('T')[0];
                } else if (element.type === 'select-one') {
                    element.value = parsed[key];
                } else {
                    element.value = parsed[key];
                }
            }
        });
        
        // Load medical conditions
        if (parsed.medicalConditions && Array.isArray(parsed.medicalConditions)) {
            parsed.medicalConditions.forEach(condition => {
                addConditionField(condition);
            });
        }
        
        // Load emergency contacts
        if (parsed.emergencyContacts && Array.isArray(parsed.emergencyContacts) && parsed.emergencyContacts.length > 0) {
            const contact = parsed.emergencyContacts[0];
            document.getElementById('emergencyName').value = contact.name || '';
            document.getElementById('emergencyPhone').value = contact.phone || '';
            document.getElementById('emergencyRelationship').value = contact.relationship || '';
        }
        
        console.log('Loaded saved form data from localStorage');
    }
}

// Save form data to localStorage
function saveFormData() {
    // Update formData from current inputs
    updateFormDataFromInputs();
    
    localStorage.setItem('elderlycare_signup_data', JSON.stringify(formData));
}

// Update formData from current input values
function updateFormDataFromInputs() {
    // Step 1 fields
    formData.UName = document.getElementById('UName').value.trim();
    formData.UEmail = document.getElementById('UEmail').value.trim().toLowerCase();
    formData.UPhone = document.getElementById('UPhone').value.trim();
    formData.UDob = document.getElementById('UDob').value;
    formData.UGender = document.getElementById('UGender').value;
    formData.UStreet = document.getElementById('UStreet').value.trim();
    formData.UCity = document.getElementById('UCity').value.trim();
    formData.UState = document.getElementById('UState').value.trim();
    formData.UPincode = document.getElementById('UPincode').value.trim();
    
    // Step 2 fields
    formData.bloodGroup = document.getElementById('bloodGroup').value;
    
    // Emergency contact
    const emergencyName = document.getElementById('emergencyName').value.trim();
    const emergencyPhone = document.getElementById('emergencyPhone').value.trim();
    const emergencyRelationship = document.getElementById('emergencyRelationship').value;
    
    if (emergencyName && emergencyPhone) {
        formData.emergencyContacts = [{
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRelationship || 'Other',
            isPrimary: true
        }];
    }
    
    // Step 3 fields
    formData.UPassword = document.getElementById('UPassword').value;
}

// Step Navigation Functions
function goToStep1() {
    saveFormData();
    hideStep(2);
    showStep(1);
    currentStep = 1;
    updateStepIndicators();
}

function goToStep2() {
    saveFormData();
    hideStep(3);
    showStep(2);
    currentStep = 2;
    updateStepIndicators();
}

function goToStep3() {
    saveFormData();
    hideStep(2);
    showStep(3);
    currentStep = 3;
    updateStepIndicators();
}

// Step visibility helpers
function showStep(stepNumber) {
    const stepElement = document.getElementById(`step${stepNumber}`);
    stepElement.classList.remove('form-step-hidden');
    stepElement.style.opacity = '1';
    stepElement.style.transform = 'translateX(0)';
}

function hideStep(stepNumber) {
    const stepElement = document.getElementById(`step${stepNumber}`);
    stepElement.classList.add('form-step-hidden');
    stepElement.style.opacity = '0';
    stepElement.style.transform = 'translateX(20px)';
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

// Step 1 Validation
async function validateStep1(e) {
    e.preventDefault();
    
    // Get form elements
    const name = document.getElementById('UName');
    const email = document.getElementById('UEmail');
    const phone = document.getElementById('UPhone');
    const dob = document.getElementById('UDob');
    const gender = document.getElementById('UGender');
    const street = document.getElementById('UStreet');
    const city = document.getElementById('UCity');
    const state = document.getElementById('UState');
    const pincode = document.getElementById('UPincode');
    
    // Clear previous errors
    clearStep1Errors();
    
    let isValid = true;
    
    // Validate Name
    if (!name.value.trim()) {
        showError('nameError', 'Name is required');
        name.classList.add('border-red-500');
        isValid = false;
    } else if (name.value.trim().length < 2) {
        showError('nameError', 'Name must be at least 2 characters');
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
    } else {
        // Check if email exists
        const emailExists = await checkEmailExists(email.value);
        if (emailExists) {
            showError('emailError', 'This email is already registered');
            email.classList.add('border-red-500');
            isValid = false;
        }
    }
    
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
    } else {
        const birthDate = new Date(dob.value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 18) {
            showError('dobError', 'You must be at least 18 years old');
            dob.classList.add('border-red-500');
            isValid = false;
        } else if (age > 120) {
            showError('dobError', 'Please enter a valid date of birth');
            dob.classList.add('border-red-500');
            isValid = false;
        }
    }
    
    // Validate Gender
    if (!gender.value) {
        gender.classList.add('border-red-500');
        isValid = false;
    }
    
    // Validate Address
    if (!street.value.trim()) {
        street.classList.add('border-red-500');
        isValid = false;
    }
    
    if (!city.value.trim()) {
        city.classList.add('border-red-500');
        isValid = false;
    }
    
    if (!state.value.trim()) {
        state.classList.add('border-red-500');
        isValid = false;
    }
    
    // Validate Pincode
    if (!pincode.value.trim()) {
        showError('pincodeError', 'Pincode is required');
        pincode.classList.add('border-red-500');
        isValid = false;
    } else if (!isValidPincode(pincode.value)) {
        showError('pincodeError', 'Please enter a valid 6-digit pincode');
        pincode.classList.add('border-red-500');
        isValid = false;
    }
    
    // If valid, proceed to step 2
    if (isValid) {
        saveFormData();
        goToStep2();
    } else {
        // Scroll to first error
        const firstError = document.querySelector('.border-red-500');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Step 2 Validation
function validateStep2(e) {
    e.preventDefault();
    
    // Step 2 is optional, so we just proceed
    saveFormData();
    goToStep3();
}

// Form submission handler
async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate final step
    if (!validateStep3()) {
        return;
    }
    
    // Show loading overlay
    loadingOverlay.classList.remove('hidden');
    
    try {
        // Prepare final data
        updateFormDataFromInputs();
        
        // Remove empty optional fields
        const payload = { ...formData };
        
        if (!payload.bloodGroup) delete payload.bloodGroup;
        if (payload.emergencyContacts.length === 0) delete payload.emergencyContacts;
        if (payload.medicalConditions.length === 0) delete payload.medicalConditions;
        
        // Add optional fields if they exist
        const emergencyName = document.getElementById('emergencyName').value.trim();
        const emergencyPhone = document.getElementById('emergencyPhone').value.trim();
        const emergencyRelationship = document.getElementById('emergencyRelationship').value;
        
        if (emergencyName && emergencyPhone) {
            payload.emergencyContacts = [{
                name: emergencyName,
                phone: emergencyPhone,
                relationship: emergencyRelationship || 'Other',
                isPrimary: true
            }];
        }
        
        // Send registration request
        const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // Success - hide loading, show success modal
        loadingOverlay.classList.add('hidden');
        showSuccessModal();
        
        // Clear localStorage
        localStorage.removeItem('elderlycare_signup_data');
        
        // Auto-redirect after 5 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 5000);
        
    } catch (error) {
        loadingOverlay.classList.add('hidden');
        showErrorNotification(error.message);
        console.error('Registration error:', error);
    }
}

// Step 3 Validation
function validateStep3() {
    let isValid = true;
    
    // Validate password
    const password = document.getElementById('UPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!password) {
        passwordInput.classList.add('border-red-500');
        isValid = false;
    } else if (!isValidPassword(password)) {
        showErrorNotification('Password must be at least 6 characters with uppercase, lowercase, and number');
        passwordInput.classList.add('border-red-500');
        isValid = false;
    } else {
        passwordInput.classList.remove('border-red-500');
    }
    
    // Validate password confirmation
    if (!confirmPassword) {
        showError('confirmPasswordError', 'Please confirm your password');
        confirmPasswordInput.classList.add('border-red-500');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        confirmPasswordInput.classList.add('border-red-500');
        isValid = false;
    } else {
        clearError('confirmPasswordError');
        confirmPasswordInput.classList.remove('border-red-500');
    }
    
    // Validate terms acceptance
    if (!termsCheckbox.checked) {
        showErrorNotification('Please accept the Terms of Service and Privacy Policy');
        termsCheckboxDiv.classList.add('border-2', 'border-red-500');
        isValid = false;
    } else {
        termsCheckboxDiv.classList.remove('border-2', 'border-red-500');
    }
    
    return isValid;
}

// Email existence check
async function checkEmailExists(email) {
    try {
        // This endpoint might not exist in your backend yet
        // You can implement it or remove this check
        const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        if (response.status === 404) {
            // Endpoint doesn't exist, skip check
            return false;
        }
        
        const data = await response.json();
        return data.exists || false;
        
    } catch (error) {
        console.warn('Email check failed, proceeding anyway:', error);
        return false; // Don't block registration if check fails
    }
}

// Medical Conditions Management
function addConditionField(prefilled = null) {
    const conditionId = `condition-${Date.now()}`;
    const conditionDiv = document.createElement('div');
    conditionDiv.className = 'flex items-center space-x-3 mb-2';
    conditionDiv.id = conditionId;
    
    conditionDiv.innerHTML = `
        <input type="text" 
               class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60"
               placeholder="Condition (e.g., Diabetes, Hypertension)"
               value="${prefilled ? prefilled.condition : ''}">
        <select class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
            <option value="Low" ${prefilled && prefilled.severity === 'Low' ? 'selected' : ''}>Low</option>
            <option value="Medium" ${prefilled && prefilled.severity === 'Medium' ? 'selected' : ''} selected>Medium</option>
            <option value="High" ${prefilled && prefilled.severity === 'High' ? 'selected' : ''}>High</option>
            <option value="Critical" ${prefilled && prefilled.severity === 'Critical' ? 'selected' : ''}>Critical</option>
        </select>
        <button type="button" class="remove-condition text-red-400 hover:text-red-300 p-2">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    conditionsContainer.appendChild(conditionDiv);
    
    // Add remove functionality
    conditionDiv.querySelector('.remove-condition').addEventListener('click', () => {
        conditionDiv.remove();
        updateMedicalConditions();
    });
    
    // Add change listener to update formData
    const inputs = conditionDiv.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', updateMedicalConditions);
    });
    
    if (!prefilled) {
        updateMedicalConditions();
    }
}

function updateMedicalConditions() {
    formData.medicalConditions = [];
    const conditionDivs = conditionsContainer.querySelectorAll('div[id^="condition-"]');
    
    conditionDivs.forEach(div => {
        const conditionInput = div.querySelector('input[type="text"]');
        const severitySelect = div.querySelector('select');
        
        if (conditionInput.value.trim()) {
            formData.medicalConditions.push({
                condition: conditionInput.value.trim(),
                severity: severitySelect.value,
                isActive: true
            });
        }
    });
    
    saveFormData();
}

// Password Strength Checker
function initPasswordStrengthChecker() {
    passwordInput.addEventListener('input', checkPasswordStrength);
    confirmPasswordInput.addEventListener('input', checkPasswordConfirmation);
}

function checkPasswordStrength() {
    const password = passwordInput.value;
    
    // Check criteria
    const hasLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    // Update check icons
    updateCheckIcon(lengthCheck, hasLength);
    updateCheckIcon(uppercaseCheck, hasUppercase);
    updateCheckIcon(lowercaseCheck, hasLowercase);
    updateCheckIcon(numberCheck, hasNumber);
    
    // Calculate strength
    const criteriaMet = [hasLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
    const strengthPercent = (criteriaMet / 4) * 100;
    
    // Update strength meter
    passwordStrengthMeter.style.width = `${strengthPercent}%`;
    passwordStrengthMeter.className = 'strength-meter rounded-full h-2';
    
    let strengthText = 'Weak';
    let strengthClass = 'strength-weak';
    
    if (strengthPercent >= 100) {
        strengthText = 'Strong';
        strengthClass = 'strength-strong';
    } else if (strengthPercent >= 75) {
        strengthText = 'Good';
        strengthClass = 'strength-good';
    } else if (strengthPercent >= 50) {
        strengthText = 'Fair';
        strengthClass = 'strength-fair';
    }
    
    passwordStrengthMeter.classList.add(strengthClass);
    passwordStrengthText.textContent = strengthText;
}

function checkPasswordConfirmation() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!confirmPassword) {
        clearError('confirmPasswordError');
        confirmPasswordInput.classList.remove('border-red-500', 'border-green-500');
        return;
    }
    
    if (password === confirmPassword) {
        clearError('confirmPasswordError');
        confirmPasswordInput.classList.remove('border-red-500');
        confirmPasswordInput.classList.add('border-green-500');
    } else {
        showError('confirmPasswordError', 'Passwords do not match');
        confirmPasswordInput.classList.remove('border-green-500');
        confirmPasswordInput.classList.add('border-red-500');
    }
}

function updateCheckIcon(element, isValid) {
    const icon = element.querySelector('i');
    if (isValid) {
        icon.className = 'fas fa-check mr-2 text-green-400';
    } else {
        icon.className = 'fas fa-times mr-2 text-red-400';
    }
}

// Terms Checkbox
function initTermsCheckbox() {
    termsCheckboxDiv.addEventListener('click', () => {
        const isChecked = !termsCheckbox.checked;
        termsCheckbox.checked = isChecked;
        
        const checkIcon = termsCheckboxDiv.querySelector('i');
        if (isChecked) {
            checkIcon.classList.remove('opacity-0');
            termsCheckboxDiv.classList.remove('border-red-500');
        } else {
            checkIcon.classList.add('opacity-0');
        }
    });
}

// Real-time validation setup
function setupRealTimeValidation() {
    // Step 1 fields
    const step1Fields = ['UName', 'UEmail', 'UPhone', 'UPincode'];
    step1Fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        }
    });
    
    // Date field special handling
    const dobField = document.getElementById('UDob');
    if (dobField) {
        dobField.addEventListener('change', validateDateField);
    }
}

function validateField(e) {
    const field = e.target;
    const fieldId = field.id;
    
    switch (fieldId) {
        case 'UName':
            if (field.value.trim().length < 2) {
                showError('nameError', 'Name must be at least 2 characters');
                field.classList.add('border-red-500');
            }
            break;
            
        case 'UEmail':
            if (field.value.trim() && !isValidEmail(field.value)) {
                showError('emailError', 'Please enter a valid email');
                field.classList.add('border-red-500');
            }
            break;
            
        case 'UPhone':
            if (field.value.trim() && !isValidPhone(field.value)) {
                showError('phoneError', 'Please enter a valid phone number');
                field.classList.add('border-red-500');
            }
            break;
            
        case 'UPincode':
            if (field.value.trim() && !isValidPincode(field.value)) {
                showError('pincodeError', 'Please enter a valid 6-digit pincode');
                field.classList.add('border-red-500');
            }
            break;
    }
}

function validateDateField(e) {
    const field = e.target;
    if (!field.value) return;
    
    const birthDate = new Date(field.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18) {
        showError('dobError', 'You must be at least 18 years old');
        field.classList.add('border-red-500');
    } else if (age > 120) {
        showError('dobError', 'Please enter a valid date of birth');
        field.classList.add('border-red-500');
    } else {
        clearError('dobError');
        field.classList.remove('border-red-500');
    }
}

function clearFieldError(e) {
    const field = e.target;
    const fieldId = field.id;
    
    field.classList.remove('border-red-500');
    
    const errorFields = {
        'UName': 'nameError',
        'UEmail': 'emailError',
        'UPhone': 'phoneError',
        'UDob': 'dobError',
        'UPincode': 'pincodeError'
    };
    
    if (errorFields[fieldId]) {
        clearError(errorFields[fieldId]);
    }
}

// Clear step 1 errors
function clearStep1Errors() {
    const errorIds = ['nameError', 'emailError', 'phoneError', 'dobError', 'pincodeError'];
    errorIds.forEach(id => clearError(id));
    
    // Remove border classes
    const step1Fields = document.querySelectorAll('#step1 input, #step1 select');
    step1Fields.forEach(field => {
        field.classList.remove('border-red-500');
    });
}

// Helper Functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[+]?[1-9][\d]{9,14}$/.test(phone);
}

function isValidPincode(pincode) {
    return /^\d{6}$/.test(pincode);
}

function isValidPassword(password) {
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/.test(password);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
    }
}

function showErrorNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-in-right';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function showSuccessModal() {
    successModal.classList.remove('hidden');
}

function updateDatePlaceholders() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    
    const dobInput = document.getElementById('UDob');
    if (dobInput) {
        dobInput.max = maxDate.toISOString().split('T')[0];
        dobInput.min = minDate.toISOString().split('T')[0];
        dobInput.placeholder = maxDate.toISOString().split('T')[0];
    }
}

function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const targetId = button.getAttribute('data-target');
    const targetInput = document.getElementById(targetId);
    const icon = button.querySelector('i');
    
    if (targetInput.type === 'password') {
        targetInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        targetInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Auto-save form data periodically
setInterval(saveFormData, 10000); // Save every 10 seconds

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle page refresh warning
window.addEventListener('beforeunload', (e) => {
    if (currentStep > 1) {
        // Save data before leaving
        saveFormData();
        
        // Only show warning in development or if there's significant data
        if (process.env.NODE_ENV === 'development') {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        isValidPhone,
        isValidPincode,
        isValidPassword
    };
}