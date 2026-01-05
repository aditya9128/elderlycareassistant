// caregiverSearch.js - Complete code for fetching and displaying caregivers
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('caregiverSearchBtn');
    const caregiverResults = document.getElementById('caregiverResults');
    
    // API Configuration
    const API_BASE_URL = 'http://localhost:5000/api'; // Update with your backend URL
    const CAREGIVERS_ENDPOINT = `${API_BASE_URL}/caregivers`;
    const SEARCH_ENDPOINT = `${API_BASE_URL}/caregivers/search`;
    const TOP_RATED_ENDPOINT = `${API_BASE_URL}/caregivers/top-rated`;
    
    // State variables
    let currentPage = 1;
    const limit = 10;
    let currentSpecialization = '';
    let allCaregivers = [];
    let isLoading = false;
    
    // Common specializations for suggestions
    const COMMON_SPECIALIZATIONS = [
        'Elderly Care',
        'Physiotherapy',
        'Nursing Care',
        'Dementia Care',
        'Post-Surgery Care',
        'Medication Management',
        'Mobility Assistance',
        'Companionship',
        'Meal Preparation',
        'Home Care',
        'Geriatric Care',
        'Memory Care',
        'Stroke Recovery',
        'Diabetes Care',
        'Parkinson Care',
        'Palliative Care',
        'Respite Care',
        'Hospice Care',
        'Physical Therapy'
    ];
    
    // Initialize
    initializeCaregiverSearch();
    
    function initializeCaregiverSearch() {
        // Event listeners
        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearch);
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
            
            // Add input suggestions
            setupSearchSuggestions();
        }
        
        // Load top-rated caregivers initially
        loadTopRatedCaregivers();
    }
    
    function setupSearchSuggestions() {
        // Create suggestion dropdown
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'searchSuggestions';
        suggestionsContainer.className = 'hidden absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-full max-h-60 overflow-y-auto';
        
        if (searchInput && searchInput.parentNode) {
            searchInput.parentNode.style.position = 'relative';
            searchInput.parentNode.appendChild(suggestionsContainer);
            
            searchInput.addEventListener('input', function() {
                const value = this.value.toLowerCase().trim();
                
                if (!value) {
                    suggestionsContainer.classList.add('hidden');
                    return;
                }
                
                // Filter common specializations
                const filtered = COMMON_SPECIALIZATIONS.filter(spec => 
                    spec.toLowerCase().includes(value)
                );
                
                if (filtered.length === 0) {
                    suggestionsContainer.classList.add('hidden');
                    return;
                }
                
                // Show suggestions
                suggestionsContainer.innerHTML = filtered.map(spec => `
                    <div class="suggestion-item px-4 py-3 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors" data-value="${spec}">
                        <div class="flex items-center">
                            <i class="fas fa-search text-primary-400 mr-3 text-sm"></i>
                            <span class="text-gray-700">${spec}</span>
                        </div>
                    </div>
                `).join('');
                
                suggestionsContainer.classList.remove('hidden');
                
                // Add click handlers
                document.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', function() {
                        searchInput.value = this.getAttribute('data-value');
                        suggestionsContainer.classList.add('hidden');
                        handleSearch();
                    });
                });
            });
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', function(e) {
                if (searchInput && suggestionsContainer) {
                    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                        suggestionsContainer.classList.add('hidden');
                    }
                }
            });
        }
    }
    
    async function handleSearch() {
        if (isLoading) return;
        
        const specialization = searchInput.value.trim();
        
        if (!specialization) {
            showError('Please enter a specialization to search');
            return;
        }
        
        currentSpecialization = specialization;
        currentPage = 1;
        
        // Try different search approaches
        await searchCaregivers(specialization);
    }
    
    async function searchCaregivers(specialization) {
        isLoading = true;
        try {
            showLoading();
            
            // Try specialized search endpoint first
            let response = await fetch(`${SEARCH_ENDPOINT}?specialization=${encodeURIComponent(specialization)}`);
            
            if (!response.ok) {
                // If specialized search fails, try general caregivers endpoint with filter
                console.log('Trying general caregivers endpoint...');
                response = await fetch(`${CAREGIVERS_ENDPOINT}?specialization=${encodeURIComponent(specialization)}&limit=100`);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                allCaregivers = result.data || [];
                
                // If no results from direct search, try case-insensitive filter
                if (allCaregivers.length === 0) {
                    console.log('No results from direct search, trying client-side filter...');
                    await fetchAllCaregiversAndFilter(specialization);
                } else {
                    displayCaregivers(allCaregivers.slice(0, limit));
                    
                    // Show login prompt if caregivers found
                    if (allCaregivers.length > 0) {
                        showLoginPrompt();
                    }
                }
            } else {
                throw new Error(result.message || 'Failed to fetch caregivers');
            }
        } catch (error) {
            console.error('Error fetching caregivers:', error);
            showError(`Error: ${error.message}. Please try again.`);
        } finally {
            isLoading = false;
            hideLoading();
        }
    }
    
    async function fetchAllCaregiversAndFilter(specialization) {
        try {
            // Fetch all caregivers and filter client-side
            const response = await fetch(`${CAREGIVERS_ENDPOINT}?limit=200`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Filter caregivers by specialization (case-insensitive, partial match)
                const searchTerm = specialization.toLowerCase();
                allCaregivers = (result.data || []).filter(caregiver => {
                    const specs = caregiver.cgSpecialization;
                    
                    if (!specs) return false;
                    
                    if (Array.isArray(specs)) {
                        return specs.some(spec => 
                            spec && spec.toLowerCase().includes(searchTerm)
                        );
                    } else if (typeof specs === 'string') {
                        return specs.toLowerCase().includes(searchTerm);
                    }
                    return false;
                });
                
                if (allCaregivers.length === 0) {
                    displayNoResults();
                } else {
                    displayCaregivers(allCaregivers.slice(0, limit));
                    
                    if (allCaregivers.length > 0) {
                        showLoginPrompt();
                    }
                }
            }
        } catch (error) {
            console.error('Error in client-side filtering:', error);
            showError(`Error: ${error.message}. Please try again.`);
        }
    }
    
    function displayNoResults() {
        if (!caregiverResults) return;
        
        caregiverResults.innerHTML = `
            <div class="text-center py-12">
                <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user-slash text-gray-400 text-3xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No Caregivers Found</h3>
                <p class="text-gray-600 mb-6">Try a different specialization or check back later.</p>
                <div class="max-w-md mx-auto">
                    <h4 class="font-medium text-gray-700 mb-3">Try these common specializations:</h4>
                    <div class="flex flex-wrap gap-2 justify-center">
                        ${COMMON_SPECIALIZATIONS.slice(0, 8).map(spec => `
                            <button class="specialization-chip px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100 hover:shadow transition-colors font-medium"
                                    data-spec="${spec}">
                                ${spec}
                            </button>
                        `).join('')}
                    </div>
                    <p class="text-sm text-gray-500 mt-4">Or browse our <a href="#" id="showAllCaregivers" class="text-primary-600 hover:underline">top-rated caregivers</a></p>
                </div>
            </div>
        `;
        
        // Add click handlers to chips
        document.querySelectorAll('.specialization-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                searchInput.value = this.getAttribute('data-spec');
                handleSearch();
            });
        });
        
        // Add handler for "show all caregivers"
        const showAllBtn = document.getElementById('showAllCaregivers');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', function(e) {
                e.preventDefault();
                loadTopRatedCaregivers();
                searchInput.value = '';
            });
        }
    }
    
    function displayCaregivers(caregivers) {
        if (!caregiverResults) return;
        
        if (!caregivers || caregivers.length === 0) {
            displayNoResults();
            return;
        }
        
        caregiverResults.innerHTML = `
            <div class="mb-8">
                <h3 class="text-2xl font-bold text-primary-700 mb-2">Caregiver Search Results</h3>
                <p class="text-gray-600">Found ${allCaregivers.length} caregivers ${currentSpecialization ? `for "${currentSpecialization}"` : ''}</p>
                ${allCaregivers.length > limit ? `<p class="text-sm text-gray-500 mt-1">Showing ${Math.min(limit, caregivers.length)} of ${allCaregivers.length} caregivers</p>` : ''}
            </div>
            <div id="caregiverCardsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"></div>
        `;
        
        const cardsContainer = document.getElementById('caregiverCardsContainer');
        
        caregivers.forEach(caregiver => {
            const card = createCaregiverCard(caregiver);
            cardsContainer.appendChild(card);
        });
        
        // Show pagination if there are more caregivers
        if (allCaregivers.length > limit) {
            showPagination();
        }
    }
    
    function createCaregiverCard(caregiver) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-hard transition-all duration-300 hover:-translate-y-1 border border-gray-100';
        
        // Generate initials for profile picture
        let initials = 'CG';
        if (caregiver.cgName) {
            const nameParts = caregiver.cgName.split(' ').filter(part => part.length > 0);
            if (nameParts.length >= 2) {
                initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
            } else if (nameParts.length === 1) {
                initials = nameParts[0].substring(0, 2).toUpperCase();
            }
        }
        
        // Get specializations (handle array)
        let specializations = [];
        if (Array.isArray(caregiver.cgSpecialization)) {
            specializations = caregiver.cgSpecialization.filter(spec => spec && spec.trim());
        } else if (caregiver.cgSpecialization) {
            specializations = [caregiver.cgSpecialization];
        }
        const primarySpecialization = specializations[0] || 'Caregiver';
        
        // Get city and state
        const city = caregiver.cgWorkingCity || 'City not specified';
        const state = caregiver.cgWorkingState || 'State not specified';
        
        // Get rating
        const rating = caregiver.cgRating?.average || 0;
        const totalRatings = caregiver.cgRating?.totalRatings || 0;
        
        // Get hourly rate
        let hourlyRate = 'Not specified';
        if (caregiver.cgCharges) {
            if (typeof caregiver.cgCharges === 'object' && caregiver.cgCharges.hourly !== undefined) {
                hourlyRate = caregiver.cgCharges.hourly;
            } else if (typeof caregiver.cgCharges === 'number') {
                hourlyRate = caregiver.cgCharges;
            }
        }
        
        // Create rating stars
        const stars = generateStarRating(rating);
        
        // Format hourly rate
        const formattedHourlyRate = typeof hourlyRate === 'number' ? `₹${hourlyRate}/hour` : hourlyRate;
        
        card.innerHTML = `
            <div class="p-6 h-full flex flex-col">
                <!-- Profile Header -->
                <div class="flex items-start mb-6">
                    <div class="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center shadow-lg mr-4 flex-shrink-0">
                        <span class="text-white text-2xl font-bold">${initials}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-xl font-bold text-gray-900 mb-1 truncate">${caregiver.cgName || 'Caregiver'}</h3>
                        <p class="text-primary-600 font-medium mb-2 truncate">${primarySpecialization}</p>
                        
                        <!-- Additional specializations -->
                        ${specializations.length > 1 ? `
                            <div class="mb-2">
                                <div class="flex flex-wrap gap-1">
                                    ${specializations.slice(1, 3).map(spec => `
                                        <span class="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-full whitespace-nowrap">
                                            ${spec}
                                        </span>
                                    `).join('')}
                                    ${specializations.length > 3 ? `
                                        <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            +${specializations.length - 3} more
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="flex items-center">
                            ${stars}
                            <span class="ml-2 text-sm font-semibold">${rating.toFixed(1)}</span>
                            <span class="ml-1 text-sm text-gray-500">(${totalRatings})</span>
                        </div>
                    </div>
                </div>
                
                <!-- Details -->
                <div class="space-y-4 mb-6 flex-1">
                    <!-- Location -->
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <i class="fas fa-map-marker-alt text-primary-600 text-sm"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm text-gray-600">Location</p>
                            <p class="font-medium truncate">${city}, ${state}</p>
                        </div>
                    </div>
                    
                    <!-- Hourly Rate -->
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <i class="fas fa-rupee-sign text-green-600 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Hourly Rate</p>
                            <p class="font-medium">${formattedHourlyRate}</p>
                        </div>
                    </div>
                    
                    <!-- Experience (if available) -->
                    ${caregiver.cgExpYears ? `
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <i class="fas fa-briefcase text-orange-600 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Experience</p>
                            <p class="font-medium">${caregiver.cgExpYears} ${caregiver.cgExpYears === 1 ? 'year' : 'years'}</p>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Action Button -->
                <button class="view-profile-btn w-full py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:from-primary-600 hover:to-primary-800 mt-auto"
                        data-caregiver-id="${caregiver._id}">
                    <i class="fas fa-eye mr-2"></i> View Full Profile
                </button>
            </div>
        `;
        
        // Add event listener to view profile button
        const viewProfileBtn = card.querySelector('.view-profile-btn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', function() {
                showLoginAlert();
            });
        }
        
        return card;
    }
    
    function generateStarRating(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star text-yellow-400"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
        }
        
        // Empty stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star text-yellow-400"></i>';
        }
        
        return stars;
    }
    
    function showPagination() {
        const totalPages = Math.ceil(allCaregivers.length / limit);
        
        if (totalPages <= 1) return;
        
        const paginationHtml = `
            <div class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-8 pt-6 border-t border-gray-200">
                <div class="text-sm text-gray-600">
                    Showing ${((currentPage - 1) * limit) + 1} to ${Math.min(currentPage * limit, allCaregivers.length)} of ${allCaregivers.length} caregivers
                </div>
                
                <div class="flex items-center space-x-2">
                    <button id="prevPageBtn" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            ${currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left mr-2 text-sm"></i> Previous
                    </button>
                    
                    <div class="flex items-center space-x-1">
                        ${Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            
                            return `
                                <button class="page-btn w-10 h-10 rounded-lg ${currentPage === pageNum ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                        data-page="${pageNum}">
                                    ${pageNum}
                                </button>
                            `;
                        }).join('')}
                        
                        ${totalPages > 5 ? `
                            <span class="px-2 text-gray-500">...</span>
                            <button class="page-btn w-10 h-10 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    data-page="${totalPages}">
                                ${totalPages}
                            </button>
                        ` : ''}
                    </div>
                    
                    <button id="nextPageBtn" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            ${currentPage === totalPages ? 'disabled' : ''}>
                        Next <i class="fas fa-chevron-right ml-2 text-sm"></i>
                    </button>
                </div>
            </div>
        `;
        
        caregiverResults.insertAdjacentHTML('beforeend', paginationHtml);
        
        // Add event listeners for pagination
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const page = parseInt(this.getAttribute('data-page'));
                goToPage(page);
            });
        });
        
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    goToPage(currentPage - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (currentPage < totalPages) {
                    goToPage(currentPage + 1);
                }
            });
        }
    }
    
    function goToPage(page) {
        currentPage = page;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const caregiversToShow = allCaregivers.slice(startIndex, endIndex);
        
        const cardsContainer = document.getElementById('caregiverCardsContainer');
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
            caregiversToShow.forEach(caregiver => {
                const card = createCaregiverCard(caregiver);
                cardsContainer.appendChild(card);
            });
        }
        
        // Update pagination UI
        updatePaginationUI();
        
        // Scroll to top of results
        if (caregiverResults) {
            caregiverResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function updatePaginationUI() {
        const pageBtns = document.querySelectorAll('.page-btn');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const totalPages = Math.ceil(allCaregivers.length / limit);
        
        pageBtns.forEach(btn => {
            const pageNum = parseInt(btn.getAttribute('data-page'));
            btn.className = `page-btn w-10 h-10 rounded-lg ${currentPage === pageNum ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        });
        
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
            prevBtn.className = `px-4 py-2 rounded-lg transition-all flex items-center ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.className = `px-4 py-2 rounded-lg transition-all flex items-center ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        }
        
        // Update page info
        const pageInfo = document.querySelector('.text-sm.text-gray-600');
        if (pageInfo) {
            pageInfo.textContent = `Showing ${((currentPage - 1) * limit) + 1} to ${Math.min(currentPage * limit, allCaregivers.length)} of ${allCaregivers.length} caregivers`;
        }
    }
    
    function showLoginPrompt() {
        // Check if login prompt already exists
        if (document.getElementById('loginPrompt')) return;
        
        const loginPromptHtml = `
            <div id="loginPrompt" class="mt-10 pt-8 border-t border-gray-200 animate-fade-in">
                <div class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 text-center border border-primary-100">
                    <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-lock text-white text-3xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-primary-700 mb-3">Login to View Full Profiles & Book Caregivers</h3>
                    <p class="text-gray-600 mb-6 max-w-2xl mx-auto">
                        To view complete caregiver profiles, contact information, schedule appointments, and access all booking features, please login to your account.
                    </p>
                    <div class="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="login.html" 
                           class="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-3 no-underline">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Login to Your Account</span>
                        </a>
                        <a href="signup.html" 
                           class="px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-xl border-2 border-primary-600 hover:bg-primary-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-3 no-underline">
                            <i class="fas fa-user-plus"></i>
                            <span>Create New Account</span>
                        </a>
                    </div>
                    <p class="text-sm text-gray-500 mt-6">
                        Don't have an account? Sign up now to access all caregiver features and book appointments!
                    </p>
                </div>
            </div>
        `;
        
        caregiverResults.insertAdjacentHTML('beforeend', loginPromptHtml);
    }
    
    function showLoginAlert() {
        // Create a modal alert
        const modalHtml = `
            <div id="loginAlertModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div class="bg-white rounded-2xl max-w-md w-full p-8 animate-slide-up">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                            <i class="fas fa-lock text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                        <p class="text-gray-600 mb-6">
                            Please login to view complete caregiver profiles, contact details, and book appointments.
                        </p>
                    </div>
                    <div class="space-y-4">
                        <a href="login.html" 
                           class="block w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 text-center no-underline">
                            <i class="fas fa-sign-in-alt mr-2"></i> Go to Login Page
                        </a>
                        <button id="closeLoginAlert" 
                                class="block w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('loginAlertModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add event listener to close button
        const closeBtn = document.getElementById('closeLoginAlert');
        const modal = document.getElementById('loginAlertModal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.remove();
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal) {
                modal.remove();
            }
        });
    }
    
    function showLoading() {
        if (!caregiverResults) return;
        
        caregiverResults.innerHTML = `
            <div class="text-center py-16">
                <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-6"></div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Searching Caregivers...</h3>
                <p class="text-gray-600">Please wait while we find the best caregivers for you.</p>
            </div>
        `;
        
        // Disable search button during loading
        if (searchBtn) {
            searchBtn.disabled = true;
            searchBtn.classList.add('opacity-70', 'cursor-not-allowed');
        }
    }
    
    function hideLoading() {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    }
    
    function showError(message) {
        if (!caregiverResults) return;
        
        caregiverResults.innerHTML = `
            <div class="text-center py-12">
                <div class="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Search Failed</h3>
                <p class="text-gray-600 mb-6">${message}</p>
                <button onclick="location.reload()" 
                        class="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-300">
                    Try Again
                </button>
            </div>
        `;
    }
    
    async function loadTopRatedCaregivers() {
        try {
            showLoading();
            
            const response = await fetch(TOP_RATED_ENDPOINT);
            
            if (!response.ok) {
                // If top-rated endpoint doesn't exist, try regular endpoint
                const altResponse = await fetch(`${CAREGIVERS_ENDPOINT}?limit=${limit}`);
                if (!altResponse.ok) {
                    throw new Error('Failed to fetch caregivers');
                }
                
                const altResult = await altResponse.json();
                if (altResult.success) {
                    allCaregivers = altResult.data || [];
                    currentSpecialization = '';
                    displayCaregivers(allCaregivers);
                    showLoginPrompt();
                }
                return;
            }
            
            const result = await response.json();
            if (result.success) {
                allCaregivers = result.data || [];
                currentSpecialization = '';
                displayCaregivers(allCaregivers.slice(0, limit));
                showLoginPrompt();
            }
        } catch (error) {
            console.error('Error loading top-rated caregivers:', error);
            // Don't show error on initial load - just leave the area empty
            if (caregiverResults) {
                caregiverResults.innerHTML = `
                    <div class="text-center py-12">
                        <p class="text-gray-500 mb-4">Search for caregivers by entering a specialization above.</p>
                        <div class="inline-flex flex-wrap gap-2 justify-center">
                            ${COMMON_SPECIALIZATIONS.slice(0, 4).map(spec => `
                                <button class="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
                                        onclick="document.getElementById('searchInput').value='${spec}'; document.getElementById('caregiverSearchBtn').click();">
                                    ${spec}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        } finally {
            hideLoading();
        }
    }
    
    // Make functions available globally if needed
    window.caregiverSearch = {
        search: handleSearch,
        showLoginAlert: showLoginAlert,
        loadTopRated: loadTopRatedCaregivers
    };
});