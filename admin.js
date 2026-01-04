// Admin Panel JavaScript

// Default credentials (în producție, ar trebui să fie pe server)
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

// Storage keys
const STORAGE_KEY_MESSAGES = 'sofimar_contact_messages';
const STORAGE_KEY_CHATBOT_MESSAGES = 'sofimar_chatbot_messages';
const STORAGE_KEY_VIDEOS = 'sofimar_tiktok_videos';
const STORAGE_KEY_CERTIFICATES = 'sofimar_certificates';
const STORAGE_KEY_LOCATIONS = 'sofimar_office_locations';
const STORAGE_KEY_AUTH = 'sofimar_admin_auth';
const STORAGE_KEY_PASSWORD = 'sofimar_admin_password';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeEventListeners();
    loadData();
});

// Authentication
function checkAuth() {
    const auth = localStorage.getItem(STORAGE_KEY_AUTH);
    if (auth === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadData();
}

function login(username, password) {
    // Verifică parola din localStorage sau folosește cea default
    const storedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD) || DEFAULT_PASSWORD;
    
    if (username === DEFAULT_USERNAME && password === storedPassword) {
        localStorage.setItem(STORAGE_KEY_AUTH, 'true');
        showDashboard();
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    showLogin();
    document.getElementById('loginForm').reset();
}

// Event Listeners
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');
            
            if (login(username, password)) {
                errorDiv.textContent = '';
                errorDiv.classList.remove('show');
            } else {
                errorDiv.textContent = 'Utilizator sau parolă incorectă!';
                errorDiv.classList.add('show');
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Clear messages button
    const clearMessagesBtn = document.getElementById('clearMessagesBtn');
    if (clearMessagesBtn) {
        clearMessagesBtn.addEventListener('click', () => {
            if (confirm('Ești sigur că vrei să ștergi toate mesajele?')) {
                clearMessages();
            }
        });
    }

    // Clear chatbot messages button
    const clearChatbotMessagesBtn = document.getElementById('clearChatbotMessagesBtn');
    if (clearChatbotMessagesBtn) {
        clearChatbotMessagesBtn.addEventListener('click', () => {
            if (confirm('Ești sigur că vrei să ștergi toate conversațiile chatbot-ului?')) {
                clearChatbotMessages();
            }
        });
    }

    // Add video button
    const addVideoBtn = document.getElementById('addVideoBtn');
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', () => {
            openVideoModal();
        });
    }

    // Add location button
    const addLocationBtn = document.getElementById('addLocationBtn');
    if (addLocationBtn) {
        addLocationBtn.addEventListener('click', () => {
            openLocationModal();
        });
    }

    // Location form
    const addLocationForm = document.getElementById('addLocationForm');
    if (addLocationForm) {
        addLocationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveLocation();
        });
    }

    // Add certificate button
    const addCertificateBtn = document.getElementById('addCertificateBtn');
    if (addCertificateBtn) {
        addCertificateBtn.addEventListener('click', () => {
            openCertificateModal();
        });
    }

    // Video form
    const addVideoForm = document.getElementById('addVideoForm');
    if (addVideoForm) {
        addVideoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const videoId = document.getElementById('videoId').value.trim();
            if (videoId) {
                addTikTokVideo(videoId);
                closeVideoModal();
            }
        });
    }

    // Certificate form
    const addCertificateForm = document.getElementById('addCertificateForm');
    if (addCertificateForm) {
        addCertificateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('certTitle').value.trim();
            const description = document.getElementById('certDescription').value.trim();
            const image = document.getElementById('certImage').value.trim();
            if (title && image) {
                addCertificate(title, description, image);
                closeCertificateModal();
            }
        });
    }

    // Modal close buttons
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(close => {
        close.addEventListener('click', () => {
            closeVideoModal();
            closeLocationModal();
            closeCertificateModal();
            closeReplyModal();
        });
    });

    // Close modal on outside click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoModal();
                closeLocationModal();
                closeCertificateModal();
                closeReplyModal();
            }
        });
    });

    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }

    // Export data button
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportMessages);
    }

    // Reply form
    const replyForm = document.getElementById('replyForm');
    if (replyForm) {
        replyForm.addEventListener('submit', sendReplyEmail);
    }

    // Initialize EmailJS when page loads
    if (typeof emailjs !== 'undefined') {
        // Initialize EmailJS - you need to set your public key
        // emailjs.init('YOUR_PUBLIC_KEY');
        console.log('EmailJS library loaded. Remember to configure with your keys.');
    }
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Load data for the tab
    if (tabName === 'messages') {
        loadMessages().catch(err => console.error('Error loading messages:', err));
    } else if (tabName === 'chatbot') {
        loadChatbotMessages().catch(err => console.error('Error loading chatbot messages:', err));
    } else if (tabName === 'locations') {
        loadLocations();
    } else if (tabName === 'tiktok') {
        loadTikTokVideos();
    } else if (tabName === 'certificates') {
        loadCertificates();
    }
}

// Load all data
async function loadData() {
    console.log('Loading all data...');
    try {
        await loadMessages();
        await loadChatbotMessages();
        loadLocations();
        loadTikTokVideos();
        loadCertificates();
        await updateStatistics();
        console.log('All data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Messages Management
async function loadMessages() {
    console.log('Loading messages...');
    const messagesList = document.getElementById('messagesList');
    
    if (!messagesList) {
        console.error('messagesList element not found!');
        return;
    }
    
    const messages = await getMessages();
    console.log('Total messages to display:', messages.length);
    
    if (messages.length === 0) {
        messagesList.innerHTML = '<p class="empty-state">Nu există mesaje.</p>';
        return;
    }

    messagesList.innerHTML = messages.map((msg, index) => {
        const date = new Date(msg.timestamp);
        const dateStr = date.toLocaleString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="message-item">
                <div class="message-header">
                    <div class="message-meta">
                        <div class="message-name">${escapeHtml(msg.name)}</div>
                        <div class="message-contact">📞 ${escapeHtml(msg.phone)} | 📧 ${escapeHtml(msg.email)}</div>
                        <div class="message-date">📅 ${dateStr}</div>
                    </div>
                    <div class="message-actions">
                        <button class="btn btn-secondary btn-reply" onclick="openReplyModal(${index})">✉️ Răspunde</button>
                        <button class="message-delete" onclick="deleteMessage(${index})">Șterge</button>
                    </div>
                </div>
                <div class="message-content">${escapeHtml(msg.message)}</div>
            </div>
        `;
    }).join('');
}

async function getMessages() {
    try {
        // Try to fetch from API server
        console.log('Fetching messages from API...');
        const response = await fetch('http://localhost:8001/api/messages');
        if (response.ok) {
            const messages = await response.json();
            console.log('Messages loaded from API:', messages.length);
            return Array.isArray(messages) ? messages : [];
        } else {
            console.warn('API response not OK:', response.status);
        }
    } catch (error) {
        console.warn('API server not available, loading from localStorage:', error);
    }
    
    // Fallback to localStorage
    console.log('Loading messages from localStorage...');
    const messages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const parsed = messages ? JSON.parse(messages) : [];
    console.log('Messages loaded from localStorage:', parsed.length);
    return parsed;
}

async function saveMessages(messages) {
    try {
        // Try to save to API server (for new messages)
        // For deletion, we use DELETE endpoint
    } catch (error) {
        console.warn('API server not available, saving to localStorage:', error);
    }
    // Always save to localStorage as backup
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
}

async function clearMessages() {
    try {
        // Try to delete from API server
        await fetch('http://localhost:8001/api/messages?all=1', {
            method: 'DELETE'
        });
    } catch (error) {
        console.warn('API server not available, clearing from localStorage:', error);
    }
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    await loadMessages();
    updateStatistics();
}

async function deleteMessage(index) {
    const messages = await getMessages();
    const messageToDelete = messages[index];
    
    if (messageToDelete && messageToDelete.id) {
        try {
            // Try to delete from API server
            await fetch(`http://localhost:8001/api/messages?id=${messageToDelete.id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.warn('API server not available, deleting from localStorage:', error);
        }
    }
    
    messages.splice(index, 1);
    await saveMessages(messages);
    await loadMessages();
    updateStatistics();
}

// Chatbot Messages Management
async function loadChatbotMessages() {
    const messages = await getChatbotMessages();
    const conversationsDiv = document.getElementById('chatbotConversations');
    
    if (!conversationsDiv) {
        console.error('chatbotConversations element not found');
        return;
    }
    
    console.log('Loading chatbot messages:', messages.length);
    
    if (messages.length === 0) {
        conversationsDiv.innerHTML = '<p class="empty-state">Nu există conversații.</p>';
        return;
    }

    // Group messages into conversations (user message + bot response)
    const conversations = [];
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].type === 'user') {
            const conversation = {
                userMessage: messages[i],
                botMessage: messages[i + 1] && messages[i + 1].type === 'bot' ? messages[i + 1] : null,
                timestamp: messages[i].timestamp
            };
            conversations.push(conversation);
            if (messages[i + 1] && messages[i + 1].type === 'bot') {
                i++; // Skip bot message as it's already included
            }
        } else if (messages[i].type === 'bot' && i === 0) {
            // Handle case where first message is a bot message (shouldn't happen, but just in case)
            continue;
        }
    }

    console.log('Grouped conversations:', conversations.length);

    if (conversations.length === 0) {
        conversationsDiv.innerHTML = '<p class="empty-state">Nu există conversații. Mesajele pot fi doar de tip bot sau nu sunt grupate corect.</p>';
        return;
    }

    // Sort by timestamp (newest first)
    conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    conversationsDiv.innerHTML = conversations.map((conv, index) => {
        const date = new Date(conv.timestamp);
        const dateStr = date.toLocaleString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="chatbot-conversation">
                <div class="conversation-header">
                    <div class="conversation-date">📅 ${dateStr}</div>
                    <button class="conversation-delete" onclick="deleteChatbotConversation(${index})">Șterge</button>
                </div>
                <div class="conversation-messages">
                    <div class="chatbot-message user">
                        <div class="message-label">👤 Utilizator:</div>
                        <div class="message-text">${escapeHtml(conv.userMessage.message)}</div>
                    </div>
                    ${conv.botMessage ? `
                    <div class="chatbot-message bot">
                        <div class="message-label">🤖 Bot:</div>
                        <div class="message-text">${escapeHtml(conv.botMessage.message)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function getChatbotMessages() {
    try {
        // Try to fetch from API server
        const response = await fetch('http://localhost:8001/api/chatbot');
        if (response.ok) {
            const messages = await response.json();
            console.log('Retrieved chatbot messages from API:', messages);
            return Array.isArray(messages) ? messages : [];
        }
    } catch (error) {
        console.warn('API server not available, loading from localStorage:', error);
    }
    
    // Fallback to localStorage
    try {
        const messages = localStorage.getItem(STORAGE_KEY_CHATBOT_MESSAGES);
        if (!messages) {
            return [];
        }
        const parsed = JSON.parse(messages);
        console.log('Retrieved chatbot messages from localStorage:', parsed);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Error loading chatbot messages:', e);
        return [];
    }
}

function saveChatbotMessages(messages) {
    localStorage.setItem(STORAGE_KEY_CHATBOT_MESSAGES, JSON.stringify(messages));
}

async function clearChatbotMessages() {
    try {
        // Try to delete from API server
        await fetch('http://localhost:8001/api/chatbot?all=1', {
            method: 'DELETE'
        });
    } catch (error) {
        console.warn('API server not available, clearing from localStorage:', error);
    }
    localStorage.removeItem(STORAGE_KEY_CHATBOT_MESSAGES);
    await loadChatbotMessages();
    updateStatistics();
}

async function deleteChatbotConversation(index) {
    const messages = await getChatbotMessages();
    const conversations = [];
    
    // Recreate conversations structure
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].type === 'user') {
            const conversation = {
                userIndex: i,
                botIndex: messages[i + 1] && messages[i + 1].type === 'bot' ? i + 1 : null
            };
            conversations.push(conversation);
            if (messages[i + 1] && messages[i + 1].type === 'bot') {
                i++;
            }
        }
    }

    // Sort by timestamp (newest first) to match display order
    const sortedConversations = conversations.map((conv, idx) => ({
        ...conv,
        timestamp: messages[conv.userIndex].timestamp
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Remove the conversation at the specified index
    const toRemove = sortedConversations[index];
    if (toRemove) {
        if (toRemove.botIndex !== null) {
            messages.splice(toRemove.botIndex, 1);
        }
        messages.splice(toRemove.userIndex, 1);
        await saveChatbotMessages(messages);
        await loadChatbotMessages();
        updateStatistics();
    }
}

// Locations Management
function loadLocations() {
    const locations = getLocations();
    const locationsList = document.getElementById('locationsList');
    
    if (!locationsList) {
        console.error('locationsList element not found!');
        return;
    }
    
    if (locations.length === 0) {
        locationsList.innerHTML = '<p class="empty-state">Nu există locații adăugate. Folosește butonul "Adaugă Locație" pentru a adăuga una nouă.</p>';
        return;
    }

    locationsList.innerHTML = locations.map((location, index) => {
        return `
            <div class="location-item">
                <div class="location-header">
                    <div>
                        <div class="location-name">📍 ${escapeHtml(location.name)}</div>
                        <div class="location-description">${escapeHtml(location.description)}</div>
                        <div class="location-details">
                            <div>📍 ${escapeHtml(location.address)}</div>
                            <div>📞 ${escapeHtml(location.phone)}</div>
                            <div>🌐 Coordonate: ${location.coordinates[0]}, ${location.coordinates[1]}</div>
                        </div>
                    </div>
                </div>
                <div class="location-actions">
                    <button class="btn btn-secondary" onclick="editLocation(${index})">Editează</button>
                    <button class="location-delete" onclick="deleteLocation(${index})">Șterge</button>
                </div>
            </div>
        `;
    }).join('');
}

function getLocations() {
    try {
        const locations = localStorage.getItem(STORAGE_KEY_LOCATIONS);
        if (!locations) {
            // Return default locations if none exist
            return getDefaultLocations();
        }
        const parsed = JSON.parse(locations);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultLocations();
    } catch (e) {
        console.error('Error loading locations:', e);
        return getDefaultLocations();
    }
}

function getDefaultLocations() {
    return [
        {
            name: 'București',
            address: 'București, România',
            phone: '021 XXX XXXX',
            coordinates: [44.4268, 26.1025],
            description: 'Sediu Central'
        },
        {
            name: 'Cluj-Napoca',
            address: 'Cluj-Napoca, România',
            phone: '0264 XXX XXX',
            coordinates: [46.7712, 23.6236],
            description: 'Punct de Lucru'
        },
        {
            name: 'Timișoara',
            address: 'Timișoara, România',
            phone: '0256 XXX XXX',
            coordinates: [45.7489, 21.2087],
            description: 'Punct de Lucru'
        },
        {
            name: 'Iași',
            address: 'Iași, România',
            phone: '0232 XXX XXX',
            coordinates: [47.1585, 27.6014],
            description: 'Punct de Lucru'
        },
        {
            name: 'Constanța',
            address: 'Constanța, România',
            phone: '0241 XXX XXX',
            coordinates: [44.1598, 28.6348],
            description: 'Punct de Lucru'
        },
        {
            name: 'Brașov',
            address: 'Brașov, România',
            phone: '0268 XXX XXX',
            coordinates: [45.6427, 25.5887],
            description: 'Punct de Lucru'
        },
        {
            name: 'Craiova',
            address: 'Craiova, România',
            phone: '0251 XXX XXX',
            coordinates: [44.3302, 23.7949],
            description: 'Punct de Lucru'
        }
    ];
}

function saveLocations(locations) {
    localStorage.setItem(STORAGE_KEY_LOCATIONS, JSON.stringify(locations));
}

let locationMap = null;
let locationMarker = null;

function openLocationModal(index = null) {
    const modal = document.getElementById('locationModal');
    const form = document.getElementById('addLocationForm');
    const title = document.getElementById('locationModalTitle');
    const editIndex = document.getElementById('locationEditIndex');
    
    // Initialize or reset map
    setTimeout(() => {
        initLocationMapPicker(index);
    }, 100);
    
    if (index !== null) {
        // Edit mode
        const locations = getLocations();
        const location = locations[index];
        title.textContent = 'Editează Locație';
        editIndex.value = index;
        document.getElementById('locationName').value = location.name;
        document.getElementById('locationDescription').value = location.description;
        document.getElementById('locationAddress').value = location.address;
        document.getElementById('locationPhone').value = location.phone;
    } else {
        // Add mode
        title.textContent = 'Adaugă Locație';
        editIndex.value = '';
        form.reset();
    }
    
    modal.classList.add('active');
}

function initLocationMapPicker(index = null) {
    const mapContainer = document.getElementById('locationMapPicker');
    if (!mapContainer || typeof L === 'undefined') {
        console.error('Map container or Leaflet not available');
        return;
    }

    // Clear existing map
    if (locationMap) {
        locationMap.remove();
        locationMap = null;
        locationMarker = null;
    }

    // Get initial coordinates
    let initialLat = 45.9432; // Center of Romania
    let initialLng = 24.9668;
    let initialZoom = 7;

    if (index !== null) {
        const locations = getLocations();
        const location = locations[index];
        if (location && location.coordinates) {
            initialLat = location.coordinates[0];
            initialLng = location.coordinates[1];
            initialZoom = 13;
        }
    }

    // Initialize map
    locationMap = L.map('locationMapPicker').setView([initialLat, initialLng], initialZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(locationMap);

    // Add marker if editing
    if (index !== null) {
        const locations = getLocations();
        const location = locations[index];
        if (location && location.coordinates) {
            locationMarker = L.marker([location.coordinates[0], location.coordinates[1]], {
                draggable: true
            }).addTo(locationMap);
            
            // Update coordinates when marker is dragged
            locationMarker.on('dragend', function(e) {
                const pos = locationMarker.getLatLng();
                updateCoordinatesFromMap(pos.lat, pos.lng);
            });
            
            updateCoordinatesFromMap(location.coordinates[0], location.coordinates[1]);
        }
    }

    // Add click handler to map
    locationMap.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Remove existing marker
        if (locationMarker) {
            locationMap.removeLayer(locationMarker);
        }
        
        // Add new marker at clicked location
        locationMarker = L.marker([lat, lng], {
            draggable: true
        }).addTo(locationMap);
        
        // Update coordinates
        updateCoordinatesFromMap(lat, lng);
        
        // Update coordinates when marker is dragged
        locationMarker.on('dragend', function(e) {
            const pos = locationMarker.getLatLng();
            updateCoordinatesFromMap(pos.lat, pos.lng);
        });
    });
}

function updateCoordinatesFromMap(lat, lng) {
    document.getElementById('locationLatitude').value = lat.toFixed(6);
    document.getElementById('locationLongitude').value = lng.toFixed(6);
}

function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    modal.classList.remove('active');
    document.getElementById('addLocationForm').reset();
    document.getElementById('locationEditIndex').value = '';
    
    // Clean up map
    if (locationMap) {
        locationMap.remove();
        locationMap = null;
        locationMarker = null;
    }
}

function saveLocation() {
    const name = document.getElementById('locationName').value.trim();
    const description = document.getElementById('locationDescription').value.trim();
    const address = document.getElementById('locationAddress').value.trim();
    const phone = document.getElementById('locationPhone').value.trim();
    const latitude = parseFloat(document.getElementById('locationLatitude').value);
    const longitude = parseFloat(document.getElementById('locationLongitude').value);
    const editIndex = document.getElementById('locationEditIndex').value;
    
    if (!name || !description || !address || !phone) {
        alert('Te rugăm să completezi toate câmpurile!');
        return;
    }
    
    if (isNaN(latitude) || isNaN(longitude)) {
        alert('Te rugăm să selectezi o locație pe hartă!');
        return;
    }
    
    const locations = getLocations();
    const newLocation = {
        name,
        description,
        address,
        phone,
        coordinates: [latitude, longitude]
    };
    
    if (editIndex !== '') {
        // Edit existing
        locations[parseInt(editIndex)] = newLocation;
    } else {
        // Add new
        locations.push(newLocation);
    }
    
    saveLocations(locations);
    loadLocations();
    closeLocationModal();
    
    // Dispatch event to update map on main page
    window.dispatchEvent(new CustomEvent('locationsUpdated'));
}

function editLocation(index) {
    openLocationModal(index);
}

function deleteLocation(index) {
    if (confirm('Ești sigur că vrei să ștergi această locație?')) {
        const locations = getLocations();
        locations.splice(index, 1);
        saveLocations(locations);
        loadLocations();
        
        // Dispatch event to update map on main page
        window.dispatchEvent(new CustomEvent('locationsUpdated'));
    }
}

// Make functions available globally
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;

// TikTok Videos Management
function loadTikTokVideos() {
    const videos = getTikTokVideos();
    const videosList = document.getElementById('videosList');
    
    if (videos.length === 0) {
        videosList.innerHTML = '<p class="empty-state">Nu există video-uri adăugate. Folosește butonul "Adaugă Video" pentru a adăuga unul nou.</p>';
        return;
    }

    videosList.innerHTML = videos.map((videoId, index) => {
        return `
            <div class="video-item">
                <div class="video-id">${escapeHtml(videoId)}</div>
                <button class="video-delete" onclick="deleteTikTokVideo(${index})">Șterge</button>
            </div>
        `;
    }).join('');
}

function getTikTokVideos() {
    // Încearcă să încarce din localStorage, altfel folosește cele din script.js
    const videos = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (videos) {
        return JSON.parse(videos);
    }
    // Dacă nu există în localStorage, folosește cele default
    return ['7567003645250702614', '7564125179761167638', '7556587113244937475'];
}

function saveTikTokVideos(videos) {
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));
}

function addTikTokVideo(videoId) {
    const videos = getTikTokVideos();
    if (!videos.includes(videoId)) {
        videos.push(videoId);
        saveTikTokVideos(videos);
        loadTikTokVideos();
        updateStatistics();
    } else {
        alert('Acest video este deja adăugat!');
    }
}

function deleteTikTokVideo(index) {
    if (confirm('Ești sigur că vrei să ștergi acest video?')) {
        const videos = getTikTokVideos();
        videos.splice(index, 1);
        saveTikTokVideos(videos);
        loadTikTokVideos();
        updateStatistics();
    }
}

// Certificates Management
function loadCertificates() {
    const certificates = getCertificates();
    const certificatesList = document.getElementById('certificatesList');
    
    if (certificates.length === 0) {
        certificatesList.innerHTML = '<p class="empty-state">Nu există certificate adăugate. Folosește butonul "Adaugă Certificat" pentru a adăuga unul nou.</p>';
        return;
    }

    certificatesList.innerHTML = certificates.map((cert, index) => {
        return `
            <div class="certificate-item">
                <div class="certificate-item-header">
                    <div>
                        <div class="certificate-title">${escapeHtml(cert.title)}</div>
                        ${cert.description ? `<div class="certificate-description">${escapeHtml(cert.description)}</div>` : ''}
                        <div class="certificate-image-url">📷 ${escapeHtml(cert.image)}</div>
                    </div>
                </div>
                <div class="certificate-actions">
                    <button class="certificate-delete" onclick="deleteCertificate(${index})">Șterge</button>
                </div>
            </div>
        `;
    }).join('');
}

function getCertificates() {
    const certificates = localStorage.getItem(STORAGE_KEY_CERTIFICATES);
    return certificates ? JSON.parse(certificates) : [];
}

function saveCertificates(certificates) {
    localStorage.setItem(STORAGE_KEY_CERTIFICATES, JSON.stringify(certificates));
}

function addCertificate(title, description, image) {
    const certificates = getCertificates();
    certificates.push({ title, description, image });
    saveCertificates(certificates);
    loadCertificates();
    updateStatistics();
}

function deleteCertificate(index) {
    if (confirm('Ești sigur că vrei să ștergi acest certificat?')) {
        const certificates = getCertificates();
        certificates.splice(index, 1);
        saveCertificates(certificates);
        loadCertificates();
        updateStatistics();
    }
}

// Statistics
async function updateStatistics() {
    const messages = await getMessages();
    const chatbotMessages = await getChatbotMessages();
    const videos = getTikTokVideos();
    const certificates = getCertificates();
    
    // Count today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = messages.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        msgDate.setHours(0, 0, 0, 0);
        return msgDate.getTime() === today.getTime();
    }).length;

    // Count chatbot conversations (user messages)
    const chatbotConversations = chatbotMessages.filter(msg => msg.type === 'user').length;

    document.getElementById('totalMessages').textContent = messages.length;
    document.getElementById('totalVideos').textContent = videos.length;
    document.getElementById('totalCertificates').textContent = certificates.length;
    document.getElementById('todayMessages').textContent = todayMessages;
    document.getElementById('totalChatbotMessages').textContent = chatbotConversations;
}

// Modals
function openVideoModal() {
    document.getElementById('videoModal').classList.add('active');
    document.getElementById('videoId').value = '';
    document.getElementById('videoId').focus();
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.remove('active');
    document.getElementById('addVideoForm').reset();
}

function openCertificateModal() {
    document.getElementById('certificateModal').classList.add('active');
    document.getElementById('certTitle').value = '';
    document.getElementById('certDescription').value = '';
    document.getElementById('certImage').value = '';
    document.getElementById('certTitle').focus();
}

function closeCertificateModal() {
    document.getElementById('certificateModal').classList.remove('active');
    document.getElementById('addCertificateForm').reset();
}

// Change Password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');
    const successDiv = document.getElementById('passwordSuccess');

    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');

    const storedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD) || DEFAULT_PASSWORD;

    if (currentPassword !== storedPassword) {
        errorDiv.textContent = 'Parola curentă este incorectă!';
        errorDiv.classList.add('show');
        return;
    }

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Parolele nu se potrivesc!';
        errorDiv.classList.add('show');
        return;
    }

    if (newPassword.length < 6) {
        errorDiv.textContent = 'Parola trebuie să aibă minim 6 caractere!';
        errorDiv.classList.add('show');
        return;
    }

    localStorage.setItem(STORAGE_KEY_PASSWORD, newPassword);
    successDiv.textContent = 'Parola a fost schimbată cu succes!';
    successDiv.classList.add('show');
    
    document.getElementById('changePasswordForm').reset();
    
    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 3000);
}

// Export Messages
async function exportMessages() {
    const messages = await getMessages();
    const dataStr = JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sofimar-messages-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Reply to Message Functions
async function openReplyModal(index) {
    const messages = await getMessages();
    const message = messages[index];
    
    if (!message) {
        alert('Mesajul nu a fost găsit!');
        return;
    }
    
    const modal = document.getElementById('replyModal');
    const infoDiv = document.getElementById('replyMessageInfo');
    const replyToEmail = document.getElementById('replyToEmail');
    const replyToName = document.getElementById('replyToName');
    const replySubject = document.getElementById('replySubject');
    const replyMessage = document.getElementById('replyMessage');
    
    // Populate message info
    const date = new Date(message.timestamp);
    const dateStr = date.toLocaleString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    infoDiv.innerHTML = `
        <div class="reply-info-card">
            <h4>Mesaj de la: ${escapeHtml(message.name)}</h4>
            <p><strong>Email:</strong> ${escapeHtml(message.email)}</p>
            <p><strong>Telefon:</strong> ${escapeHtml(message.phone)}</p>
            <p><strong>Data:</strong> ${dateStr}</p>
            <div class="original-message">
                <strong>Mesaj original:</strong>
                <p>${escapeHtml(message.message)}</p>
            </div>
        </div>
    `;
    
    // Set hidden fields
    replyToEmail.value = message.email;
    replyToName.value = message.name;
    
    // Set default subject
    replySubject.value = `Răspuns la mesajul dumneavoastră - Sofimar SERV`;
    
    // Clear previous message
    replyMessage.value = '';
    
    // Clear errors/success
    document.getElementById('replyError').classList.remove('show');
    document.getElementById('replySuccess').classList.remove('show');
    
    modal.classList.add('active');
}

function closeReplyModal() {
    const modal = document.getElementById('replyModal');
    modal.classList.remove('active');
    document.getElementById('replyForm').reset();
    document.getElementById('replyError').classList.remove('show');
    document.getElementById('replySuccess').classList.remove('show');
}

// Initialize EmailJS (you'll need to set your public key)
function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        // Initialize EmailJS with your public key
        // Get this from https://www.emailjs.com/
        emailjs.init('YOUR_PUBLIC_KEY'); // Replace with your EmailJS public key
        console.log('EmailJS initialized');
    } else {
        console.warn('EmailJS not loaded');
    }
}

// Send reply email
async function sendReplyEmail(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('replyError');
    const successDiv = document.getElementById('replySuccess');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    const toEmail = document.getElementById('replyToEmail').value;
    const toName = document.getElementById('replyToName').value;
    const subject = document.getElementById('replySubject').value;
    const message = document.getElementById('replyMessage').value;
    
    if (!toEmail || !subject || !message) {
        errorDiv.textContent = 'Te rugăm să completezi toate câmpurile!';
        errorDiv.classList.add('show');
        return;
    }
    
    // Disable submit button
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Se trimite...';
    
    try {
        console.log('Sending email to:', toEmail);
        // Send email via API server
        const response = await fetch('http://localhost:8001/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to_email: toEmail,
                to_name: toName,
                subject: subject,
                message: message,
                from_name: 'Sofimar SERV',
                reply_to: 'contact@sofimarserv.ro'
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Email send result:', result);
        
        if (result.success) {
            successDiv.textContent = 'Email trimis cu succes!';
            successDiv.classList.add('show');
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeReplyModal();
            }, 2000);
        } else {
            throw new Error(result.error || 'Failed to send email');
        }
    } catch (error) {
        console.error('Error sending email:', error);
        let errorMessage = `Eroare: ${error.message}`;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += '. Verifică dacă API server-ul rulează pe portul 8001.';
        } else {
            errorMessage += '. Verifică dacă API server-ul rulează și dacă Yahoo Mail este configurat.';
        }
        errorDiv.textContent = errorMessage;
        errorDiv.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Make functions available globally for onclick handlers
window.deleteMessage = deleteMessage;
window.openReplyModal = openReplyModal;
window.closeReplyModal = closeReplyModal;
window.deleteChatbotConversation = deleteChatbotConversation;
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;
window.deleteTikTokVideo = deleteTikTokVideo;
window.deleteCertificate = deleteCertificate;

// Intercept contact form submissions (if on same domain)
// This would need to be added to script.js to save messages
if (typeof Storage !== 'undefined') {
    // Listen for storage events to update admin panel if open
    window.addEventListener('storage', (e) => {
        if (document.getElementById('adminDashboard') && 
            document.getElementById('adminDashboard').style.display !== 'none') {
            if (e.key === STORAGE_KEY_MESSAGES) {
                loadMessages();
                updateStatistics();
            } else if (e.key === STORAGE_KEY_CHATBOT_MESSAGES) {
                loadChatbotMessages();
                updateStatistics();
            }
        }
    });

    // Also listen for custom events (for same-window updates)
    window.addEventListener('chatbotMessageAdded', () => {
        if (document.getElementById('adminDashboard') && 
            document.getElementById('adminDashboard').style.display !== 'none') {
        // Check if chatbot tab is active
        const chatbotTab = document.getElementById('chatbotTab');
        if (chatbotTab && chatbotTab.classList.contains('active')) {
            loadChatbotMessages();
        }
        updateStatistics();
        
        // Check if messages tab is active
        const messagesTab = document.getElementById('messagesTab');
        if (messagesTab && messagesTab.classList.contains('active')) {
            loadMessages();
        }
        }
    });
}

// Add periodic refresh for messages when tabs are active
setInterval(() => {
    if (document.getElementById('adminDashboard') && 
        document.getElementById('adminDashboard').style.display !== 'none') {
        const chatbotTab = document.getElementById('chatbotTab');
        if (chatbotTab && chatbotTab.classList.contains('active')) {
            loadChatbotMessages();
            updateStatistics();
        }
        
        const messagesTab = document.getElementById('messagesTab');
        if (messagesTab && messagesTab.classList.contains('active')) {
            loadMessages();
            updateStatistics();
        }
    }
}, 2000); // Refresh every 2 seconds when tabs are active

