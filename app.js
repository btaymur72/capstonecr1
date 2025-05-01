// Global variables
let map;
let markers = [];
const API_URL = 'http://localhost:3000/api';

// Code to run when page loads
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
    fetchPatents(); // Fetch data from API
});

// Initialize the map
function initMap() {
    try {
        // Start with world view
        map = L.map('patent-map', {
            center: [20.0, 0.0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true,
            worldCopyJump: true // Better performance when crossing world map boundaries
        });
        
        // More detailed and vibrant map layer
        const mainLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        // Alternative layer for satellite imagery
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        });
        
        // Add map layer options
        const baseMaps = {
            "Standard Map": mainLayer,
            "Satellite View": satelliteLayer
        };
        
        // Add layer control panel
        L.control.layers(baseMaps, null, {position: 'topright'}).addTo(map);
        
        // Add scale bar
        L.control.scale({
            imperial: false,
            position: 'bottomleft'
        }).addTo(map);

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Click event for search button
    document.getElementById('search-btn').addEventListener('click', function() {
        searchPatents();
    });
    
    // Search with Enter key
    document.querySelectorAll('.search-form input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchPatents();
            }
        });
    });
    
    // Click event for patent detail close button
    document.querySelector('.close-btn').addEventListener('click', function() {
        document.getElementById('patent-details').style.display = 'none';
    });

    // Click event for compare button
    document.getElementById('compare-btn').addEventListener('click', function() {
        document.getElementById('compare-modal').style.display = 'block';
        loadPatentList(); // Load patent list when modal opens
    });

    // Click event for compare modal close button
    document.querySelector('.modal-close').addEventListener('click', function() {
        document.getElementById('compare-modal').style.display = 'none';
    });

    // Click event for compare submit button
    document.getElementById('compare-submit').addEventListener('click', function() {
        comparePatents();
    });
}

// Fetch all patents from API
async function fetchPatents() {
    try {
        const response = await fetch(`${API_URL}/patents`);
        if (!response.ok) {
            throw new Error('API did not respond');
        }
        
        const patents = await response.json();
        displayResults(patents);
        patents.forEach(patent => addMarkerToMap(patent));
        
        // Fit all patents to map view
        if (patents.length > 0) {
            fitMapToBounds();
        }
    } catch (error) {
        console.error('Error fetching patent data:', error);
        // Use sample data in case of error
        console.log('Using sample data instead...');
        displayResults(sampleData);
        clearMarkers(); // Clear any existing markers
        sampleData.forEach(patent => addMarkerToMap(patent));
        fitMapToBounds();
    }
}

// Patent search function
async function searchPatents() {
    // Get form values
    const patentNo = document.getElementById('patent-no').value;
    const keywords = document.getElementById('keywords').value;
    const applicant = document.getElementById('applicant').value;
    const region = document.getElementById('region').value;
    const status = document.getElementById('status').value;
    
    // Search parameters
    const params = new URLSearchParams();
    if (patentNo) params.append('patentNo', patentNo);
    if (keywords) params.append('keywords', keywords);
    if (applicant) params.append('applicant', applicant);
    if (region) params.append('region', region);
    if (status) params.append('status', status);
    
    try {
        const response = await fetch(`${API_URL}/patents/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error('API did not respond');
        }
        
        const patents = await response.json();
        displayResults(patents);
        
        // Update the map
        clearMarkers();
        patents.forEach(patent => addMarkerToMap(patent));
        
        // Fit search results to map view
        if (patents.length > 0) {
            fitMapToBounds();
        }
        
    } catch (error) {
        console.error('Error while searching:', error);
        // Filter sample data if API is not available
        const filters = { patentNo, keywords, applicant, region, status };
        filterSampleData(filters);
    }
}

// Adjust map to fit current markers
function fitMapToBounds() {
    if (markers.length > 0) {
        const markerGroup = L.featureGroup(markers);
        map.fitBounds(markerGroup.getBounds(), {
            padding: [50, 50],
            maxZoom: 12,
            animate: true,
            duration: 0.5
        });
    }
}

// Add marker to map
function addMarkerToMap(patent) {
    // Get coordinates
    let lat = patent.latitude;
    let lng = patent.longitude;
    
    // Use default values if coordinates are missing
    if (!lat || !lng) {
        // Sample coordinates by region (temporary solution)
        switch(patent.geographicRegion) {
            case 'TURKEY':
                lat = 39.0 + (Math.random() - 0.5) * 3;
                lng = 35.0 + (Math.random() - 0.5) * 5;
                break;
            case 'USA':
                lat = 37.0 + (Math.random() - 0.5) * 5;
                lng = -95.0 + (Math.random() - 0.5) * 10;
                break;
            case 'EU':
                lat = 50.0 + (Math.random() - 0.5) * 5;
                lng = 10.0 + (Math.random() - 0.5) * 10;
                break;
            case 'ASIA':
                lat = 34.0 + (Math.random() - 0.5) * 10;
                lng = 100.0 + (Math.random() - 0.5) * 20;
                break;
            default:
                lat = 39.0 + (Math.random() - 0.5) * 20;
                lng = 35.0 + (Math.random() - 0.5) * 40;
        }
    }
    
    // Set color based on patent status
    let markerColor = '#4a69bd'; // Default blue
    if (patent.patentStatus) {
        if (patent.patentStatus.toLowerCase() === 'active') {
            markerColor = '#2ecc71'; // Green - active patent
        } else if (patent.patentStatus.toLowerCase() === 'inactive') {
            markerColor = '#e74c3c'; // Red - inactive patent
        }
    }
    
    // Adjust marker size based on patent region (to highlight)
    let size = 16;
    let borderWidth = 2;
    
    if (patent.geographicRegion === 'TURKEY') {
        size = 20; // Larger marker
        borderWidth = 3;
    }
    
    // Create custom marker icon
    const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${markerColor}; width:${size-2*borderWidth}px; height:${size-2*borderWidth}px; border-radius:50%; border:${borderWidth}px solid white; box-shadow:0 0 8px ${markerColor};"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
    
    try {
        // Create marker with custom icon
        const marker = L.marker([lat, lng], {icon: markerIcon}).addTo(map);
        
        // Prepare popup content
        const popupContent = `
            <div class="patent-popup">
                <h3>${patent.patentNo}</h3>
                <p>${patent.applicant || 'Unknown Applicant'}</p>
                <p class="region-tag">${patent.geographicRegion || 'Unknown Region'}</p>
                <a href="#" class="details-link" onclick="showPatentDetails('${patent.patentNo}'); return false;">View Details</a>
            </div>
        `;
        
        // Add popup
        marker.bindPopup(popupContent);
        
        // Mouse over event to highlight marker
        marker.on('mouseover', function() {
            this.openPopup();
        });
        
        // Add marker to global list
        markers.push(marker);
        console.log(`Added marker for patent ${patent.patentNo} at [${lat}, ${lng}]`);
    } catch (error) {
        console.error(`Error adding marker for patent ${patent.patentNo}:`, error);
    }
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

// Show patent details
async function showPatentDetails(patentNo) {
    try {
        // Fetch patent details from API
        const response = await fetch(`${API_URL}/patents/no/${patentNo}`);
        if (!response.ok) {
            throw new Error('Patent not found');
        }
        
        const patent = await response.json();
        displayPatentDetails(patent);
    } catch (error) {
        console.error('Error getting patent details:', error);
        // Get from sample data if API is not available
        const patent = sampleData.find(p => p.patentNo === patentNo);
        if (patent) {
            displayPatentDetails(patent);
        } else {
            alert('Patent not found!');
        }
    }
}

// Display patent details
function displayPatentDetails(patent) {
    // Prepare details content
    const detailsContent = `
        <div class="detail-row">
            <span class="detail-label">Patent No:</span> ${patent.patentNo}
        </div>
        <div class="detail-row">
            <span class="detail-label">Keywords:</span> ${patent.keywords || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">Abstract:</span> ${patent.abstract || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">Application Date:</span> ${patent.applicationDate || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">Publication Date:</span> ${patent.publicationDate || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">Applicant:</span> ${patent.applicant || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">IPC:</span> ${patent.ipc || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">CPC:</span> ${patent.cpc || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">Claims:</span> ${patent.claims || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">Geographic Region:</span> ${patent.geographicRegion || '-'}
        </div>
        <div class="detail-row">
            <span class="detail-label">Patent Status:</span> ${patent.patentStatus || '-'}
        </div>
    `;
    
    // Add content to details panel and show
    document.querySelector('.details-content').innerHTML = detailsContent;
    document.getElementById('patent-details').style.display = 'block';
    
    // Zoom to patent location on map
    if (patent.latitude && patent.longitude) {
        map.setView([patent.latitude, patent.longitude], 8, {
            animate: true,
            duration: 1
        });
        
        // Find and highlight the relevant marker
        markers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (markerLatLng.lat === patent.latitude && markerLatLng.lng === patent.longitude) {
                marker.openPopup();
            }
        });
    }
}

// Display search results
function displayResults(patents) {
    const resultsContainer = document.getElementById('results-container');
    
    if (!patents || patents.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }
    
    let html = '';
    
    patents.forEach(patent => {
        html += `
            <div class="patent-item" onclick="showPatentDetails('${patent.patentNo}')">
                <strong>${patent.patentNo}</strong> - ${patent.applicant || ''}<br>
                <small>${patent.keywords || ''}</small>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Filter sample data (when API is not available)
function filterSampleData(filters) {
    let filtered = [...sampleData];
    
    // Patent number filter
    if (filters.patentNo) {
        filtered = filtered.filter(p => p.patentNo.toLowerCase().includes(filters.patentNo.toLowerCase()));
    }
    
    // Keywords filter
    if (filters.keywords) {
        filtered = filtered.filter(p => p.keywords.toLowerCase().includes(filters.keywords.toLowerCase()));
    }
    
    // Applicant filter
    if (filters.applicant) {
        filtered = filtered.filter(p => p.applicant.toLowerCase().includes(filters.applicant.toLowerCase()));
    }
    
    // Region filter
    if (filters.region) {
        filtered = filtered.filter(p => p.geographicRegion === filters.region);
    }
    
    // Status filter
    if (filters.status) {
        filtered = filtered.filter(p => p.patentStatus === filters.status);
    }
    
    // Show results
    displayResults(filtered);
    
    // Update map
    clearMarkers();
    filtered.forEach(patent => addMarkerToMap(patent));
    
    // Fit results to map view
    if (filtered.length > 0) {
        fitMapToBounds();
    }
}

// Add showPatentDetails function to global page context (for popup calls)
window.showPatentDetails = showPatentDetails;

// Sample data (used when API is not available)
const sampleData = [
    // Patent 1-30 (mevcut patentler)
    // ... existing patents 1-30 ...

    // Patent 31-60 (yeni patentler)
    {
        patentNo: "TR2023/990011",
        keywords: "defense, aerospace, propulsion",
        abstract: "An advanced propulsion system for aerospace applications.",
        applicationDate: "10.11.2023",
        publicationDate: "17.05.2024",
        applicant: "TUSAŞ",
        ipc: "F02K 9/00",
        cpc: "F02K 9/00",
        claims: "1. An aerospace propulsion system...\n2. The propulsion method of claim 1...",
        geographicRegion: "TURKEY",
        patentStatus: "active",
        latitude: 39.9334,
        longitude: 32.8597
    },
    {
        patentNo: "US2024/112233",
        keywords: "artificial intelligence, healthcare, diagnosis",
        abstract: "An AI-powered diagnostic system for medical imaging analysis.",
        applicationDate: "15.12.2023",
        publicationDate: "22.06.2024",
        applicant: "GE Healthcare",
        ipc: "G16H 30/40",
        cpc: "G16H 30/40",
        claims: "1. A medical imaging analysis system...\n2. The diagnostic method of claim 1...",
        geographicRegion: "USA",
        patentStatus: "active",
        latitude: 41.8781,
        longitude: -87.6298
    },
    {
        patentNo: "EP2024/334455",
        keywords: "renewable energy, solar power, efficiency",
        abstract: "A high-efficiency solar panel system with advanced tracking.",
        applicationDate: "20.01.2024",
        publicationDate: "27.07.2024",
        applicant: "SMA Solar Technology",
        ipc: "H02S 20/32",
        cpc: "H02S 20/32",
        claims: "1. A solar tracking system...\n2. The efficiency optimization method of claim 1...",
        geographicRegion: "EU",
        patentStatus: "active",
        latitude: 50.1109,
        longitude: 8.6821
    },
    {
        patentNo: "CN2024/445566",
        keywords: "quantum computing, encryption, security",
        abstract: "A quantum-resistant encryption system for secure communications.",
        applicationDate: "03.02.2024",
        publicationDate: "10.08.2024",
        applicant: "Huawei Technologies",
        ipc: "H04L 9/08",
        cpc: "H04L 9/0852",
        claims: "1. A quantum encryption system...\n2. The security protocol of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 22.5431,
        longitude: 114.0579
    },
    {
        patentNo: "JP2024/778899",
        keywords: "robotics, automation, manufacturing",
        abstract: "An advanced robotic system for precision manufacturing.",
        applicationDate: "15.03.2024",
        publicationDate: "22.09.2024",
        applicant: "Fanuc Corporation",
        ipc: "B25J 9/16",
        cpc: "B25J 9/163",
        claims: "1. A robotic manufacturing system...\n2. The precision control method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 35.6762,
        longitude: 139.6503
    },
    {
        patentNo: "KR2024/990011",
        keywords: "5G, communication, network",
        abstract: "A next-generation 5G network optimization system.",
        applicationDate: "20.04.2024",
        publicationDate: "27.10.2024",
        applicant: "Samsung Electronics",
        ipc: "H04W 24/02",
        cpc: "H04W 24/02",
        claims: "1. A 5G network optimization system...\n2. The performance enhancement method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 37.5665,
        longitude: 126.9780
    },
    {
        patentNo: "TR2024/112233",
        keywords: "medical device, imaging, diagnostic",
        abstract: "A portable medical imaging device for emergency diagnostics.",
        applicationDate: "10.05.2024",
        publicationDate: "17.11.2024",
        applicant: "TÜBİTAK",
        ipc: "A61B 5/00",
        cpc: "A61B 5/0059",
        claims: "1. A portable medical imaging device...\n2. The diagnostic method of claim 1...",
        geographicRegion: "TURKEY",
        patentStatus: "active",
        latitude: 39.8900,
        longitude: 32.7800
    },
    {
        patentNo: "US2024/334455",
        keywords: "artificial intelligence, machine learning, optimization",
        abstract: "An AI system for optimizing industrial processes.",
        applicationDate: "15.06.2024",
        publicationDate: "22.12.2024",
        applicant: "General Electric",
        ipc: "G06N 20/00",
        cpc: "G06N 20/00",
        claims: "1. An AI optimization system...\n2. The process optimization method of claim 1...",
        geographicRegion: "USA",
        patentStatus: "active",
        latitude: 42.3601,
        longitude: -71.0589
    },
    {
        patentNo: "EP2024/445566",
        keywords: "biotechnology, gene therapy, CRISPR",
        abstract: "An improved CRISPR-based gene editing system.",
        applicationDate: "20.07.2024",
        publicationDate: "27.01.2025",
        applicant: "Bayer",
        ipc: "C12N 15/10",
        cpc: "C12N 15/113",
        claims: "1. A gene editing system...\n2. The therapeutic method of claim 1...",
        geographicRegion: "EU",
        patentStatus: "active",
        latitude: 51.2277,
        longitude: 6.7735
    },
    {
        patentNo: "CN2024/778899",
        keywords: "electric vehicle, battery, charging",
        abstract: "A fast-charging system for electric vehicles.",
        applicationDate: "03.08.2024",
        publicationDate: "10.02.2025",
        applicant: "BYD Company Limited",
        ipc: "B60L 53/00",
        cpc: "B60L 53/00",
        claims: "1. An EV charging system...\n2. The charging method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 22.5431,
        longitude: 114.0579
    },
    {
        patentNo: "JP2024/990011",
        keywords: "nanotechnology, materials science, coating",
        abstract: "A nanotech-based protective coating system.",
        applicationDate: "15.09.2024",
        publicationDate: "22.03.2025",
        applicant: "Mitsubishi Chemical",
        ipc: "C09D 5/00",
        cpc: "C09D 5/00",
        claims: "1. A nanotech coating system...\n2. The application method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 35.6762,
        longitude: 139.6503
    },
    {
        patentNo: "KR2024/112233",
        keywords: "virtual reality, gaming, entertainment",
        abstract: "An immersive VR gaming system with advanced haptics.",
        applicationDate: "20.10.2024",
        publicationDate: "27.04.2025",
        applicant: "LG Electronics",
        ipc: "A63F 13/00",
        cpc: "A63F 13/00",
        claims: "1. A VR gaming system...\n2. The haptic feedback method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 37.5665,
        longitude: 126.9780
    },
    {
        patentNo: "TR2024/334455",
        keywords: "agriculture, IoT, smart farming",
        abstract: "An IoT-based precision agriculture system.",
        applicationDate: "10.11.2024",
        publicationDate: "17.05.2025",
        applicant: "TARIM A.Ş.",
        ipc: "A01G 25/16",
        cpc: "A01G 25/16",
        claims: "1. A smart farming system...\n2. The precision agriculture method of claim 1...",
        geographicRegion: "TURKEY",
        patentStatus: "active",
        latitude: 39.9334,
        longitude: 32.8597
    },
    {
        patentNo: "US2024/445566",
        keywords: "space technology, satellite, communication",
        abstract: "A next-generation satellite communication system.",
        applicationDate: "15.12.2024",
        publicationDate: "22.06.2025",
        applicant: "SpaceX",
        ipc: "H04B 7/185",
        cpc: "H04B 7/185",
        claims: "1. A satellite communication system...\n2. The global coverage method of claim 1...",
        geographicRegion: "USA",
        patentStatus: "active",
        latitude: 34.0522,
        longitude: -118.2437
    },
    {
        patentNo: "EP2024/778899",
        keywords: "renewable energy, wind power, turbine",
        abstract: "An innovative wind turbine design for offshore applications.",
        applicationDate: "20.01.2025",
        publicationDate: "27.07.2025",
        applicant: "Siemens Gamesa",
        ipc: "F03D 1/00",
        cpc: "F03D 1/00",
        claims: "1. An offshore wind turbine system...\n2. The energy generation method of claim 1...",
        geographicRegion: "EU",
        patentStatus: "active",
        latitude: 55.6761,
        longitude: 12.5683
    },
    {
        patentNo: "CN2024/990011",
        keywords: "artificial intelligence, robotics, automation",
        abstract: "An AI-powered robotic system for industrial applications.",
        applicationDate: "03.02.2025",
        publicationDate: "10.08.2025",
        applicant: "Huawei Technologies",
        ipc: "B25J 9/16",
        cpc: "B25J 9/163",
        claims: "1. An AI robotic system...\n2. The automation method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 22.5431,
        longitude: 114.0579
    },
    {
        patentNo: "JP2024/112233",
        keywords: "medical device, imaging, diagnostic",
        abstract: "A portable medical imaging device for clinical use.",
        applicationDate: "15.03.2025",
        publicationDate: "22.09.2025",
        applicant: "Sony Corporation",
        ipc: "A61B 5/00",
        cpc: "A61B 5/0059",
        claims: "1. A medical imaging device...\n2. The diagnostic method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 35.6762,
        longitude: 139.6503
    },
    {
        patentNo: "KR2024/334455",
        keywords: "electric vehicle, battery, charging",
        abstract: "A fast-charging system for electric vehicles.",
        applicationDate: "20.04.2025",
        publicationDate: "27.10.2025",
        applicant: "Hyundai Motor Company",
        ipc: "B60L 53/00",
        cpc: "B60L 53/00",
        claims: "1. An EV charging system...\n2. The charging method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 37.5665,
        longitude: 126.9780
    },
    {
        patentNo: "TR2024/445566",
        keywords: "defense, radar, detection",
        abstract: "An advanced radar system for military applications.",
        applicationDate: "10.05.2025",
        publicationDate: "17.11.2025",
        applicant: "ROKETSAN A.Ş.",
        ipc: "G01S 13/00",
        cpc: "G01S 13/00",
        claims: "1. A radar detection system...\n2. The detection method of claim 1...",
        geographicRegion: "TURKEY",
        patentStatus: "active",
        latitude: 39.9334,
        longitude: 32.8597
    },
    {
        patentNo: "US2024/778899",
        keywords: "quantum computing, encryption, security",
        abstract: "A quantum-resistant encryption system.",
        applicationDate: "15.06.2025",
        publicationDate: "22.12.2025",
        applicant: "Google LLC",
        ipc: "H04L 9/08",
        cpc: "H04L 9/0852",
        claims: "1. A quantum encryption system...\n2. The security method of claim 1...",
        geographicRegion: "USA",
        patentStatus: "active",
        latitude: 37.7749,
        longitude: -122.4194
    },
    {
        patentNo: "EP2024/990011",
        keywords: "biotechnology, gene therapy, CRISPR",
        abstract: "An improved CRISPR-based gene editing system.",
        applicationDate: "20.07.2025",
        publicationDate: "27.01.2026",
        applicant: "Roche",
        ipc: "C12N 15/10",
        cpc: "C12N 15/113",
        claims: "1. A gene editing system...\n2. The therapeutic method of claim 1...",
        geographicRegion: "EU",
        patentStatus: "active",
        latitude: 47.3769,
        longitude: 8.5417
    },
    {
        patentNo: "CN2024/112233",
        keywords: "robotics, automation, manufacturing",
        abstract: "An advanced robotic system for manufacturing.",
        applicationDate: "03.08.2025",
        publicationDate: "10.02.2026",
        applicant: "Huawei Technologies",
        ipc: "B25J 9/16",
        cpc: "B25J 9/163",
        claims: "1. A robotic manufacturing system...\n2. The automation method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 22.5431,
        longitude: 114.0579
    },
    {
        patentNo: "JP2024/334455",
        keywords: "5G, communication, network",
        abstract: "A novel 5G network optimization system.",
        applicationDate: "15.09.2025",
        publicationDate: "22.03.2026",
        applicant: "NTT Docomo",
        ipc: "H04W 24/02",
        cpc: "H04W 24/02",
        claims: "1. A 5G network system...\n2. The optimization method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 35.6762,
        longitude: 139.6503
    },
    {
        patentNo: "KR2024/445566",
        keywords: "artificial intelligence, machine learning, optimization",
        abstract: "An AI system for process optimization.",
        applicationDate: "20.10.2025",
        publicationDate: "27.04.2026",
        applicant: "Samsung Electronics",
        ipc: "G06N 20/00",
        cpc: "G06N 20/00",
        claims: "1. An AI optimization system...\n2. The machine learning method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 37.5665,
        longitude: 126.9780
    },
    {
        patentNo: "TR2024/778899",
        keywords: "defense, aerospace, propulsion",
        abstract: "An advanced aerospace propulsion system.",
        applicationDate: "10.11.2025",
        publicationDate: "17.05.2026",
        applicant: "TUSAŞ",
        ipc: "F02K 9/00",
        cpc: "F02K 9/00",
        claims: "1. An aerospace propulsion system...\n2. The propulsion method of claim 1...",
        geographicRegion: "TURKEY",
        patentStatus: "active",
        latitude: 39.9334,
        longitude: 32.8597
    },
    {
        patentNo: "US2024/990011",
        keywords: "medical device, imaging, diagnostic",
        abstract: "An advanced medical imaging system.",
        applicationDate: "15.12.2025",
        publicationDate: "22.06.2026",
        applicant: "GE Healthcare",
        ipc: "A61B 5/00",
        cpc: "A61B 5/0059",
        claims: "1. A medical imaging system...\n2. The diagnostic method of claim 1...",
        geographicRegion: "USA",
        patentStatus: "active",
        latitude: 41.8781,
        longitude: -87.6298
    },
    {
        patentNo: "EP2025/112233",
        keywords: "renewable energy, solar power, efficiency",
        abstract: "A high-efficiency solar power system.",
        applicationDate: "20.01.2026",
        publicationDate: "27.07.2026",
        applicant: "SMA Solar Technology",
        ipc: "H02S 20/32",
        cpc: "H02S 20/32",
        claims: "1. A solar power system...\n2. The efficiency optimization method of claim 1...",
        geographicRegion: "EU",
        patentStatus: "active",
        latitude: 50.1109,
        longitude: 8.6821
    },
    {
        patentNo: "CN2025/334455",
        keywords: "quantum computing, encryption, security",
        abstract: "A quantum-resistant security system.",
        applicationDate: "03.02.2026",
        publicationDate: "10.08.2026",
        applicant: "Huawei Technologies",
        ipc: "H04L 9/08",
        cpc: "H04L 9/0852",
        claims: "1. A quantum security system...\n2. The encryption method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 22.5431,
        longitude: 114.0579
    },
    {
        patentNo: "JP2025/445566",
        keywords: "robotics, automation, manufacturing",
        abstract: "An advanced manufacturing robot system.",
        applicationDate: "15.03.2026",
        publicationDate: "22.09.2026",
        applicant: "Fanuc Corporation",
        ipc: "B25J 9/16",
        cpc: "B25J 9/163",
        claims: "1. A manufacturing robot system...\n2. The automation method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 35.6762,
        longitude: 139.6503
    },
    {
        patentNo: "KR2025/778899",
        keywords: "5G, communication, network",
        abstract: "A next-generation communication system.",
        applicationDate: "20.04.2026",
        publicationDate: "27.10.2026",
        applicant: "Samsung Electronics",
        ipc: "H04W 24/02",
        cpc: "H04W 24/02",
        claims: "1. A communication system...\n2. The network optimization method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 37.5665,
        longitude: 126.9780
    },
    {
        patentNo: "TR2025/990011",
        keywords: "medical device, imaging, diagnostic",
        abstract: "A portable medical diagnostic system.",
        applicationDate: "10.05.2026",
        publicationDate: "17.11.2026",
        applicant: "TÜBİTAK",
        ipc: "A61B 5/00",
        cpc: "A61B 5/0059",
        claims: "1. A medical diagnostic system...\n2. The diagnostic method of claim 1...",
        geographicRegion: "TURKEY",
        patentStatus: "active",
        latitude: 39.8900,
        longitude: 32.7800
    },
    {
        patentNo: "US2025/112233",
        keywords: "artificial intelligence, machine learning, optimization",
        abstract: "An AI-based optimization system.",
        applicationDate: "15.06.2026",
        publicationDate: "22.12.2026",
        applicant: "General Electric",
        ipc: "G06N 20/00",
        cpc: "G06N 20/00",
        claims: "1. An AI optimization system...\n2. The machine learning method of claim 1...",
        geographicRegion: "USA",
        patentStatus: "active",
        latitude: 42.3601,
        longitude: -71.0589
    },
    {
        patentNo: "EP2025/334455",
        keywords: "biotechnology, gene therapy, CRISPR",
        abstract: "An advanced gene therapy system.",
        applicationDate: "20.07.2026",
        publicationDate: "27.01.2027",
        applicant: "Bayer",
        ipc: "C12N 15/10",
        cpc: "C12N 15/113",
        claims: "1. A gene therapy system...\n2. The therapeutic method of claim 1...",
        geographicRegion: "EU",
        patentStatus: "active",
        latitude: 51.2277,
        longitude: 6.7735
    },
    {
        patentNo: "CN2025/445566",
        keywords: "electric vehicle, battery, charging",
        abstract: "An advanced EV charging system.",
        applicationDate: "03.08.2026",
        publicationDate: "10.02.2027",
        applicant: "BYD Company Limited",
        ipc: "B60L 53/00",
        cpc: "B60L 53/00",
        claims: "1. An EV charging system...\n2. The charging method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 22.5431,
        longitude: 114.0579
    },
    {
        patentNo: "JP2025/778899",
        keywords: "nanotechnology, materials science, coating",
        abstract: "An advanced nanotech coating system.",
        applicationDate: "15.09.2026",
        publicationDate: "22.03.2027",
        applicant: "Mitsubishi Chemical",
        ipc: "C09D 5/00",
        cpc: "C09D 5/00",
        claims: "1. A nanotech coating system...\n2. The application method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 35.6762,
        longitude: 139.6503
    },
    {
        patentNo: "KR2025/990011",
        keywords: "virtual reality, gaming, entertainment",
        abstract: "An advanced VR gaming system.",
        applicationDate: "20.10.2026",
        publicationDate: "27.04.2027",
        applicant: "LG Electronics",
        ipc: "A63F 13/00",
        cpc: "A63F 13/00",
        claims: "1. A VR gaming system...\n2. The entertainment method of claim 1...",
        geographicRegion: "ASIA",
        patentStatus: "active",
        latitude: 37.5665,
        longitude: 126.9780
    }
];

// Compare patents function
async function comparePatents() {
    const patentNo1 = document.getElementById('compare-patent1').value;
    const patentNo2 = document.getElementById('compare-patent2').value;

    if (!patentNo1 || !patentNo2) {
        alert('Please enter both patent numbers');
        return;
    }

    try {
        // Fetch both patents
        const response1 = await fetch(`${API_URL}/patents/no/${patentNo1}`);
        const response2 = await fetch(`${API_URL}/patents/no/${patentNo2}`);

        if (!response1.ok || !response2.ok) {
            throw new Error('One or both patents not found');
        }

        const patent1 = await response1.json();
        const patent2 = await response2.json();

        // Clear current markers and display only the two patents
        clearMarkers();
        displayResults([patent1, patent2]);
        addMarkerToMap(patent1);
        addMarkerToMap(patent2);
        fitMapToBounds();

        // Show comparison results
        showComparisonResults(patent1, patent2);

        // Close the modal
        document.getElementById('compare-modal').style.display = 'none';

    } catch (error) {
        console.error('Error comparing patents:', error);
        // Try to find patents in sample data
        const patent1 = sampleData.find(p => p.patentNo === patentNo1);
        const patent2 = sampleData.find(p => p.patentNo === patentNo2);

        if (patent1 && patent2) {
            clearMarkers();
            displayResults([patent1, patent2]);
            addMarkerToMap(patent1);
            addMarkerToMap(patent2);
            fitMapToBounds();
            showComparisonResults(patent1, patent2);
            document.getElementById('compare-modal').style.display = 'none';
        } else {
            alert('One or both patents not found!');
        }
    }
}

// Calculate similarity between two patents
function calculateSimilarity(patent1, patent2) {
    let totalScore = 0;
    let maxScore = 0;
    
    // Keywords similarity (weight: 30%)
    if (patent1.keywords && patent2.keywords) {
        const keywords1 = patent1.keywords.toLowerCase().split(',').map(k => k.trim());
        const keywords2 = patent2.keywords.toLowerCase().split(',').map(k => k.trim());
        const commonKeywords = keywords1.filter(k => keywords2.includes(k));
        const keywordsScore = (commonKeywords.length / Math.max(keywords1.length, keywords2.length)) * 30;
        totalScore += keywordsScore;
    }
    maxScore += 30;
    
    // Abstract similarity (weight: 25%)
    if (patent1.abstract && patent2.abstract) {
        const abstract1 = patent1.abstract.toLowerCase();
        const abstract2 = patent2.abstract.toLowerCase();
        const words1 = abstract1.split(/\s+/);
        const words2 = abstract2.split(/\s+/);
        const commonWords = words1.filter(w => words2.includes(w));
        const abstractScore = (commonWords.length / Math.max(words1.length, words2.length)) * 25;
        totalScore += abstractScore;
    }
    maxScore += 25;
    
    // IPC/CPC similarity (weight: 20%)
    if (patent1.ipc && patent2.ipc) {
        const ipc1 = patent1.ipc.split(' ')[0]; // Take only the main class
        const ipc2 = patent2.ipc.split(' ')[0];
        if (ipc1 === ipc2) {
            totalScore += 20;
        }
    }
    maxScore += 20;
    
    // Geographic region similarity (weight: 15%)
    if (patent1.geographicRegion && patent2.geographicRegion) {
        if (patent1.geographicRegion === patent2.geographicRegion) {
            totalScore += 15;
        }
    }
    maxScore += 15;
    
    // Applicant similarity (weight: 10%)
    if (patent1.applicant && patent2.applicant) {
        const applicant1 = patent1.applicant.toLowerCase();
        const applicant2 = patent2.applicant.toLowerCase();
        if (applicant1 === applicant2) {
            totalScore += 10;
        }
    }
    maxScore += 10;
    
    // Calculate final similarity percentage
    const similarityPercentage = (totalScore / maxScore) * 100;
    return Math.round(similarityPercentage);
}

// Show detailed similarity analysis
function showSimilarityAnalysis(patent1, patent2) {
    const similarityScores = calculateDetailedSimilarity(patent1, patent2);
    
    // Update progress bars and details
    document.getElementById('keywords-progress').style.width = `${similarityScores.keywords.score}%`;
    document.getElementById('abstract-progress').style.width = `${similarityScores.abstract.score}%`;
    document.getElementById('ipc-progress').style.width = `${similarityScores.ipc.score}%`;
    document.getElementById('region-progress').style.width = `${similarityScores.region.score}%`;
    document.getElementById('applicant-progress').style.width = `${similarityScores.applicant.score}%`;
    
    // Update details
    document.getElementById('keywords-details').innerHTML = similarityScores.keywords.details;
    document.getElementById('abstract-details').innerHTML = similarityScores.abstract.details;
    document.getElementById('ipc-details').innerHTML = similarityScores.ipc.details;
    document.getElementById('region-details').innerHTML = similarityScores.region.details;
    document.getElementById('applicant-details').innerHTML = similarityScores.applicant.details;
    
    // Show modal
    document.getElementById('similarity-modal').style.display = 'block';
}

// Calculate detailed similarity scores
function calculateDetailedSimilarity(patent1, patent2) {
    const scores = {
        keywords: { score: 0, details: '' },
        abstract: { score: 0, details: '' },
        ipc: { score: 0, details: '' },
        region: { score: 0, details: '' },
        applicant: { score: 0, details: '' }
    };
    
    // Keywords similarity
    if (patent1.keywords && patent2.keywords) {
        const keywords1 = patent1.keywords.toLowerCase().split(',').map(k => k.trim());
        const keywords2 = patent2.keywords.toLowerCase().split(',').map(k => k.trim());
        const commonKeywords = keywords1.filter(k => keywords2.includes(k));
        scores.keywords.score = (commonKeywords.length / Math.max(keywords1.length, keywords2.length)) * 100;
        scores.keywords.details = `Common keywords: ${commonKeywords.join(', ')}`;
    }
    
    // Abstract similarity
    if (patent1.abstract && patent2.abstract) {
        const abstract1 = patent1.abstract.toLowerCase();
        const abstract2 = patent2.abstract.toLowerCase();
        const words1 = abstract1.split(/\s+/);
        const words2 = abstract2.split(/\s+/);
        const commonWords = words1.filter(w => words2.includes(w));
        scores.abstract.score = (commonWords.length / Math.max(words1.length, words2.length)) * 100;
        scores.abstract.details = `${commonWords.length} common words found`;
    }
    
    // IPC/CPC similarity
    if (patent1.ipc && patent2.ipc) {
        const ipc1 = patent1.ipc.split(' ')[0];
        const ipc2 = patent2.ipc.split(' ')[0];
        scores.ipc.score = ipc1 === ipc2 ? 100 : 0;
        scores.ipc.details = `Patent 1: ${patent1.ipc}<br>Patent 2: ${patent2.ipc}`;
    }
    
    // Geographic region similarity
    if (patent1.geographicRegion && patent2.geographicRegion) {
        scores.region.score = patent1.geographicRegion === patent2.geographicRegion ? 100 : 0;
        scores.region.details = `Patent 1: ${patent1.geographicRegion}<br>Patent 2: ${patent2.geographicRegion}`;
    }
    
    // Applicant similarity
    if (patent1.applicant && patent2.applicant) {
        const applicant1 = patent1.applicant.toLowerCase();
        const applicant2 = patent2.applicant.toLowerCase();
        scores.applicant.score = applicant1 === applicant2 ? 100 : 0;
        scores.applicant.details = `Patent 1: ${patent1.applicant}<br>Patent 2: ${patent2.applicant}`;
    }
    
    return scores;
}

// Update showComparisonResults function
function showComparisonResults(patent1, patent2) {
    // Calculate similarity
    const similarityScore = calculateSimilarity(patent1, patent2);
    
    // Update patent 1 details
    document.getElementById('compare-no1').textContent = patent1.patentNo;
    document.getElementById('compare-keywords1').textContent = patent1.keywords || '-';
    document.getElementById('compare-abstract1').textContent = patent1.abstract || '-';
    document.getElementById('compare-appdate1').textContent = patent1.applicationDate || '-';
    document.getElementById('compare-pubdate1').textContent = patent1.publicationDate || '-';
    document.getElementById('compare-applicant1').textContent = patent1.applicant || '-';
    document.getElementById('compare-ipc1').textContent = patent1.ipc || '-';
    document.getElementById('compare-cpc1').textContent = patent1.cpc || '-';
    document.getElementById('compare-region1').textContent = patent1.geographicRegion || '-';
    document.getElementById('compare-status1').textContent = patent1.patentStatus || '-';

    // Update patent 2 details
    document.getElementById('compare-no2').textContent = patent2.patentNo;
    document.getElementById('compare-keywords2').textContent = patent2.keywords || '-';
    document.getElementById('compare-abstract2').textContent = patent2.abstract || '-';
    document.getElementById('compare-appdate2').textContent = patent2.applicationDate || '-';
    document.getElementById('compare-pubdate2').textContent = patent2.publicationDate || '-';
    document.getElementById('compare-applicant2').textContent = patent2.applicant || '-';
    document.getElementById('compare-ipc2').textContent = patent2.ipc || '-';
    document.getElementById('compare-cpc2').textContent = patent2.cpc || '-';
    document.getElementById('compare-region2').textContent = patent2.geographicRegion || '-';
    document.getElementById('compare-status2').textContent = patent2.patentStatus || '-';

    // Update similarity score
    const similarityElement = document.getElementById('similarity-score');
    similarityElement.textContent = `${similarityScore}%`;
    
    // Set color based on similarity score
    if (similarityScore >= 70) {
        similarityElement.style.color = '#2ecc71'; // Green for high similarity
    } else if (similarityScore >= 40) {
        similarityElement.style.color = '#f1c40f'; // Yellow for medium similarity
    } else {
        similarityElement.style.color = '#e74c3c'; // Red for low similarity
    }

    // Add click event to similarity score
    similarityElement.style.cursor = 'pointer';
    similarityElement.addEventListener('click', function() {
        showSimilarityAnalysis(patent1, patent2);
    });

    // Show comparison results
    document.getElementById('comparison-results').style.display = 'block';
}

// Close comparison results
function closeComparison() {
    document.getElementById('comparison-results').style.display = 'none';
}

// Add closeComparison function to global scope
window.closeComparison = closeComparison;

// Add event listener for similarity modal close button
document.querySelector('#similarity-modal .modal-close').addEventListener('click', function() {
    document.getElementById('similarity-modal').style.display = 'none';
});

// Load patent list into comparison modal
async function loadPatentList() {
    const patentListContainer = document.querySelector('.patent-list');
    patentListContainer.innerHTML = ''; // Clear existing list

    try {
        const response = await fetch(`${API_URL}/patents`);
        if (!response.ok) {
            throw new Error('API did not respond');
        }
        
        const patents = await response.json();
        
        patents.forEach(patent => {
            const listItem = document.createElement('div');
            listItem.className = 'patent-list-item';
            listItem.innerHTML = `
                <div class="patent-no">${patent.patentNo}</div>
                <div class="patent-title">${patent.keywords || 'No title available'}</div>
            `;
            
            // Add click event to select patent
            listItem.addEventListener('click', function() {
                // Remove selected class from all items
                document.querySelectorAll('.patent-list-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Add selected class to clicked item
                this.classList.add('selected');
                
                // If first patent is not selected, select it
                if (!document.getElementById('compare-patent1').value) {
                    document.getElementById('compare-patent1').value = patent.patentNo;
                }
                // Otherwise select second patent
                else if (!document.getElementById('compare-patent2').value) {
                    document.getElementById('compare-patent2').value = patent.patentNo;
                }
            });
            
            patentListContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading patent list:', error);
        // Use sample data if API is not available
        sampleData.forEach(patent => {
            const listItem = document.createElement('div');
            listItem.className = 'patent-list-item';
            listItem.innerHTML = `
                <div class="patent-no">${patent.patentNo}</div>
                <div class="patent-title">${patent.keywords || 'No title available'}</div>
            `;
            
            // Add click event to select patent
            listItem.addEventListener('click', function() {
                // Remove selected class from all items
                document.querySelectorAll('.patent-list-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Add selected class to clicked item
                this.classList.add('selected');
                
                // If first patent is not selected, select it
                if (!document.getElementById('compare-patent1').value) {
                    document.getElementById('compare-patent1').value = patent.patentNo;
                }
                // Otherwise select second patent
                else if (!document.getElementById('compare-patent2').value) {
                    document.getElementById('compare-patent2').value = patent.patentNo;
                }
            });
            
            patentListContainer.appendChild(listItem);
        });
    }
} 