// hospitalController.js - Updated to match your code structure
exports.getNearbyHospitals = async (req, res) => {
    const { pincode } = req.query;
    const apiKey = process.env.GEOAPIFY_API_KEY || '883fabe2354f43679ad05363a26aceed';

    if (!pincode) {
        return res.status(400).json({ error: "Pincode is required" });
    }

    // Validate pincode
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pincode)) {
        return res.status(400).json({ error: "Please enter a valid 6-digit Indian pincode" });
    }
    
    try {
        console.log("Searching hospitals for pincode:", pincode);

        // If no API key, return mock data
        if (!apiKey) {
            console.warn('⚠️ GEOAPIFY_API_KEY not set. Using mock data.');
            return res.json(getMockHospitals());
        }

        // Get coordinates from pincode
        const geoRes = await fetch(`https://api.geoapify.com/v1/geocode/search?postcode=${pincode}&country=IN&apiKey=${apiKey}`);
        const geoData = await geoRes.json();

        console.log('Geo API Response:', geoData);

        if (!geoData.features || geoData.features.length === 0) {
            return res.json([]);
        }

        const { lat, lon } = geoData.features[0].properties;

        // Search for hospitals
        const hospitalRes = await fetch(`https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${lon},${lat},10000&limit=10&apiKey=${apiKey}`);
        const hospitalData = await hospitalRes.json();

        console.log('Hospital API Response:', hospitalData);

        const hospitals = hospitalData.features.map(feature => ({
            name: feature.properties.name || "Unnamed Hospital",
            address: feature.properties.formatted || "Address not available",
            distance: feature.properties.distance ? `${(feature.properties.distance / 1000).toFixed(1)} km` : "Distance not available",
            phone: feature.properties.contact?.phone || "Phone not available",
            website: feature.properties.contact?.website || null
        }));

        res.json(hospitals);
        
    } catch (error) {
        console.error("❌ Error fetching hospitals:", error);
        
        // Return mock data on error
        return res.json(getMockHospitals());
    }
};

// Mock hospitals data
function getMockHospitals() {
    console.log('📋 Using mock hospital data');
    return [
        {
            name: 'City General Hospital',
            address: '123 Medical Street, Health City, Delhi 110001',
            distance: '2.5 km',
            phone: '+91 11 1234 5678',
            website: 'https://citygeneral.example.com'
        },
        {
            name: 'Community Health Center',
            address: '456 Care Avenue, Wellness Town, Delhi 110002',
            distance: '4.1 km',
            phone: '+91 11 9876 5432',
            website: null
        },
        {
            name: 'Apollo Specialty Hospital',
            address: '789 Healing Road, Medical District, Delhi 110003',
            distance: '5.8 km',
            phone: '+91 11 5555 6666',
            website: 'https://apollo.example.com'
        },
        {
            name: 'Emergency Medical Center',
            address: 'Emergency Lane, Critical Care Zone, Delhi 110004',
            distance: '1.2 km',
            phone: '+91 11 9999 8888',
            website: null
        },
        {
            name: 'Trauma Care Hospital',
            address: 'Trauma Street, Emergency District, Delhi 110005',
            distance: '2.8 km',
            phone: '+91 11 7777 6666',
            website: null
        }
    ];
}