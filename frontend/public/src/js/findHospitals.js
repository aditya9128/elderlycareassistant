// hospitalSearch.js - Hospital search functionality for index.html
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 Hospital search initializing...');
    
    // Elements
    const hospitalSearchBtn = document.getElementById('hospitalSearchBtn');
    const pincodeInput = document.getElementById('pincodeInput');
    const hospitalResults = document.getElementById('hospitalResults');
    const pincodeWarning = document.getElementById('pincodeInputWarning');
    const closeBtn = document.getElementById('closeHospitalListBtn');
    
    if (!hospitalSearchBtn || !pincodeInput) {
        console.error('❌ Hospital search elements not found!');
        return;
    }
    
    // Event listeners
    hospitalSearchBtn.addEventListener('click', searchHospitals);
    pincodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchHospitals();
    });
    closeBtn?.addEventListener('click', clearHospitalResults);
    
    console.log('✅ Hospital search initialized');
});

async function searchHospitals() {
    const pincodeInput = document.getElementById('pincodeInput');
    const hospitalResults = document.getElementById('hospitalResults');
    const pincodeWarning = document.getElementById('pincodeInputWarning');
    const closeBtn = document.getElementById('closeHospitalListBtn');
    const hospitalSearchBtn = document.getElementById('hospitalSearchBtn');
    
    const pincode = pincodeInput.value.trim();
    
    // Clear previous results
    hospitalResults.innerHTML = '';
    pincodeWarning.textContent = '';
    closeBtn.style.display = 'none';
    
    // Validate pincode
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pincode)) {
        pincodeWarning.textContent = 'Please enter a valid 6-digit Indian pincode.';
        pincodeInput.focus();
        return;
    }
    
    try {
        // Show loading state
        hospitalSearchBtn.disabled = true;
        hospitalSearchBtn.innerHTML = `
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Searching...
        `;
        
        hospitalResults.innerHTML = `
            <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Searching for hospitals near pincode ${pincode}...</p>
            </div>
        `;
        
        // Call API
        const response = await fetch(`/api/hospitals/nearby?pincode=${pincode}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const hospitals = await response.json();
        
        // Display results
        displayHospitalResults(hospitals);
        
        // Show close button
        closeBtn.style.display = 'inline-block';
        
    } catch (error) {
        console.error('❌ Error searching hospitals:', error);
        showErrorState();
    } finally {
        // Reset button state
        hospitalSearchBtn.disabled = false;
        hospitalSearchBtn.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>Search Hospitals</span>
        `;
    }
}

function displayHospitalResults(hospitals) {
    const hospitalResults = document.getElementById('hospitalResults');
    
    if (!hospitals || hospitals.length === 0) {
        hospitalResults.innerHTML = `
            <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8">
                <i class="fas fa-hospital text-gray-400 text-5xl mb-4"></i>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">No Hospitals Found</h3>
                <p class="text-gray-600">No hospitals found near this pincode. Try a different pincode.</p>
            </div>
        `;
        return;
    }
    
    hospitalResults.innerHTML = hospitals.map(hospital => `
        <div class="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-hard transition-all duration-300 border border-gray-100">
            <div class="p-6">
                <div class="flex items-start mb-4">
                    <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                        <i class="fas fa-hospital text-red-600 text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-900 mb-1">${hospital.name || 'Unnamed Hospital'}</h3>
                        <div class="flex items-center text-gray-600 text-sm mb-2">
                            <i class="fas fa-map-marker-alt mr-2"></i>
                            <span>${hospital.distance || 'Distance not available'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-map text-gray-400 mt-1 mr-3"></i>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Address</p>
                            <p class="text-gray-600 text-sm">${hospital.address || 'Address not available'}</p>
                        </div>
                    </div>
                    
                    ${hospital.phone && hospital.phone !== "Phone not available" ? `
                    <div class="flex items-center">
                        <i class="fas fa-phone text-gray-400 mr-3"></i>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Phone</p>
                            <p class="text-gray-600 text-sm">${hospital.phone}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${hospital.website ? `
                    <div class="flex items-center">
                        <i class="fas fa-globe text-gray-400 mr-3"></i>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Website</p>
                            <a href="${hospital.website}" target="_blank" class="text-primary-600 hover:text-primary-800 text-sm underline">
                                ${hospital.website.replace('https://', '').replace('http://', '')}
                            </a>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="mt-6 pt-4 border-t border-gray-100">
                    <div class="flex space-x-2">
                        <button onclick="getDirections('${hospital.address || ''}')" 
                                class="flex-1 px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-all flex items-center justify-center">
                            <i class="fas fa-directions mr-2"></i>
                            Get Directions
                        </button>
                        ${hospital.phone && hospital.phone !== "Phone not available" ? `
                        <button onclick="callHospital('${hospital.phone}')" 
                                class="px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-all">
                            <i class="fas fa-phone-alt"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function clearHospitalResults() {
    const hospitalResults = document.getElementById('hospitalResults');
    const pincodeInput = document.getElementById('pincodeInput');
    const pincodeWarning = document.getElementById('pincodeInputWarning');
    const closeBtn = document.getElementById('closeHospitalListBtn');
    
    hospitalResults.innerHTML = '';
    pincodeInput.value = '';
    pincodeWarning.textContent = '';
    closeBtn.style.display = 'none';
}

function showErrorState() {
    const hospitalResults = document.getElementById('hospitalResults');
    const closeBtn = document.getElementById('closeHospitalListBtn');
    
    hospitalResults.innerHTML = `
        <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8">
            <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Hospitals</h3>
            <p class="text-gray-600">Failed to fetch hospital data. Please try again.</p>
            <button onclick="searchHospitals()" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <i class="fas fa-redo mr-2"></i>Retry
            </button>
        </div>
    `;
    closeBtn.style.display = 'inline-block';
}

// Helper functions
function getDirections(address) {
    if (address && address !== 'Address not available') {
        const encodedAddress = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    } else {
        alert('Address not available for this hospital.');
    }
}

function callHospital(phoneNumber) {
    if (phoneNumber && phoneNumber !== "Phone not available") {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        window.open(`tel:${cleanPhone}`, '_self');
    } else {
        alert('Phone number not available for this hospital.');
    }
}

// Make functions available globally
window.searchHospitals = searchHospitals;
window.clearHospitalResults = clearHospitalResults;
window.getDirections = getDirections;
window.callHospital = callHospital;

console.log('✅ hospitalSearch.js loaded');