// find-caregivers.js - Complete Caregiver Search & Booking System (Updated)

// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api'
    : 'https://elderlycare-backend-f853.onrender.com/api';

// Global state
let currentUser = null;
let currentCaregivers = [];
let currentPage = 1;
let totalPages = 1;
let selectedCaregiver = null;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔍 Caregiver search initializing...');
    
    try {
        await checkUserAuth();
        initEventListeners();
        setupModalListeners();
        
        // Set minimum date to today for modal forms
        const today = new Date().toISOString().split('T')[0];
        const modalStartDate = document.getElementById('startDate');
        const modalEndDate = document.getElementById('endDate');
        
        if (modalStartDate) modalStartDate.min = today;
        if (modalEndDate) modalEndDate.min = today;
        
        // Show initial state instead of loading caregivers automatically
        showInitialState();
        
        console.log('✅ Caregiver search initialized');
    } catch (error) {
        console.error('❌ Error initializing:', error);
        showNotification('Please login to search caregivers', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
});

// Setup modal event listeners
function setupModalListeners() {
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.id === 'caregiverProfileModal' || e.target.id === 'bookingConfirmationModal') {
            hideModal(e.target.id);
        }
    });
    
    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = ['caregiverProfileModal', 'bookingConfirmationModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    hideModal(modalId);
                }
            });
        }
    });
    
    // Confirmation modal buttons
    const confirmationCloseBtn = document.getElementById('confirmationCloseBtn');
    const confirmationViewRequestsBtn = document.getElementById('confirmationViewRequestsBtn');
    
    if (confirmationCloseBtn) {
        confirmationCloseBtn.addEventListener('click', () => {
            hideModal('bookingConfirmationModal');
        });
    }
    
    if (confirmationViewRequestsBtn) {
        confirmationViewRequestsBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html#bookings';
        });
    }
    
    // Setup booking form in modal
    setupBookingForm();
}

// Setup booking form event listeners
function setupBookingForm() {
    const bookingForm = document.getElementById('bookingRequestForm');
    if (!bookingForm) return;
    
    // Form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitBookingRequest();
    });
    
    // Auto-calculate end date
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', (e) => {
            const startDate = e.target.value;
            if (startDate && !endDateInput.value) {
                // Set end date to 7 days from start date
                const start = new Date(startDate);
                start.setDate(start.getDate() + 7);
                endDateInput.value = start.toISOString().split('T')[0];
            }
        });
    }
}

// Add this function
function showInitialState() {
    const caregiversGrid = document.getElementById('caregiversGrid');
    if (caregiversGrid) {
        caregiversGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <i class="fas fa-search text-5xl mb-4 opacity-30"></i>
                <h3 class="text-lg font-medium mb-2">Search for Caregivers</h3>
                <p>Use the filters above to find available caregivers in your area</p>
                <div class="mt-6">
                    <button id="browseAllBtn" class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all">
                        <i class="fas fa-search mr-2"></i>
                        Browse All Caregivers
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener to browse all button
        const browseAllBtn = document.getElementById('browseAllBtn');
        if (browseAllBtn) {
            browseAllBtn.addEventListener('click', () => {
                loadCaregivers(1);
            });
        }
    }
    updateResultsCount(0);
}

// Authentication check
async function checkUserAuth() {
    try {
        console.log("🔐 Checking user authentication...")
        
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Auth response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Auth response data:', data);
        
        if (!data.isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        if (data.user?.role !== 'user') {
            throw new Error('Access denied. User role required.');
        }
        
        currentUser = data.user;
        console.log('✅ User authenticated:', currentUser.UName || currentUser.name || 'User');
        
        return true;
        
    } catch (error) {
        console.error('❌ Auth check failed:', error.message);
        showNotification('Please login to continue', 'error');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
        return false;
    }
}

// Load caregivers with filters
async function loadCaregivers(page = 1) {
    try {
        console.log('🔍 Loading caregivers, page:', page);
        
        // Show loading state
        const loadingState = document.getElementById('loadingState');
        const caregiversGrid = document.getElementById('caregiversGrid');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (caregiversGrid) caregiversGrid.classList.add('hidden');
        
        // Build query params
        const params = new URLSearchParams({
            page: page,
            limit: 9,
            sortBy: document.getElementById('sortBy')?.value || 'rating'
        });
        
        // Add filters
        const specialization = document.getElementById('specializationFilter')?.value;
        const city = document.getElementById('cityFilter')?.value?.trim();
        const minExperience = document.getElementById('experienceFilter')?.value;
        const maxRate = document.getElementById('rateFilter')?.value;
        
        if (specialization) params.append('specialization', specialization);
        if (city) params.append('city', city);
        if (minExperience && minExperience !== '0') params.append('minExperience', minExperience);
        if (maxRate) params.append('maxRate', maxRate);
        
        console.log('API Request:', `${API_BASE_URL}/caregivers?${params.toString()}`);
        
        const response = await fetch(`${API_BASE_URL}/caregivers?${params.toString()}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to load caregivers: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            currentCaregivers = data.data || [];
            currentPage = data.page || 1;
            totalPages = data.pages || 1;
            
            updateCaregiversGrid();
            updatePagination();
            updateResultsCount(data.count || 0);
            
            if (currentCaregivers.length === 0) {
                showNotification('No caregivers found with current filters. Try different search criteria.', 'info');
            }
        } else {
            console.error('Failed to load caregivers:', data.message);
            showNotification(data.message || 'Failed to load caregivers', 'error');
        }
        
    } catch (error) {
        console.error('Error loading caregivers:', error);
        showNotification('Error loading caregivers. Please try again.', 'error');
    } finally {
        const loadingState = document.getElementById('loadingState');
        const caregiversGrid = document.getElementById('caregiversGrid');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (caregiversGrid) caregiversGrid.classList.remove('hidden');
    }
}

// Update caregivers grid UI
function updateCaregiversGrid() {
    const caregiversGrid = document.getElementById('caregiversGrid');
    if (!caregiversGrid) return;
    
    if (currentCaregivers.length === 0) {
        caregiversGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <i class="fas fa-user-nurse text-5xl mb-4 opacity-30"></i>
                <h3 class="text-lg font-medium mb-2">No caregivers found</h3>
                <p>Try adjusting your filters or search in a different city</p>
                <button id="testAPIBtn" class="mt-4 text-primary-600 hover:text-primary-800 text-sm">
                    <i class="fas fa-bug mr-1"></i> Test API Connection
                </button>
            </div>
        `;
        
        // Add event listener to test API button
        const testAPIBtn = document.getElementById('testAPIBtn');
        if (testAPIBtn) {
            testAPIBtn.addEventListener('click', testCaregiverAPI);
        }
        
        return;
    }
    
    caregiversGrid.innerHTML = currentCaregivers.map(caregiver => `
        <div class="bg-white border border-gray-200 rounded-2xl p-6 hover-lift transition-all hover:shadow-md">
            <div class="flex items-start space-x-4 mb-4">
                <img src="${getProfileImageUrl(caregiver.cgProfileImage)}" 
                     alt="${caregiver.cgName}"
                     class="w-16 h-16 rounded-full border-2 border-primary-100 object-cover">
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-bold text-gray-800">${caregiver.cgName || 'Caregiver'}</h3>
                            <p class="text-primary-600 text-sm font-medium">
                                ${getSpecializationText(caregiver.cgSpecialization)}
                            </p>
                        </div>
                        <span class="status-dot ${caregiver.isBusy ? 'status-busy' : 'status-available'}"></span>
                    </div>
                    
                    <div class="flex items-center mt-2">
                        <div class="flex text-yellow-400 text-sm">
                            ${generateStars(caregiver.cgRating?.average || 0)}
                        </div>
                        <span class="ml-2 text-gray-600 text-sm">
                            ${(caregiver.cgRating?.average || 0).toFixed(1)} (${caregiver.cgRating?.totalRatings || 0} reviews)
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="space-y-3 mb-6">
                <div class="flex items-center text-gray-600">
                    <i class="fas fa-briefcase text-gray-400 mr-3"></i>
                    <span class="text-sm">${caregiver.cgExpYears || 0} years experience</span>
                </div>
                
                <div class="flex items-center text-gray-600">
                    <i class="fas fa-map-marker-alt text-gray-400 mr-3"></i>
                    <span class="text-sm">${caregiver.cgWorkingCity || 'Location not specified'}</span>
                </div>
                
                <div class="flex items-center text-gray-600">
                    <i class="fas fa-rupee-sign text-gray-400 mr-3"></i>
                    <span class="text-sm">₹${caregiver.cgCharges?.hourly || 'N/A'}/hour</span>
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <button data-caregiver-id="${caregiver._id}" 
                        class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all view-profile-btn">
                    View Profile & Book
                </button>
            </div>
        </div>
    `).join('');
    
    // Attach event listeners to view profile buttons
    attachCardEventListeners();
}

function attachCardEventListeners() {
    // Remove any existing listeners first
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.removeEventListener('click', handleViewProfileClick);
    });
    
    // Add new listeners
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', handleViewProfileClick);
    });
}

function handleViewProfileClick(e) {
    const caregiverId = e.currentTarget.getAttribute('data-caregiver-id');
    if (caregiverId) {
        viewCaregiverProfile(caregiverId);
    }
}

// Update pagination UI
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (!pagination || !pageNumbers) return;
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }
    
    pagination.classList.remove('hidden');
    
    // Update button states
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    
    // Generate page numbers
    pageNumbers.innerHTML = '';
    
    // Show first page if not current
    if (currentPage > 2) {
        addPageNumber(1);
        if (currentPage > 3) {
            pageNumbers.innerHTML += '<span class="px-3 py-2">...</span>';
        }
    }
    
    // Show pages around current
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        addPageNumber(i);
    }
    
    // Show last page if not shown
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            pageNumbers.innerHTML += '<span class="px-3 py-2">...</span>';
        }
        addPageNumber(totalPages);
    }
}

function addPageNumber(page) {
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;
    
    const button = document.createElement('button');
    button.className = `px-3 py-2 border rounded-lg ${currentPage === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`;
    button.textContent = page;
    button.addEventListener('click', () => loadCaregivers(page));
    pageNumbers.appendChild(button);
}

// Update results count
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `(${count} found)`;
    }
}

// Initialize event listeners
function initEventListeners() {
    console.log('🎮 Initializing event listeners...');
    
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        console.log('✓ Found search button');
        searchBtn.addEventListener('click', (e) => {
            console.log('🔍 Search button clicked');
            e.preventDefault();
            loadCaregivers(1);
        });
    } else {
        console.error('❌ Search button not found! Check HTML id="searchBtn"');
    }
    
    // Clear filters
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('specializationFilter').value = '';
            document.getElementById('cityFilter').value = '';
            document.getElementById('experienceFilter').value = '0';
            document.getElementById('rateFilter').value = '';
            loadCaregivers(1);
        });
    }
    
    // Sort by change
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            loadCaregivers(1);
        });
    }
    
    // Enter key in filters
    document.querySelectorAll('#cityFilter, #rateFilter').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadCaregivers(1);
            }
        });
    });
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                loadCaregivers(currentPage - 1);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                loadCaregivers(currentPage + 1);
            }
        });
    }
    
    // View bookings button
    const viewBookingsBtn = document.getElementById('viewBookingsBtn');
    if (viewBookingsBtn) {
        viewBookingsBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html#bookings';
        });
    }
    
    // Back button
    const backBtn = document.querySelector('button[onclick="goBack()"]');
    if (backBtn) {
        backBtn.removeAttribute('onclick');
        backBtn.addEventListener('click', goBack);
    }
    
    console.log('✅ Event listeners initialized');
}

// Test API connection
async function testCaregiverAPI() {
    try {
        console.log('🧪 Testing caregiver API...');
        const response = await fetch(`${API_BASE_URL}/caregivers?limit=3`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        console.log('Test API Response:', data);
        
        if (data.success) {
            showNotification(`API Connected. Found ${data.count} caregivers in database.`, 'success');
        } else {
            showNotification('API Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('API Test Failed:', error);
        showNotification('API Connection Failed: ' + error.message, 'error');
    }
}

// View caregiver profile
async function viewCaregiverProfile(caregiverId) {
    try {
        console.log('👤 Viewing caregiver profile:', caregiverId);
        
        // Show loading state in modal
        showModalLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/caregivers/${caregiverId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            selectedCaregiver = data.data;
            showModalLoading(false);
            populateCaregiverModal();
            showModal('caregiverProfileModal');
        } else {
            showNotification(data.message || 'Failed to load caregiver profile', 'error');
            showModalLoading(false);
        }
    } catch (error) {
        console.error('Error loading caregiver profile:', error);
        showNotification('Error loading caregiver profile', 'error');
        showModalLoading(false);
    }
}

// Show/hide modal loading state
function showModalLoading(show) {
    const modalContent = document.querySelector('#caregiverProfileModal .max-w-4xl');
    if (!modalContent) return;
    
    if (show) {
        // Add a simple loading indicator
        modalContent.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <span class="ml-3 text-gray-600">Loading caregiver details...</span>
            </div>
        `;
    }
}

// Show caregiver profile modal with enhanced content
function populateCaregiverModal() {
    if (!selectedCaregiver) return;
    
    const modalContent = document.querySelector('#caregiverProfileModal .max-w-4xl');
    if (!modalContent) return;
    
    // Get availability days
    const availabilityDays = selectedCaregiver.availabilityDays || [];
    const daysHtml = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        .map(day => `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">${day}</span>`)
        .join('');
    
    // Get skills
    const skills = selectedCaregiver.cgSkills || [];
    const skillsHtml = skills.map(skill => `<span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">${skill}</span>`).join('');
    
    // Get languages
    const languages = selectedCaregiver.cgLanguages || [];
    const languagesHtml = languages.map(lang => `<span class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">${lang}</span>`).join('');
    
    // Calculate rates
    const hourlyRate = selectedCaregiver.cgCharges?.hourly || 0;
    const dailyRate = hourlyRate * 8;
    const weeklyRate = hourlyRate * 8 * 6;
    const monthlyRate = hourlyRate * 8 * 26;
    
    modalContent.innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div class="flex items-center space-x-4">
                <img id="modalProfileImage" 
                     src="${getProfileImageUrl(selectedCaregiver.cgProfileImage)}" 
                     alt="Caregiver"
                     class="w-20 h-20 rounded-full border-4 border-primary-100">
                <div>
                    <h3 id="modalCaregiverName" class="text-2xl font-bold text-gray-800">${selectedCaregiver.cgName || 'Caregiver'}</h3>
                    <p id="modalCaregiverSpecialization" class="text-primary-600 font-medium">${getSpecializationText(selectedCaregiver.cgSpecialization)}</p>
                    <div class="flex items-center mt-2">
                        <div class="flex text-yellow-400">
                            ${generateStars(selectedCaregiver.cgRating?.average || 0)}
                        </div>
                        <span id="modalRating" class="ml-2 text-gray-600">${(selectedCaregiver.cgRating?.average || 0).toFixed(1)} (${selectedCaregiver.cgRating?.totalRatings || 0} reviews)</span>
                    </div>
                </div>
            </div>
            <button data-modal-close="caregiverProfileModal" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-2xl"></i>
            </button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column -->
            <div class="lg:col-span-2 space-y-6">
                <!-- About Section -->
                <div>
                    <h4 class="text-lg font-bold text-gray-800 mb-3">About</h4>
                    <p id="modalAbout" class="text-gray-700">${selectedCaregiver.cgProfileDescription || 'No description provided.'}</p>
                </div>
                
                <!-- Experience & Skills -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-lg font-bold text-gray-800 mb-3">Experience</h4>
                        <div class="space-y-3">
                            <div class="flex items-center">
                                <i class="fas fa-briefcase text-primary-600 mr-3"></i>
                                <div>
                                    <p class="font-medium" id="modalExperience">${selectedCaregiver.cgExpYears || 0} Years Experience</p>
                                    <p class="text-gray-600 text-sm" id="modalJobType">${selectedCaregiver.jobType || 'Full-time Professional'}</p>
                                </div>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-map-marker-alt text-primary-600 mr-3"></i>
                                <div>
                                    <p class="font-medium" id="modalLocation">${selectedCaregiver.cgWorkingCity || ''}, ${selectedCaregiver.cgWorkingState || ''}</p>
                                    <p class="text-gray-600 text-sm">Serving Area</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="text-lg font-bold text-gray-800 mb-3">Languages</h4>
                        <div id="modalLanguages" class="flex flex-wrap gap-2">
                            ${languagesHtml || '<span class="text-gray-500 text-sm">No languages specified</span>'}
                        </div>
                    </div>
                </div>
                
                <!-- Skills -->
                <div>
                    <h4 class="text-lg font-bold text-gray-800 mb-3">Skills</h4>
                    <div id="modalSkills" class="flex flex-wrap gap-2">
                        ${skillsHtml || '<span class="text-gray-500 text-sm">No skills specified</span>'}
                    </div>
                </div>
                
                <!-- Availability -->
                <div>
                    <h4 class="text-lg font-bold text-gray-800 mb-3">Availability</h4>
                    <div class="flex flex-wrap gap-2 mb-2">
                        ${daysHtml}
                    </div>
                    <p class="text-gray-600 text-sm">
                        ${selectedCaregiver.isBusy ? 'Currently busy' : 'Available for new bookings'}
                    </p>
                </div>
            </div>
            
            <!-- Right Column - Booking Form -->
            <div class="space-y-6">
                <!-- Pricing -->
                <div class="bg-primary-50 border border-primary-200 rounded-2xl p-6">
                    <h4 class="text-lg font-bold text-gray-800 mb-4">Pricing</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Hourly Rate</span>
                            <span id="modalHourlyRate" class="text-2xl font-bold text-primary-600">₹${hourlyRate}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Daily (8 hours)</span>
                            <span id="modalDailyRate" class="text-lg font-semibold text-gray-700">₹${dailyRate.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Weekly (6 days)</span>
                            <span id="modalWeeklyRate" class="text-lg font-semibold text-gray-700">₹${weeklyRate.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Monthly (26 days)</span>
                            <span id="modalMonthlyRate" class="text-lg font-semibold text-gray-700">₹${monthlyRate.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Booking -->
                <div class="border border-gray-200 rounded-2xl p-6">
                    <h4 class="text-lg font-bold text-gray-800 mb-4">Send Booking Request</h4>
                    <form id="bookingRequestForm" class="space-y-4">
                        <div>
                            <label class="block text-gray-700 mb-2">Elder Name *</label>
                            <input type="text" 
                                   id="elderName"
                                   required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                                   placeholder="Enter elder's full name">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-700 mb-2">Elder Age *</label>
                                <input type="number" 
                                       id="elderAge"
                                       min="1" max="120"
                                       required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                                       placeholder="Age">
                            </div>
                            <div>
                                <label class="block text-gray-700 mb-2">Gender *</label>
                                <select id="elderGender" required class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 mb-2">Care Type *</label>
                            <select id="careType" required class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                                <option value="">Select Care Type</option>
                                <option value="Hourly Care">Hourly Care</option>
                                <option value="Daily Care">Daily Care</option>
                                <option value="Overnight Care">Overnight Care</option>
                                <option value="24/7 Live-in Care">24/7 Live-in Care</option>
                                <option value="Respite Care">Respite Care</option>
                            </select>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-700 mb-2">Start Date *</label>
                                <input type="date" 
                                       id="startDate"
                                       required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                            </div>
                            <div>
                                <label class="block text-gray-700 mb-2">End Date *</label>
                                <input type="date" 
                                       id="endDate"
                                       required
                                       class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 mb-2">Additional Message (Optional)</label>
                            <textarea id="bookingMessage" 
                                      rows="3"
                                      placeholder="Any special requirements or notes..."
                                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"></textarea>
                        </div>
                        
                        <button type="submit" 
                                class="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all flex items-center justify-center">
                            <i class="fas fa-paper-plane mr-2"></i>
                            Send Booking Request
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Re-attach form event listener
    const bookingForm = document.getElementById('bookingRequestForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitBookingRequest();
        });
    }
    
    // Re-attach modal close button
    const closeBtn = modalContent.querySelector('[data-modal-close="caregiverProfileModal"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideModal('caregiverProfileModal');
        });
    }
    
    // Set today's date in form
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) startDateInput.min = today;
    if (endDateInput) endDateInput.min = today;
    
    if (startDateInput && !startDateInput.value) {
        startDateInput.value = today;
    }
    
    if (endDateInput && !endDateInput.value) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        endDateInput.value = endDate.toISOString().split('T')[0];
    }
}

// Submit booking request
async function submitBookingRequest() {
    try {
        // Validate form
        const elderName = document.getElementById('elderName').value;
        const elderAge = document.getElementById('elderAge').value;
        const elderGender = document.getElementById('elderGender').value;
        const careType = document.getElementById('careType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!elderName || !elderAge || !elderGender || !careType || !startDate || !endDate) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        const bookingData = {
            caregiverId: selectedCaregiver._id,
            serviceType: careType,
            startDate: startDate,
            endDate: endDate,
            elderName: elderName,
            elderAge: parseInt(elderAge),
            elderGender: elderGender,
            notes: document.getElementById('bookingMessage').value,
            duration: calculateDuration(startDate, endDate)
        };
        
        console.log('Submitting booking:', bookingData);
        
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(bookingData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            hideModal('caregiverProfileModal');
            
            // Update confirmation modal
            document.getElementById('confirmationCaregiver').textContent = selectedCaregiver.cgName;
            document.getElementById('confirmationRequestId').textContent = data.data._id || data.data.bookingId;
            
            showModal('bookingConfirmationModal');
        } else {
            showNotification(data.message || 'Failed to submit booking request', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting booking:', error);
        showNotification('Error submitting booking request', 'error');
    }
}

// Helper function to calculate duration in days
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive of both dates
}

// Helper functions
function getProfileImageUrl(imageName) {
    if (!imageName || imageName === 'default-caregiver.png') {
        return './images/default-caregiver.png';
    }
    return `/uploads/caregivers/${imageName}`;
}

function getSpecializationText(specialization) {
    if (Array.isArray(specialization)) {
        return specialization.join(', ') || 'General Care';
    }
    return specialization || 'General Care';
}

function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg animate-slide-in-right ${
        type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
        type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' :
        type === 'warning' ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500' :
        'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-3"></i>
            <p class="font-medium">${message}</p>
            <button class="ml-4 text-gray-500 hover:text-gray-700 close-notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
    }
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function goBack() {
    window.history.back();
}

// Make functions available globally (only essential ones)
window.loadCaregivers = loadCaregivers;
window.testCaregiverAPI = testCaregiverAPI;
window.goBack = goBack;

console.log('✅ find-caregivers.js loaded');