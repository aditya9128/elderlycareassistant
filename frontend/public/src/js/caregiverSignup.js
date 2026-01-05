// ============================================
// ElderlyCare Assistant - Caregiver Signup Module
// ============================================

// API Configuration
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api'
    : 'https://elderlycare-backend-f853.onrender.com/api';
    

// Global state
let currentStep = 1;
let formData = {
    // Step 1: Personal Information
    cgName: '',
    cgEmail: '',
    cgPhone: '',
    cgDob: '',
    cgGender: '',
    cgAddress: '',
    cgWorkingCity: '',
    cgWorkingState: '',
    
    // Step 2: Professional Information
    cgExpYears: 0,
    jobType: '',
    cgSpecialization: [],
    cgSkills: [],
    cgLanguages: [],
    cgCharges: {
        hourly: 0
    },
    cgProfileDescription: '',
    
    // Step 3: Account Setup
    cgPassword: '',
    availabilityDays: [],
    availabilityTimings: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
    }
};

// Specializations from Caregiver model
const SPECIALIZATIONS = [
    'Elderly Care',
    'Post-Surgery Care',
    'Dementia Care',
    'Physical Therapy',
    'Palliative Care',
    'Medication Management',
    'Mobility Assistance',
    'Companionship',
    'Meal Preparation',
    'Housekeeping',
    'Physiotherapy',
    'Nursing Care',
    'Geriatric Care',
    'Home Care',
    'Memory Care',
    'Respite Care',
    'Hospice Care',
    'Diabetes Care',
    'Stroke Recovery',
    'Parkinson Care'
];

// Initialize the application
function init() {
    console.log('Initializing caregiver signup form...');
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize step indicators
    updateStepIndicators();
    
    // Initialize specialization badges
    initSpecializationBadges();
    
    // Initialize character counter
    initCharacterCounter();
    
    // Initialize availability checkboxes
    initAvailabilityCheckboxes();
    
    // Initialize terms checkbox
    initTermsCheckbox();
    
    // Update date constraints
    updateDateConstraints();
    
    console.log('Caregiver signup form initialized');
}

// Setup all event listeners
function setupEventListeners() {
    // Step navigation
    const nextStep1Btn = document.getElementById('nextStep1Btn');
    const prevStep2Btn = document.getElementById('prevStep2Btn');
    const nextStep2Btn = document.getElementById('nextStep2Btn');
    const prevStep3Btn = document.getElementById('prevStep3Btn');
    
    if (nextStep1Btn) nextStep1Btn.addEventListener('click', validateStep1);
    if (prevStep2Btn) prevStep2Btn.addEventListener('click', () => goToStep(1));
    if (nextStep2Btn) nextStep2Btn.addEventListener('click', validateStep2);
    if (prevStep3Btn) prevStep3Btn.addEventListener('click', () => goToStep(2));
    
    // Form submission
    const caregiverSignupForm = document.getElementById('caregiverSignupForm');
    if (caregiverSignupForm) {
        caregiverSignupForm.addEventListener('submit', handleSubmit);
    }
    
    // Skills and languages input
    const skillsInput = document.getElementById('skillsInput');
    const addSkillBtn = document.getElementById('addSkillBtn');
    const languagesInput = document.getElementById('languagesInput');
    const addLanguageBtn = document.getElementById('addLanguageBtn');
    
    if (skillsInput) {
        skillsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    }
    
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', addSkill);
    }
    
    if (languagesInput) {
        languagesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addLanguage();
            }
        });
    }
    
    if (addLanguageBtn) {
        addLanguageBtn.addEventListener('click', addLanguage);
    }
    
    // Password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
    
    // Profile description character count
    const descriptionInput = document.getElementById('cgProfileDescription');
    if (descriptionInput) {
        descriptionInput.addEventListener('input', updateCharacterCount);
    }
}

// Load form data from localStorage
function loadFormData() {
    const savedData = localStorage.getItem('elderlycare_caregiver_signup_data');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            formData = { ...formData, ...parsed };
            
            // Populate form fields
            Object.keys(parsed).forEach(key => {
                const element = document.getElementById(key);
                if (element && parsed[key]) {
                    if (key === 'cgSpecialization' && Array.isArray(parsed[key])) {
                        // Handle specializations separately
                        parsed[key].forEach(spec => {
                            const badge = document.querySelector(`[data-specialization="${spec}"]`);
                            if (badge) badge.click();
                        });
                    } else if (key === 'cgSkills' && Array.isArray(parsed[key])) {
                        // Handle skills separately
                        parsed[key].forEach(skill => addSkillToUI(skill));
                    } else if (key === 'cgLanguages' && Array.isArray(parsed[key])) {
                        // Handle languages separately
                        parsed[key].forEach(language => addLanguageToUI(language));
                    } else if (key === 'cgCharges' && typeof parsed[key] === 'object') {
                        // Handle charges
                        const hourlyInput = document.getElementById('cgChargesHourly');
                        if (hourlyInput && parsed[key].hourly) {
                            hourlyInput.value = parsed[key].hourly;
                        }
                    } else {
                        element.value = parsed[key];
                    }
                }
            });
            
            console.log('Loaded saved caregiver form data from localStorage');
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
        localStorage.setItem('elderlycare_caregiver_signup_data', JSON.stringify(formData));
    } catch (e) {
        console.error('Error saving form data:', e);
    }
}

// Update formData from current input values
function updateFormDataFromInputs() {
    // Step 1 fields
    formData.cgName = getValue('cgName');
    formData.cgEmail = getValue('cgEmail');
    formData.cgPhone = getValue('cgPhone');
    formData.cgDob = getValue('cgDob');
    formData.cgGender = getValue('cgGender');
    formData.cgAddress = getValue('cgAddress');
    formData.cgWorkingCity = getValue('cgWorkingCity');
    formData.cgWorkingState = getValue('cgWorkingState');
    
    // Step 2 fields
    const expYears = parseInt(getValue('cgExpYears')) || 0;
    formData.cgExpYears = expYears;
    formData.jobType = getValue('jobType');
    
    // Hourly charges
    const hourlyCharge = parseFloat(getValue('cgChargesHourly')) || 0;
    formData.cgCharges.hourly = hourlyCharge;
    
    formData.cgProfileDescription = getValue('cgProfileDescription');
    
    // Step 3 fields
    formData.cgPassword = getValue('cgPassword');
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

// Step Navigation
function goToStep(stepNumber) {
    console.log(`Going to step ${stepNumber}`);
    
    // Validate current step before proceeding
    if (stepNumber > currentStep) {
        if (currentStep === 1 && !validateStep1Silent()) return;
        if (currentStep === 2 && !validateStep2Silent()) return;
    }
    
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
    saveFormData();
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
function validateStep1(e) {
    if (e) e.preventDefault();
    console.log('Validating step 1...');
    
    // Get form elements
    const name = document.getElementById('cgName');
    const email = document.getElementById('cgEmail');
    const phone = document.getElementById('cgPhone');
    const dob = document.getElementById('cgDob');
    const city = document.getElementById('cgWorkingCity');
    const state = document.getElementById('cgWorkingState');
    
    // Clear previous errors
    clearErrors(['nameError', 'emailError', 'phoneError', 'dobError']);
    
    let isValid = true;
    
    // Validate Name
    if (!name.value.trim()) {
        showError('nameError', 'Name is required');
        highlightError(name);
        isValid = false;
    }
    
    // Validate Email
    if (!email.value.trim()) {
        showError('emailError', 'Email is required');
        highlightError(email);
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        showError('emailError', 'Please enter a valid email address');
        highlightError(email);
        isValid = false;
    }
    
    // Validate Phone
    if (!phone.value.trim()) {
        showError('phoneError', 'Phone number is required');
        highlightError(phone);
        isValid = false;
    } else if (!isValidPhone(phone.value)) {
        showError('phoneError', 'Please enter a valid phone number (10-15 digits)');
        highlightError(phone);
        isValid = false;
    }
    
    // Validate Date of Birth
    if (!dob.value) {
        showError('dobError', 'Date of birth is required');
        highlightError(dob);
        isValid = false;
    } else {
        const birthDate = new Date(dob.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 18) {
            showError('dobError', 'You must be at least 18 years old');
            highlightError(dob);
            isValid = false;
        } else if (age > 100) {
            showError('dobError', 'Please enter a valid date of birth');
            highlightError(dob);
            isValid = false;
        }
    }
    
    // Validate Working City
    if (!city.value.trim()) {
        showError('nameError', 'Working city is required');
        highlightError(city);
        isValid = false;
    }
    
    // Validate Working State
    if (!state.value.trim()) {
        showError('nameError', 'Working state is required');
        highlightError(state);
        isValid = false;
    }
    
    if (isValid) {
        saveFormData();
        goToStep(2);
    }
    
    return isValid;
}

// Silent validation for Step 1 (no error display)
function validateStep1Silent() {
    const name = document.getElementById('cgName');
    const email = document.getElementById('cgEmail');
    const phone = document.getElementById('cgPhone');
    const dob = document.getElementById('cgDob');
    const city = document.getElementById('cgWorkingCity');
    const state = document.getElementById('cgWorkingState');
    
    if (!name.value.trim()) return false;
    if (!email.value.trim() || !isValidEmail(email.value)) return false;
    if (!phone.value.trim() || !isValidPhone(phone.value)) return false;
    if (!dob.value) return false;
    if (!city.value.trim()) return false;
    if (!state.value.trim()) return false;
    
    return true;
}

// Step 2 Validation
function validateStep2(e) {
    if (e) e.preventDefault();
    console.log('Validating step 2...');
    
    // Get form elements
    const expYears = document.getElementById('cgExpYears');
    const jobType = document.getElementById('jobType');
    const hourlyCharge = document.getElementById('cgChargesHourly');
    const description = document.getElementById('cgProfileDescription');
    
    // Clear previous errors
    clearErrors(['expError', 'specializationError']);
    
    let isValid = true;
    
    // Validate Experience Years
    if (!expYears.value.trim()) {
        showError('expError', 'Years of experience is required');
        highlightError(expYears);
        isValid = false;
    } else {
        const years = parseInt(expYears.value);
        if (isNaN(years) || years < 0 || years > 50) {
            showError('expError', 'Experience must be between 0 and 50 years');
            highlightError(expYears);
            isValid = false;
        }
    }
    
    // Validate Job Type
    if (!jobType.value) {
        showError('expError', 'Job type is required');
        highlightError(jobType);
        isValid = false;
    }
    
    // Validate Specialization
    if (formData.cgSpecialization.length === 0) {
        showError('specializationError', 'Please select at least one specialization');
        isValid = false;
    }
    
    // Validate Skills
    if (formData.cgSkills.length === 0) {
        showError('specializationError', 'Please add at least one skill');
        isValid = false;
    }
    
    // Validate Languages
    if (formData.cgLanguages.length === 0) {
        showError('specializationError', 'Please add at least one language');
        isValid = false;
    }
    
    // Validate Hourly Charges
    if (!hourlyCharge.value.trim()) {
        showError('expError', 'Hourly charges are required');
        highlightError(hourlyCharge);
        isValid = false;
    } else {
        const charge = parseFloat(hourlyCharge.value);
        if (isNaN(charge) || charge < 0) {
            showError('expError', 'Hourly charges must be a positive number');
            highlightError(hourlyCharge);
            isValid = false;
        }
    }
    
    // Validate Profile Description
    if (!description.value.trim()) {
        showError('specializationError', 'Profile description is required');
        highlightError(description);
        isValid = false;
    } else if (description.value.trim().length < 50) {
        showError('specializationError', 'Profile description should be at least 50 characters');
        highlightError(description);
        isValid = false;
    }
    
    if (isValid) {
        saveFormData();
        goToStep(3);
    }
    
    return isValid;
}

// Silent validation for Step 2 (no error display)
function validateStep2Silent() {
    const expYears = document.getElementById('cgExpYears');
    const jobType = document.getElementById('jobType');
    const hourlyCharge = document.getElementById('cgChargesHourly');
    const description = document.getElementById('cgProfileDescription');
    
    if (!expYears.value.trim()) return false;
    if (!jobType.value) return false;
    if (formData.cgSpecialization.length === 0) return false;
    if (formData.cgSkills.length === 0) return false;
    if (formData.cgLanguages.length === 0) return false;
    if (!hourlyCharge.value.trim()) return false;
    if (!description.value.trim() || description.value.trim().length < 50) return false;
    
    return true;
}

// Form submission handler
// Form submission handler - UPDATED VERSION
async function handleSubmit(e) {
    e.preventDefault();
    console.log('Handling caregiver form submission...');
    
    // Validate step 3
    if (!validateStep3()) {
        return;
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    
    try {
        // Get password value directly
        const password = document.getElementById('cgPassword').value;
        
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        // Format phone number
        let phoneNumber = formData.cgPhone;
        phoneNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
        
        if (phoneNumber.length === 10) {
            phoneNumber = '+91' + phoneNumber;
        } else if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
        }
        
        // Format date to ISO string
        const dobDate = new Date(formData.cgDob);
        const formattedDob = dobDate.toISOString();
        
        // Get hourly charge
        const hourlyCharge = parseFloat(document.getElementById('cgChargesHourly').value) || 0;
        
        // Prepare data for API - UPDATED to match validation
        const payload = {
            // Personal Information
            cgName: formData.cgName.trim(),
            cgEmail: formData.cgEmail.toLowerCase().trim(),
            cgPhone: phoneNumber,
            cgDob: formattedDob,
            cgGender: formData.cgGender,
            cgAddress: formData.cgAddress.trim(),
            cgWorkingCity: formData.cgWorkingCity.trim(),
            cgWorkingState: formData.cgWorkingState.trim(),
            cgPincode: formData.cgPincode || '000000',
            
            // Professional Information
            cgExpYears: parseInt(formData.cgExpYears) || 0,
            cgSpecialization: formData.cgSpecialization,
            cgSkills: formData.cgSkills,
            cgLanguages: formData.cgLanguages,
            jobType: formData.jobType,
            cgProfileDescription: formData.cgProfileDescription.trim(),
            
            // CHARGES - Send as simple object {hourly: number}
            cgCharges: {
                hourly: hourlyCharge
            },
            
            // Account & Availability
            cgPassword: password,
            availabilityDays: formData.availabilityDays,
            availabilityTimings: formData.availabilityTimings,
            
            // Optional fields with defaults
            bankDetails: {
                bankName: "To be added",
                accountNumber: "000000000000",
                accountHolderName: formData.cgName.trim(),
                ifscCode: "AAAA0000000"
            },
            
            documents: {
                idProof: "pending_upload"
            }
        };
        
        console.log('Sending caregiver payload:', JSON.stringify(payload, null, 2));
        
        // Send registration request with better error handling
        const response = await fetch(`${API_BASE_URL}/auth/register/caregiver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status);
        
        let data;
        try {
            data = await response.json();
            console.log('Response data:', data);
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            throw new Error('Server returned invalid response');
        }
        
        if (!response.ok) {
            // Extract error messages from response
            let errorMessage = 'Registration failed';
            
            if (data.errors && Array.isArray(data.errors)) {
                // Format validation errors
                const errorMessages = data.errors.map(err => {
                    const key = Object.keys(err)[0];
                    const fieldName = key.replace('cg', '').replace(/([A-Z])/g, ' $1').trim();
                    return `${fieldName}: ${err[key]}`;
                }).join('\n');
                errorMessage = errorMessages;
            } else if (data.message) {
                errorMessage = data.message;
            }
            
            throw new Error(errorMessage);
        }
        
        if (!data.success) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // SUCCESS
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        
        // Clear localStorage
        localStorage.removeItem('elderlycare_caregiver_signup_data');
        
        // Show success modal
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.classList.remove('hidden');
        }
        
        // Store token if provided
        if (data.token) {
            localStorage.setItem('caregiver_token', data.token);
        }
        
        // Store user data if provided
        if (data.caregiver) {
            localStorage.setItem('caregiver_data', JSON.stringify(data.caregiver));
        }
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'caregiver-dashboard.html';
        }, 3000);
        
    } catch (error) {
        console.error('Caregiver registration error:', error);
        
        // Hide loading
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        
        // Show detailed error message in a modal
        let errorMessage = error.message;
        
        // Format error message for better display
        if (errorMessage.includes('E11000')) {
            errorMessage = 'Email or phone number already registered. Please use different credentials.';
        } else if (errorMessage.includes('validation failed')) {
            errorMessage = 'Please check all fields and ensure they are correctly filled.';
        } else if (errorMessage.includes('phone')) {
            errorMessage = 'Please enter a valid phone number (10 digits)';
        } else if (errorMessage.includes('email')) {
            errorMessage = 'Please enter a valid email address';
        } else if (errorMessage.includes('password')) {
            errorMessage = 'Password must be at least 6 characters';
        }
        
        // Create error modal
        showErrorModal(errorMessage);
    }
}

// Show error modal function
function showErrorModal(message) {
    // Remove existing error modal
    const existingModal = document.getElementById('errorModal');
    if (existingModal) existingModal.remove();
    
    // Create new error modal
    const modal = document.createElement('div');
    modal.id = 'errorModal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-md w-full p-8 text-center animate-slide-up">
            <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Registration Error</h3>
            <div class="text-gray-600 mb-6 text-left bg-red-50 p-4 rounded-lg">
                ${message.split('\n').map(line => `<p class="mb-1">${line}</p>`).join('')}
            </div>
            <button id="closeErrorModal" 
                    class="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all duration-300">
                OK, I'll fix it
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close event
    document.getElementById('closeErrorModal').addEventListener('click', () => {
        modal.remove();
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Step 3 Validation
function validateStep3() {
    let isValid = true;
    
    // Clear previous errors
    clearErrors(['confirmPasswordError']);
    
    // Validate password
    const password = document.getElementById('cgPassword').value;
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
    
    // Validate availability days
    if (formData.availabilityDays.length === 0) {
        alert('Please select at least one availability day');
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

// Initialize specialization badges
function initSpecializationBadges() {
    const container = document.getElementById('specializationContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    SPECIALIZATIONS.forEach(specialization => {
        const badge = document.createElement('div');
        badge.className = 'specialization-badge unselected';
        badge.textContent = specialization;
        badge.dataset.specialization = specialization;
        
        badge.addEventListener('click', () => {
            badge.classList.toggle('selected');
            badge.classList.toggle('unselected');
            
            // Update formData
            const index = formData.cgSpecialization.indexOf(specialization);
            if (index === -1) {
                formData.cgSpecialization.push(specialization);
            } else {
                formData.cgSpecialization.splice(index, 1);
            }
            
            // Update hidden input
            const hiddenInput = document.getElementById('cgSpecialization');
            if (hiddenInput) {
                hiddenInput.value = JSON.stringify(formData.cgSpecialization);
            }
        });
        
        container.appendChild(badge);
    });
}

// Add skill functionality
function addSkill() {
    const input = document.getElementById('skillsInput');
    const skill = input.value.trim();
    
    if (skill && !formData.cgSkills.includes(skill)) {
        addSkillToUI(skill);
        formData.cgSkills.push(skill);
        updateHiddenInput('cgSkills', formData.cgSkills);
        input.value = '';
        input.focus();
    }
}

function addSkillToUI(skill) {
    const container = document.getElementById('skillsTags');
    if (!container) return;
    
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
        <span>${skill}</span>
        <span class="tag-remove" data-skill="${skill}">&times;</span>
    `;
    
    container.appendChild(tag);
    
    // Add remove functionality
    const removeBtn = tag.querySelector('.tag-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const skillToRemove = e.target.dataset.skill;
            formData.cgSkills = formData.cgSkills.filter(s => s !== skillToRemove);
            updateHiddenInput('cgSkills', formData.cgSkills);
            tag.remove();
        });
    }
}

// Add language functionality
function addLanguage() {
    const input = document.getElementById('languagesInput');
    const language = input.value.trim();
    
    if (language && !formData.cgLanguages.includes(language)) {
        addLanguageToUI(language);
        formData.cgLanguages.push(language);
        updateHiddenInput('cgLanguages', formData.cgLanguages);
        input.value = '';
        input.focus();
    }
}

function addLanguageToUI(language) {
    const container = document.getElementById('languagesTags');
    if (!container) return;
    
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
        <span>${language}</span>
        <span class="tag-remove" data-language="${language}">&times;</span>
    `;
    
    container.appendChild(tag);
    
    // Add remove functionality
    const removeBtn = tag.querySelector('.tag-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const languageToRemove = e.target.dataset.language;
            formData.cgLanguages = formData.cgLanguages.filter(l => l !== languageToRemove);
            updateHiddenInput('cgLanguages', formData.cgLanguages);
            tag.remove();
        });
    }
}

// Update hidden input values
function updateHiddenInput(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = JSON.stringify(value);
    }
}

// Initialize character counter
function initCharacterCounter() {
    const descriptionInput = document.getElementById('cgProfileDescription');
    const charCount = document.getElementById('charCount');
    
    if (descriptionInput && charCount) {
        updateCharacterCount();
    }
}

function updateCharacterCount() {
    const descriptionInput = document.getElementById('cgProfileDescription');
    const charCount = document.getElementById('charCount');
    
    if (descriptionInput && charCount) {
        const count = descriptionInput.value.length;
        charCount.textContent = `${count}/1000`;
        
        if (count > 1000) {
            charCount.classList.add('text-red-400');
        } else {
            charCount.classList.remove('text-red-400');
        }
    }
}

// Initialize availability checkboxes
function initAvailabilityCheckboxes() {
    // Days checkboxes
    document.querySelectorAll('[data-day]').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            this.classList.toggle('checked');
            
            const day = this.dataset.day;
            const index = formData.availabilityDays.indexOf(day);
            
            if (index === -1) {
                formData.availabilityDays.push(day);
            } else {
                formData.availabilityDays.splice(index, 1);
            }
            
            updateHiddenInput('availabilityDays', formData.availabilityDays);
        });
    });
    
    // Timing checkboxes
    document.querySelectorAll('[data-time]').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            this.classList.toggle('checked');
            
            const time = this.dataset.time;
            formData.availabilityTimings[time] = !formData.availabilityTimings[time];
            
            updateHiddenInput('availabilityTimings', formData.availabilityTimings);
        });
    });
}

// Terms Checkbox
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

// Update date constraints
function updateDateConstraints() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    
    const dobInput = document.getElementById('cgDob');
    if (dobInput) {
        dobInput.max = maxDate.toISOString().split('T')[0];
        dobInput.min = minDate.toISOString().split('T')[0];
    }
}

// Helper Functions
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

function highlightError(element) {
    element.classList.add('border-red-500');
    element.classList.remove('border-white/20');
    
    // Remove error highlight after 3 seconds
    setTimeout(() => {
        element.classList.remove('border-red-500');
        element.classList.add('border-white/20');
    }, 3000);
}

function clearErrors(errorIds = []) {
    // If no specific IDs provided, clear all common error elements
    if (errorIds.length === 0) {
        errorIds = ['nameError', 'emailError', 'phoneError', 'dobError', 'pincodeError', 
                   'confirmPasswordError', 'expError', 'specializationError'];
    }
    
    errorIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[+]?[1-9][\d]{9,14}$/.test(phone);
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
window.debugCaregiverSignup = {
    getFormData: () => formData,
    goToStep,
    validateStep1,
    validateStep2,
    validateStep3,
    saveFormData: () => saveFormData()
};