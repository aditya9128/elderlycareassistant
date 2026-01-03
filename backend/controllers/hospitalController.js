const axios = require('axios');

class HospitalController {
    
    // Find hospitals near pincode
    async findHospitals(req, res) {
        try {
            const { pincode, limit = 10, radius = 10000 } = req.query;
            
            if (!pincode) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a pincode'
                });
            }
            
            // Validate pincode (6 digits for India)
            if (!/^\d{6}$/.test(pincode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid 6-digit pincode'
                });
            }
            
            // Get coordinates from pincode using Geoapify
            const geoResponse = await axios.get(
                `https://api.geoapify.com/v1/geocode/search?text=${pincode},India&format=json&apiKey=${process.env.GEOAPIFY_API_KEY}`
            );
            
            if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Could not find location for this pincode'
                });
            }
            
            const location = geoResponse.data.results[0];
            const { lat, lon } = location;
            
            // Search for hospitals around coordinates
            const hospitalsResponse = await axios.get(
                `https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${lon},${lat},${radius}&bias=proximity:${lon},${lat}&limit=${limit}&apiKey=${process.env.GEOAPIFY_API_KEY}`
            );
            
            const hospitals = hospitalsResponse.data.features.map(feature => {
                const props = feature.properties;
                return {
                    id: props.place_id,
                    name: props.name || 'Unknown Hospital',
                    address: props.formatted,
                    street: props.street,
                    city: props.city,
                    state: props.state,
                    pincode: props.postcode,
                    phone: props.contact?.phone,
                    website: props.contact?.website,
                    openingHours: props.opening_hours,
                    distance: props.distance ? `${(props.distance / 1000).toFixed(1)} km` : 'Unknown',
                    coordinates: {
                        lat: props.lat,
                        lng: props.lon
                    },
                    types: props.categories,
                    isEmergency: props.categories?.includes('healthcare.emergency'),
                    rating: props.rating,
                    reviews: props.reviews
                };
            });
            
            res.status(200).json({
                success: true,
                count: hospitals.length,
                location: {
                    pincode: pincode,
                    city: location.city,
                    state: location.state,
                    formatted: location.formatted,
                    coordinates: { lat, lon }
                },
                data: hospitals
            });
            
        } catch (error) {
            console.error('Hospital search error:', error.message);
            
            // Return mock data if API fails (for development)
            if (process.env.NODE_ENV === 'development') {
                const mockHospitals = this.getMockHospitals();
                
                return res.status(200).json({
                    success: true,
                    count: mockHospitals.length,
                    location: {
                        pincode: req.query.pincode,
                        city: 'Mock City',
                        state: 'Mock State'
                    },
                    note: 'Using mock data (API failed)',
                    data: mockHospitals
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to search hospitals. Please try again later.'
            });
        }
    }
    
    // Mock hospitals data for development
    getMockHospitals() {
        return [
            {
                id: '1',
                name: 'City General Hospital',
                address: '123 Medical Street, Health City',
                street: 'Medical Street',
                city: 'Health City',
                state: 'Delhi',
                pincode: '110001',
                phone: '+91 11 1234 5678',
                website: 'https://citygeneral.example.com',
                distance: '2.5 km',
                coordinates: { lat: 28.6139, lng: 77.2090 },
                types: ['healthcare.hospital', 'healthcare.emergency'],
                isEmergency: true,
                rating: 4.5,
                reviews: 125
            },
            {
                id: '2',
                name: 'Community Health Center',
                address: '456 Care Avenue, Wellness Town',
                street: 'Care Avenue',
                city: 'Wellness Town',
                state: 'Delhi',
                pincode: '110002',
                phone: '+91 11 9876 5432',
                website: null,
                distance: '4.1 km',
                coordinates: { lat: 28.6200, lng: 77.2150 },
                types: ['healthcare.hospital'],
                isEmergency: true,
                rating: 4.2,
                reviews: 89
            },
            {
                id: '3',
                name: 'Apollo Specialty Hospital',
                address: '789 Healing Road, Medical District',
                street: 'Healing Road',
                city: 'Medical District',
                state: 'Delhi',
                pincode: '110003',
                phone: '+91 11 5555 6666',
                website: 'https://apollo.example.com',
                distance: '5.8 km',
                coordinates: { lat: 28.6300, lng: 77.2200 },
                types: ['healthcare.hospital', 'healthcare.specialty'],
                isEmergency: true,
                rating: 4.7,
                reviews: 342
            }
        ];
    }
    
    // Get emergency hospitals (for emergency panel)
    async getEmergencyHospitals(req, res) {
        try {
            const { lat, lng, limit = 5 } = req.query;
            
            let coordinates;
            if (lat && lng) {
                coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };
            } else {
                // Default to Delhi coordinates
                coordinates = { lat: 28.6139, lng: 77.2090 };
            }
            
            const emergencyHospitals = [
                {
                    id: 'emergency-1',
                    name: 'Emergency Medical Center',
                    address: 'Emergency Lane, Critical Care Zone',
                    phone: '+91 11 9999 8888',
                    distance: '1.2 km',
                    isEmergency: true,
                    services: ['24/7 Emergency', 'Ambulance', 'ICU']
                },
                {
                    id: 'emergency-2',
                    name: 'Trauma Care Hospital',
                    address: 'Trauma Street, Emergency District',
                    phone: '+91 11 7777 6666',
                    distance: '2.8 km',
                    isEmergency: true,
                    services: ['Trauma Care', 'Surgery', 'Emergency ICU']
                }
            ];
            
            res.status(200).json({
                success: true,
                count: emergencyHospitals.length,
                coordinates: coordinates,
                data: emergencyHospitals
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new HospitalController();