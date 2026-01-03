// ============================================
// Dashboard Debug Version
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Dashboard debug loading...');
    
    // Test cookie authentication
    await testCookieAuth();
    
    // Load user data
    await loadUserData();
});

async function testCookieAuth() {
    console.log('Testing cookie authentication...');
    
    try {
        // Test 1: Check if we can access auth/me
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Cookie test response status:', response.status);
        console.log('Cookie test response headers:', response.headers);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Cookie authentication successful:', data);
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Cookie authentication failed:', errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Cookie test error:', error);
        return false;
    }
}

async function loadUserData() {
    console.log('Loading user data...');
    
    try {
        // First try to get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Profile response status:', profileResponse.status);
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Profile data:', profileData);
            
            // Update UI with profile data
            updateProfileUI(profileData.data);
        } else {
            console.error('❌ Failed to load profile');
        }
        
        // Then try dashboard data
        const dashboardResponse = await fetch(`${API_BASE_URL}/users/dashboard`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Dashboard response status:', dashboardResponse.status);
        
        if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            console.log('✅ Dashboard data:', dashboardData);
        } else {
            const errorText = await dashboardResponse.text();
            console.error('❌ Failed to load dashboard:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Error loading user data:', error);
    }
}

function updateProfileUI(userData) {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const welcomeNameElement = document.getElementById('welcomeName');
    
    if (userNameElement && userData.UName) {
        userNameElement.textContent = userData.UName;
    }
    
    if (userEmailElement && userData.UEmail) {
        userEmailElement.textContent = userData.UEmail;
    }
    
    if (welcomeNameElement && userData.UName) {
        const firstName = userData.UName.split(' ')[0];
        welcomeNameElement.textContent = firstName;
    }
}

// Test cookie access
async function testCookies() {
    console.log('Document cookies:', document.cookie);
    
    // Try to make a simple fetch with credentials
    const testResponse = await fetch(`${API_BASE_URL}/health`, {
        credentials: 'include'
    });
    
    console.log('Health check response:', testResponse.status);
}

// Run tests
testCookies();