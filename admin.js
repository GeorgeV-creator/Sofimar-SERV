// Admin Panel JavaScript

// API Base URL - use current hostname instead of localhost for mobile access
const API_BASE_URL = `http://${window.location.hostname}:8001`;

// Default credentials (în producție, ar trebui să fie pe server)
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

// Storage keys
const STORAGE_KEY_MESSAGES = 'sofimar_contact_messages';
const STORAGE_KEY_CHATBOT_MESSAGES = 'sofimar_chatbot_messages';
const STORAGE_KEY_VIDEOS = 'sofimar_tiktok_videos';
const STORAGE_KEY_CERTIFICATES = 'sofimar_certificates';
const STORAGE_KEY_PARTNERS = 'sofimar_partners';
const STORAGE_KEY_VISITS = 'sofimar_page_visits';
const STORAGE_KEY_LOCATIONS = 'sofimar_office_locations';
const STORAGE_KEY_AUTH = 'sofimar_admin_auth';
const STORAGE_KEY_PASSWORD = 'sofimar_admin_password';
const STORAGE_KEY_SITE_TEXTS = 'sofimar_site_texts';

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

    // Add partner button
    const addPartnerBtn = document.getElementById('addPartnerBtn');
    if (addPartnerBtn) {
        addPartnerBtn.addEventListener('click', () => {
            openPartnerModal();
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
        addCertificateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('certTitle').value.trim();
            const description = document.getElementById('certDescription').value.trim();
            
            const imageSource = document.querySelector('input[name="imageSource"]:checked').value;
            let image = '';
            
            if (imageSource === 'upload') {
                const fileInput = document.getElementById('certImageFile');
                if (fileInput.files && fileInput.files[0]) {
                    image = await convertImageToBase64(fileInput.files[0]);
                } else {
                    alert('Te rugăm să selectezi o imagine!');
                    return;
                }
            } else {
                image = document.getElementById('certImageUrl').value.trim();
                if (!image) {
                    alert('Te rugăm să introduci un URL pentru imagine!');
                    return;
                }
            }
            
            if (title && image) {
                addCertificate(title, description, image);
                closeCertificateModal();
            }
        });
        
        // Toggle between upload and URL options for certificates
        const imageSourceRadios = document.querySelectorAll('input[name="imageSource"]');
        imageSourceRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const uploadSection = document.getElementById('uploadImageSection');
                const urlSection = document.getElementById('urlImageSection');
                const fileInput = document.getElementById('certImageFile');
                const urlInput = document.getElementById('certImageUrl');
                
                if (radio.value === 'upload') {
                    uploadSection.style.display = 'block';
                    urlSection.style.display = 'none';
                    fileInput.required = true;
                    urlInput.required = false;
                } else {
                    uploadSection.style.display = 'none';
                    urlSection.style.display = 'block';
                    fileInput.required = false;
                    urlInput.required = true;
                }
            });
        });
        
        // Image preview on file selection
        const fileInput = document.getElementById('certImageFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Imaginea este prea mare! Maxim 5MB.');
                        e.target.value = '';
                        return;
                    }
                    previewImage(file);
                }
            });
        }
    }

    // Modal close buttons
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(close => {
        close.addEventListener('click', () => {
            closeVideoModal();
            closeLocationModal();
            closeCertificateModal();
            closePartnerModal();
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
                closePartnerModal();
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

    // Partner form
    const addPartnerForm = document.getElementById('addPartnerForm');
    if (addPartnerForm) {
        console.log('✅ Partner form found, adding event listener');
        addPartnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Partner form submitted');
            
            const title = document.getElementById('partnerTitle').value.trim() || 'Partner';
            console.log('📝 Partner title:', title);
            
            const imageSource = document.querySelector('input[name="partnerImageSource"]:checked');
            if (!imageSource) {
                alert('Te rugăm să selectezi o sursă pentru imagine!');
                return;
            }
            
            const sourceValue = imageSource.value;
            console.log('📝 Image source:', sourceValue);
            let image = '';
            
            if (sourceValue === 'upload') {
                const fileInput = document.getElementById('partnerImageFile');
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    console.log('📝 Converting image to base64...');
                    image = await convertImageToBase64(fileInput.files[0]);
                    console.log('✅ Image converted, length:', image.length);
                } else {
                    alert('Te rugăm să selectezi o imagine!');
                    return;
                }
            } else {
                const urlInput = document.getElementById('partnerImageUrl');
                if (urlInput) {
                    image = urlInput.value.trim();
                    console.log('📝 Image URL:', image);
                }
                if (!image) {
                    alert('Te rugăm să introduci un URL pentru imagine!');
                    return;
                }
            }
            
            if (image) {
                console.log('📝 Calling addPartner with title:', title, 'and image length:', image.length);
                await addPartner(title, image);
                console.log('✅ addPartner completed');
                closePartnerModal();
            } else {
                console.error('❌ No image provided');
                alert('Eroare: Nu s-a putut obține imaginea!');
            }
        });
        
        // Toggle between upload and URL options for partners
        const partnerImageSourceRadios = document.querySelectorAll('input[name="partnerImageSource"]');
        partnerImageSourceRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const uploadSection = document.getElementById('uploadPartnerImageSection');
                const urlSection = document.getElementById('urlPartnerImageSection');
                const fileInput = document.getElementById('partnerImageFile');
                const urlInput = document.getElementById('partnerImageUrl');
                
                if (radio.value === 'upload') {
                    uploadSection.style.display = 'block';
                    urlSection.style.display = 'none';
                    fileInput.required = true;
                    urlInput.required = false;
                } else {
                    uploadSection.style.display = 'none';
                    urlSection.style.display = 'block';
                    fileInput.required = false;
                    urlInput.required = true;
                }
            });
        });
        
        // Preview partner image
        const partnerImageFile = document.getElementById('partnerImageFile');
        if (partnerImageFile) {
            partnerImageFile.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Imaginea este prea mare! Maxim 5MB.');
                        e.target.value = '';
                        return;
                    }
                    previewPartnerImage(file);
                }
            });
        }
    }

    // Site texts form
    const siteTextsForm = document.getElementById('siteTextsForm');
    if (siteTextsForm) {
        siteTextsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted!');
            saveSiteTexts();
        });
        // Load existing texts when settings tab is opened
        // Don't load immediately, wait for tab to be opened
    }

    // Add click handlers to stat cards
    const statCards = document.querySelectorAll('.stat-card[data-tab]');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const tabName = card.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
                // Scroll to tabs section
                const tabsContainer = document.querySelector('.tabs-container');
                if (tabsContainer) {
                    tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
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
    } else if (tabName === 'partners') {
        loadPartners();
    } else if (tabName === 'settings') {
        console.log('Settings tab opened, loading texts...');
        // Wait a bit for the form to be rendered
        setTimeout(() => {
            loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
        }, 100);
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
        await loadCertificates();
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
        const response = await fetch(`${API_BASE_URL}/api/messages`);
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
        await fetch(`${API_BASE_URL}/api/messages?all=1`, {
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
            await fetch(`${API_BASE_URL}/api/messages?id=${messageToDelete.id}`, {
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
        const response = await fetch(`${API_BASE_URL}/api/chatbot`);
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
        await fetch(`${API_BASE_URL}/api/chatbot?all=1`, {
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
async function loadCertificates() {
    const certificates = await getCertificates();
    // Try both IDs - certificatesGrid (new) and certificatesList (old)
    const certificatesList = document.getElementById('certificatesGrid') || document.getElementById('certificatesList');
    
    if (!certificatesList) {
        console.error('certificatesGrid or certificatesList element not found');
        return;
    }
    
    if (certificates.length === 0) {
        certificatesList.innerHTML = '<p class="empty-state">Nu există certificate adăugate. Folosește butonul "Adaugă Certificat" pentru a adăuga unul nou.</p>';
        return;
    }

    certificatesList.innerHTML = certificates.map((cert, index) => {
        const certId = cert.id || `temp-${index}`;
        const isBase64 = cert.image && cert.image.startsWith('data:image');
        const imageSrc = cert.image || '';
        
        return `
            <div class="certificate-item-admin">
                <div class="certificate-image-wrapper-admin">
                    ${isBase64 
                        ? `<img src="${imageSrc}" alt="${escapeHtml(cert.title || 'Certificat')}" class="certificate-thumbnail">`
                        : imageSrc 
                            ? `<img src="${imageSrc}" alt="${escapeHtml(cert.title || 'Certificat')}" class="certificate-thumbnail" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'300\\' height=\\'200\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3E📷 Imagine%3C/text%3E%3C/svg%3E'">`
                            : `<div class="certificate-no-image">📷 Fără imagine</div>`
                    }
                </div>
                <div class="certificate-info-admin">
                    <div class="certificate-title-admin">${escapeHtml(cert.title || 'Certificat fără titlu')}</div>
                    ${cert.description ? `<div class="certificate-description-admin">${escapeHtml(cert.description)}</div>` : ''}
                    <button class="btn-certificate-delete" onclick="deleteCertificate('${certId}', ${index})" title="Șterge certificat">
                        🗑️ Șterge
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function getCertificates() {
    try {
        // Try to fetch from API server
        const response = await fetch(`${API_BASE_URL}/api/certificates`);
        if (response.ok) {
            const certificates = await response.json();
            console.log('Retrieved certificates from API:', certificates.length);
            return Array.isArray(certificates) ? certificates : [];
        }
    } catch (error) {
        console.warn('API server not available, loading from localStorage:', error);
    }
    
    // Fallback to localStorage
    try {
        const certificates = localStorage.getItem(STORAGE_KEY_CERTIFICATES);
        if (!certificates) {
            return [];
        }
        const parsed = JSON.parse(certificates);
        // Ensure we always return an array
        if (!Array.isArray(parsed)) {
            console.error('Certificates data is not an array, resetting to empty array');
            return [];
        }
        return parsed;
    } catch (e) {
        console.error('Error loading certificates:', e);
        return [];
    }
}

function saveCertificates(certificates) {
    localStorage.setItem(STORAGE_KEY_CERTIFICATES, JSON.stringify(certificates));
}

async function addCertificate(title, description, image) {
    // Create new certificate object
    const newCertificate = { title, description, image };
    console.log('Adding new certificate:', newCertificate);
    
    try {
        // Try to save to API server
        const response = await fetch(`${API_BASE_URL}/api/certificates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCertificate)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Certificate saved to API:', result);
        } else {
            throw new Error('API save failed');
        }
    } catch (error) {
        // Fallback to localStorage
        console.warn('API server not available, saving to localStorage:', error);
        let certificates = await getCertificates();
        
        // Ensure certificates is an array
        if (!Array.isArray(certificates)) {
            console.warn('Certificates is not an array, initializing new array');
            certificates = [];
        }
        
        // Add to array
        certificates.push(newCertificate);
        saveCertificates(certificates);
    }
    
    // Reload display
    await loadCertificates();
    updateStatistics();
    
    // Dispatch event to update certificate page if open
    window.dispatchEvent(new CustomEvent('certificatesUpdated'));
}

async function deleteCertificate(certId, index) {
    if (!confirm('Ești sigur că vrei să ștergi acest certificat?')) {
        return;
    }
    
    const certificates = await getCertificates();
    
    // Try to delete from API server if ID exists
    if (certId && !certId.startsWith('temp-')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/certificates?id=${certId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                console.log('Certificate deleted from API');
            }
        } catch (error) {
            console.warn('API server not available, deleting from localStorage:', error);
        }
    }
    
    // Also delete from localStorage
    if (index >= 0 && index < certificates.length) {
        certificates.splice(index, 1);
        saveCertificates(certificates);
    } else {
        // Fallback: delete by ID if index fails
        const filtered = certificates.filter(cert => cert.id !== certId);
        if (filtered.length < certificates.length) {
            saveCertificates(filtered);
        }
    }
    
    await loadCertificates();
    updateStatistics();
    
    // Dispatch event to update certificate page if open
    window.dispatchEvent(new CustomEvent('certificatesUpdated'));
}

// Partners Management
async function loadPartners() {
    const partners = await getPartners();
    const partnersGrid = document.getElementById('partnersGrid');
    
    if (!partnersGrid) {
        console.error('partnersGrid element not found');
        return;
    }
    
    if (partners.length === 0) {
        partnersGrid.innerHTML = '<p class="empty-state">Nu există parteneri adăugați. Folosește butonul "Adaugă Partner" pentru a adăuga unul nou.</p>';
        return;
    }

    partnersGrid.innerHTML = partners.map((partner, index) => {
        const partnerId = partner.id || `temp-${index}`;
        const isBase64 = partner.image && partner.image.startsWith('data:image');
        const imageSrc = partner.image || '';
        const title = partner.title || 'Partner';
        
        return `
            <div class="partner-item-admin">
                <div class="partner-image-wrapper-admin">
                    ${isBase64 
                        ? `<img src="${imageSrc}" alt="${escapeHtml(title)}" class="partner-thumbnail">`
                        : imageSrc 
                            ? `<img src="${imageSrc}" alt="${escapeHtml(title)}" class="partner-thumbnail" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'150\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'200\\' height=\\'150\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3E📷 Imagine%3C/text%3E%3C/svg%3E'">`
                            : `<div class="partner-no-image">📷 Fără imagine</div>`
                    }
                </div>
                <div class="partner-info-admin">
                    <div class="partner-title-admin">${escapeHtml(title)}</div>
                    <button class="btn-partner-delete" onclick="deletePartner('${partnerId}', ${index})" title="Șterge partner">
                        🗑️ Șterge
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function getPartners() {
    try {
        // Try to fetch from API server
        const response = await fetch(`${API_BASE_URL}/api/partners`);
        if (response.ok) {
            const partners = await response.json();
            console.log('Retrieved partners from API:', partners);
            // Check if response has error
            if (partners && partners.error) {
                console.warn('⚠️ API returned error, using localStorage fallback');
                throw new Error('API returned error');
            }
            // Ensure it's an array
            if (Array.isArray(partners)) {
                console.log('✅ Partners from API:', partners.length);
                return partners;
            } else {
                console.warn('⚠️ Partners from API is not an array, using localStorage');
                throw new Error('Partners is not an array');
            }
        } else {
            throw new Error('API response not OK: ' + response.status);
        }
    } catch (error) {
        console.warn('⚠️ API server not available, loading from localStorage:', error);
    }
    
    // Fallback to localStorage
    try {
        const partners = localStorage.getItem(STORAGE_KEY_PARTNERS);
        if (!partners) {
            console.log('📦 No partners in localStorage');
            return [];
        }
        const parsed = JSON.parse(partners);
        if (!Array.isArray(parsed)) {
            console.error('❌ Partners data is not an array, resetting to empty array');
            return [];
        }
        console.log('📦 Partners from localStorage:', parsed.length);
        return parsed;
    } catch (e) {
        console.error('❌ Error loading partners:', e);
        return [];
    }
}

function savePartners(partners) {
    localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
}

async function addPartner(title, image) {
    // Create new partner object
    const newPartner = { title, image };
    console.log('🔄 Adding new partner:', { title, imageLength: image ? image.length : 0 });
    
    try {
        // Try to save to API server
        console.log('📡 Attempting to save partner to API...');
        const response = await fetch(`${API_BASE_URL}/api/partners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPartner)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Partner saved to API:', result);
            // Check if result has error
            if (result && result.error) {
                console.warn('⚠️ API returned error, using localStorage fallback');
                throw new Error('API returned error: ' + result.error);
            }
            // Update the partner with the ID from API
            if (result && result.id) {
                newPartner.id = result.id;
            }
        } else {
            const errorText = await response.text();
            console.error('❌ API save failed:', response.status, errorText);
            throw new Error('API save failed: ' + response.status);
        }
    } catch (error) {
        // Fallback to localStorage
        console.warn('⚠️ API server not available, saving to localStorage:', error);
        let partners = await getPartners();
        
        if (!Array.isArray(partners)) {
            console.warn('⚠️ Partners is not an array, initializing new array');
            partners = [];
        }
        
        // Add timestamp and ID for localStorage
        newPartner.timestamp = new Date().toISOString();
        newPartner.id = new Date().getTime().toString();
        
        partners.push(newPartner);
        savePartners(partners);
        console.log('✅ Partner saved to localStorage, total partners:', partners.length);
    }
    
    // Reload display
    console.log('🔄 Reloading partners display...');
    await loadPartners();
    updateStatistics();
    
    // Dispatch event to update partners section if open
    window.dispatchEvent(new CustomEvent('partnersUpdated'));
    console.log('✅ Partner added successfully!');
}

async function deletePartner(partnerId, index) {
    if (!confirm('Ești sigur că vrei să ștergi acest partner?')) {
        return;
    }
    
    const partners = await getPartners();
    
    // Try to delete from API server if ID exists
    if (partnerId && !partnerId.startsWith('temp-')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/partners?id=${partnerId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                console.log('Partner deleted from API');
            }
        } catch (error) {
            console.warn('API server not available, deleting from localStorage:', error);
        }
    }
    
    // Also delete from localStorage
    if (index >= 0 && index < partners.length) {
        partners.splice(index, 1);
        savePartners(partners);
    } else {
        // Fallback: delete by ID if index fails
        const filtered = partners.filter(partner => partner.id !== partnerId);
        if (filtered.length < partners.length) {
            savePartners(filtered);
        }
    }
    
    await loadPartners();
    updateStatistics();
    
    // Dispatch event to update partners section if open
    window.dispatchEvent(new CustomEvent('partnersUpdated'));
}

function openPartnerModal() {
    document.getElementById('partnerModal').classList.add('active');
    document.getElementById('partnerTitle').value = '';
    document.getElementById('partnerImageFile').value = '';
    document.getElementById('partnerImageUrl').value = '';
    
    // Reset to upload option
    document.querySelector('input[name="partnerImageSource"][value="upload"]').checked = true;
    document.getElementById('uploadPartnerImageSection').style.display = 'block';
    document.getElementById('urlPartnerImageSection').style.display = 'none';
    document.getElementById('partnerImagePreview').innerHTML = '';
    
    document.getElementById('partnerTitle').focus();
}

function closePartnerModal() {
    document.getElementById('partnerModal').classList.remove('active');
    document.getElementById('addPartnerForm').reset();
    document.getElementById('partnerImagePreview').innerHTML = '';
}

// Statistics
async function updateStatistics() {
    const messages = await getMessages();
    const chatbotMessages = await getChatbotMessages();
    const videos = getTikTokVideos();
    const certificates = await getCertificates();
    const partners = await getPartners();
    
    // Count chatbot conversations (user messages)
    const chatbotConversations = chatbotMessages.filter(msg => msg.type === 'user').length;
    
    // Count locations
    const locations = getLocations();
    const totalLocations = locations.length;

    document.getElementById('totalMessages').textContent = messages.length;
    document.getElementById('totalVideos').textContent = videos.length;
    document.getElementById('totalCertificates').textContent = certificates.length;
    document.getElementById('totalChatbotMessages').textContent = chatbotConversations;
    
    // Update locations count if element exists
    const totalLocationsEl = document.getElementById('totalLocations');
    if (totalLocationsEl) {
        totalLocationsEl.textContent = totalLocations;
    }
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
    document.getElementById('certImageFile').value = '';
    document.getElementById('certImageUrl').value = '';
    
    // Reset to upload option
    document.querySelector('input[name="imageSource"][value="upload"]').checked = true;
    document.getElementById('uploadImageSection').style.display = 'block';
    document.getElementById('urlImageSection').style.display = 'none';
    document.getElementById('imagePreview').innerHTML = '';
    
    document.getElementById('certTitle').focus();
}

function closeCertificateModal() {
    document.getElementById('certificateModal').classList.remove('active');
    document.getElementById('addCertificateForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
}

// Convert image file to base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Preview uploaded image
function previewImage(file) {
    const reader = new FileReader();
    const previewDiv = document.getElementById('imagePreview');
    
    reader.onload = (e) => {
        previewDiv.innerHTML = `
            <div class="preview-image-container">
                <img src="${e.target.result}" alt="Preview">
                <p class="preview-info">${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>
            </div>
        `;
    };
    
    reader.readAsDataURL(file);
}

// Preview uploaded partner image
function previewPartnerImage(file) {
    const reader = new FileReader();
    const previewDiv = document.getElementById('partnerImagePreview');
    
    reader.onload = (e) => {
        previewDiv.innerHTML = `
            <div class="preview-image-container">
                <img src="${e.target.result}" alt="Preview">
                <p class="preview-info">${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>
            </div>
        `;
    };
    
    reader.readAsDataURL(file);
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

// Site Texts Management
async function getSiteTexts() {
    console.log('🔍 getSiteTexts() called');
    
    try {
        // Try to fetch from API server
        const response = await fetch(`${API_BASE_URL}/api/site-texts`);
        if (response.ok) {
            const texts = await response.json();
            console.log('📡 Got texts from API:', texts);
            
            // Check if API returned an error object
            if (texts && texts.error) {
                console.warn('⚠️ API returned error:', texts.error);
                // Don't return error object, continue to localStorage
            } else if (texts && Object.keys(texts).length > 0) {
                console.log('✅ Returning texts from API, keys:', Object.keys(texts).length);
                return texts;
            } else {
                console.warn('⚠️ API returned empty texts object');
            }
        } else {
            console.warn('⚠️ API response not OK, status:', response.status);
        }
    } catch (error) {
        console.warn('⚠️ API server not available, loading from localStorage:', error.message);
    }
    
    // Fallback to localStorage
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SITE_TEXTS);
        console.log('💾 localStorage value:', stored ? 'exists (' + stored.length + ' chars)' : 'null');
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('📦 Parsed localStorage:', parsed);
            
            // Check if parsed result has error
            if (parsed && parsed.error) {
                console.warn('⚠️ localStorage contains error object, ignoring');
            } else if (parsed && Object.keys(parsed).length > 0) {
                console.log('✅ Returning texts from localStorage, keys:', Object.keys(parsed).length);
                return parsed;
            } else {
                console.warn('⚠️ Parsed localStorage is empty');
            }
        } else {
            console.warn('⚠️ No data in localStorage');
        }
    } catch (e) {
        console.error('❌ Error loading site texts from localStorage:', e);
    }
    
    // Return empty object - no defaults
    console.log('⚠️ Returning empty object - no texts found');
    return {};
}

function saveSiteTexts() {
    const texts = {
        heroTitle: document.getElementById('heroTitle') ? document.getElementById('heroTitle').value.trim() : '',
        heroSubtitle: document.getElementById('heroSubtitle') ? document.getElementById('heroSubtitle').value.trim() : '',
        heroDescription: document.getElementById('heroDescription') ? document.getElementById('heroDescription').value.trim() : '',
        heroButtonText: document.getElementById('heroButtonText') ? document.getElementById('heroButtonText').value.trim() : '',
        servicesTitle: document.getElementById('servicesTitle') ? document.getElementById('servicesTitle').value.trim() : '',
        servicesSubtitle: document.getElementById('servicesSubtitle') ? document.getElementById('servicesSubtitle').value.trim() : '',
        service1Title: document.getElementById('service1Title') ? document.getElementById('service1Title').value.trim() : '',
        service1Subtitle: document.getElementById('service1Subtitle') ? document.getElementById('service1Subtitle').value.trim() : '',
        service1Description: document.getElementById('service1Description') ? document.getElementById('service1Description').value.trim() : '',
        service2Title: document.getElementById('service2Title') ? document.getElementById('service2Title').value.trim() : '',
        service2Subtitle: document.getElementById('service2Subtitle') ? document.getElementById('service2Subtitle').value.trim() : '',
        service2Description: document.getElementById('service2Description') ? document.getElementById('service2Description').value.trim() : '',
        service3Title: document.getElementById('service3Title') ? document.getElementById('service3Title').value.trim() : '',
        service3Subtitle: document.getElementById('service3Subtitle') ? document.getElementById('service3Subtitle').value.trim() : '',
        service3Description: document.getElementById('service3Description') ? document.getElementById('service3Description').value.trim() : '',
        guaranteeTitle: document.getElementById('guaranteeTitle') ? document.getElementById('guaranteeTitle').value.trim() : '',
        guarantee1Title: document.getElementById('guarantee1Title') ? document.getElementById('guarantee1Title').value.trim() : '',
        guarantee1Description: document.getElementById('guarantee1Description') ? document.getElementById('guarantee1Description').value.trim() : '',
        guarantee2Title: document.getElementById('guarantee2Title') ? document.getElementById('guarantee2Title').value.trim() : '',
        guarantee2Description: document.getElementById('guarantee2Description') ? document.getElementById('guarantee2Description').value.trim() : '',
        guarantee3Title: document.getElementById('guarantee3Title') ? document.getElementById('guarantee3Title').value.trim() : '',
        guarantee3Description: document.getElementById('guarantee3Description') ? document.getElementById('guarantee3Description').value.trim() : ''
    };
    
    console.log('Saving texts:', texts);
    
    // Validate that we have some texts
    if (!texts || Object.keys(texts).length === 0) {
        console.error('No texts to save!');
        alert('Eroare: Nu există texte de salvat. Te rugăm să verifici formularul.');
        return;
    }
    
    // Save to localStorage first (immediate)
    try {
        const textsJson = JSON.stringify(texts);
        localStorage.setItem(STORAGE_KEY_SITE_TEXTS, textsJson);
        console.log('Texts saved to localStorage successfully, length:', textsJson.length);
        
        // Verify it was saved
        const verify = localStorage.getItem(STORAGE_KEY_SITE_TEXTS);
        if (verify) {
            console.log('Verified: Texts are in localStorage');
        } else {
            console.error('ERROR: Texts were NOT saved to localStorage!');
        }
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        alert('Eroare la salvarea în localStorage: ' + e.message);
        return;
    }
    
    // Save to API
    fetch(`${API_BASE_URL}/api/site-texts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(texts)
    }).then(response => {
        if (response.ok) {
            console.log('Site texts saved to API');
            return response.json();
        } else {
            throw new Error('API response not OK');
        }
    }).catch(error => {
        console.warn('API server not available, using localStorage only:', error);
    });
    
    // Show success message
    const successDiv = document.getElementById('siteTextsSuccess');
    const errorDiv = document.getElementById('siteTextsError');
    if (successDiv) {
        successDiv.textContent = 'Textele au fost salvate cu succes!';
        successDiv.style.display = 'block';
        if (errorDiv) errorDiv.style.display = 'none';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
    
    // Update the form fields with the saved values (so admin shows what was saved)
    // This ensures the admin form reflects the saved values, not the old HTML content
    setTimeout(() => {
        console.log('🔄 Refreshing form with saved values...');
        populateFormFields(texts);
    }, 150);
    
    // Dispatch event to update index.html if open
    // Use a small delay to ensure localStorage is saved
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('siteTextsUpdated'));
        // Also dispatch storage event for cross-tab communication
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY_SITE_TEXTS,
            newValue: JSON.stringify(texts),
            storageArea: localStorage
        }));
    }, 100);
}

// Helper function to populate form fields with text values
function populateFormFields(texts) {
    if (!texts || Object.keys(texts).length === 0) {
        console.warn('⚠️ No texts to populate form with');
        return;
    }
    
    function setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value || '';
            return true;
        }
        return false;
    }
    
    setFieldValue('heroTitle', texts.heroTitle);
    setFieldValue('heroSubtitle', texts.heroSubtitle);
    setFieldValue('heroDescription', texts.heroDescription);
    setFieldValue('heroButtonText', texts.heroButtonText);
    setFieldValue('servicesTitle', texts.servicesTitle);
    setFieldValue('servicesSubtitle', texts.servicesSubtitle);
    setFieldValue('service1Title', texts.service1Title);
    setFieldValue('service1Subtitle', texts.service1Subtitle);
    setFieldValue('service1Description', texts.service1Description);
    setFieldValue('service2Title', texts.service2Title);
    setFieldValue('service2Subtitle', texts.service2Subtitle);
    setFieldValue('service2Description', texts.service2Description);
    setFieldValue('service3Title', texts.service3Title);
    setFieldValue('service3Subtitle', texts.service3Subtitle);
    setFieldValue('service3Description', texts.service3Description);
    setFieldValue('guaranteeTitle', texts.guaranteeTitle);
    setFieldValue('guarantee1Title', texts.guarantee1Title);
    setFieldValue('guarantee1Description', texts.guarantee1Description);
    setFieldValue('guarantee2Title', texts.guarantee2Title);
    setFieldValue('guarantee2Description', texts.guarantee2Description);
    setFieldValue('guarantee3Title', texts.guarantee3Title);
    setFieldValue('guarantee3Description', texts.guarantee3Description);
    
    console.log('✅ Form fields refreshed with saved values');
}

async function loadSiteTexts() {
    console.log('🔄 Loading site texts...');
    
    // First, try to load from saved texts (localStorage/API) to show user's modifications
    // This ensures the admin form shows the saved changes, not the static HTML
    let texts = await getSiteTexts();
    console.log('📦 Texts from getSiteTexts:', texts);
    console.log('📊 Keys count:', texts ? Object.keys(texts).length : 0);
    
    // Check if texts has error property (from API)
    if (texts && texts.error) {
        console.warn('⚠️ Texts object contains error, treating as empty:', texts.error);
        texts = {};
    }
    
    // If no saved texts exist, load from HTML as fallback
    if (!texts || Object.keys(texts).length === 0) {
        console.log('⚠️ No saved texts found, loading from HTML...');
        texts = await loadTextsFromHTML();
        console.log('📄 Texts from HTML:', texts);
        console.log('📊 HTML keys count:', texts ? Object.keys(texts).length : 0);
        
        // If HTML loading also failed, return empty
        if (!texts || Object.keys(texts).length === 0) {
            console.error('❌ No texts found in saved storage or HTML!');
            return;
        }
    } else {
        console.log('✅ Using saved texts from localStorage/API');
    }
    
    // Final check - make sure we don't have error object
    if (texts && texts.error) {
        console.error('❌ Final texts still contains error! Resetting to empty.');
        texts = {};
    }
    
    console.log('📋 Final texts to display:', texts);
    console.log('📊 Final keys:', texts ? Object.keys(texts) : 'none');
    
    // Populate form fields
    console.log('Populating form fields...');
    console.log('Available texts keys:', Object.keys(texts));
    console.log('Sample text values:', {
        heroTitle: texts.heroTitle,
        service1Title: texts.service1Title,
        guarantee1Title: texts.guarantee1Title
    });
    
    // Helper function to set value safely
    function setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (el) {
            const oldValue = el.value;
            el.value = value || '';
            if (el.value !== oldValue) {
                const preview = el.value ? (el.value.length > 100 ? el.value.substring(0, 100) + '...' : el.value) : '(empty)';
                console.log(`✓ Set ${id}:`, preview);
                // For service descriptions, log the full length to verify features are included
                if (id.includes('service') && id.includes('Description')) {
                    console.log(`  Full length: ${el.value.length} characters`);
                    if (el.value.includes('--- FEATURE')) {
                        console.log(`  ✓ Contains feature markers`);
                    } else {
                        console.warn(`  ⚠️ Does NOT contain feature markers - might be missing features!`);
                    }
                }
            }
            return true;
        } else {
            console.warn(`✗ Field ${id} not found in DOM`);
            return false;
        }
    }
    
    // Check if we have any texts to populate
    if (!texts || Object.keys(texts).length === 0) {
        console.error('❌ No texts to populate! texts object is empty or undefined');
        console.log('Current texts object:', texts);
        return;
    }
    
    console.log('📝 Populating form fields with', Object.keys(texts).length, 'text values...');
    
    // Populate all fields
    let populatedCount = 0;
    if (setFieldValue('heroTitle', texts.heroTitle) && texts.heroTitle) populatedCount++;
    if (setFieldValue('heroSubtitle', texts.heroSubtitle) && texts.heroSubtitle) populatedCount++;
    if (setFieldValue('heroDescription', texts.heroDescription) && texts.heroDescription) populatedCount++;
    if (setFieldValue('heroButtonText', texts.heroButtonText) && texts.heroButtonText) populatedCount++;
    if (setFieldValue('servicesTitle', texts.servicesTitle) && texts.servicesTitle) populatedCount++;
    if (setFieldValue('servicesSubtitle', texts.servicesSubtitle) && texts.servicesSubtitle) populatedCount++;
    if (setFieldValue('service1Title', texts.service1Title) && texts.service1Title) populatedCount++;
    if (setFieldValue('service1Subtitle', texts.service1Subtitle) && texts.service1Subtitle) populatedCount++;
    if (setFieldValue('service1Description', texts.service1Description) && texts.service1Description) populatedCount++;
    if (setFieldValue('service2Title', texts.service2Title) && texts.service2Title) populatedCount++;
    if (setFieldValue('service2Subtitle', texts.service2Subtitle) && texts.service2Subtitle) populatedCount++;
    if (setFieldValue('service2Description', texts.service2Description) && texts.service2Description) populatedCount++;
    if (setFieldValue('service3Title', texts.service3Title) && texts.service3Title) populatedCount++;
    if (setFieldValue('service3Subtitle', texts.service3Subtitle) && texts.service3Subtitle) populatedCount++;
    if (setFieldValue('service3Description', texts.service3Description) && texts.service3Description) populatedCount++;
    if (setFieldValue('guaranteeTitle', texts.guaranteeTitle) && texts.guaranteeTitle) populatedCount++;
    if (setFieldValue('guarantee1Title', texts.guarantee1Title) && texts.guarantee1Title) populatedCount++;
    if (setFieldValue('guarantee1Description', texts.guarantee1Description) && texts.guarantee1Description) populatedCount++;
    if (setFieldValue('guarantee2Title', texts.guarantee2Title) && texts.guarantee2Title) populatedCount++;
    if (setFieldValue('guarantee2Description', texts.guarantee2Description) && texts.guarantee2Description) populatedCount++;
    if (setFieldValue('guarantee3Title', texts.guarantee3Title) && texts.guarantee3Title) populatedCount++;
    if (setFieldValue('guarantee3Description', texts.guarantee3Description) && texts.guarantee3Description) populatedCount++;
    
    console.log(`✅ Form fields populated. ${populatedCount} fields have values.`);
    
    // Verify at least one field was populated
    const testField = document.getElementById('heroTitle');
    if (testField) {
        if (testField.value) {
            console.log('✅ Verified: heroTitle has value:', testField.value.substring(0, 50));
        } else {
            console.warn('⚠️ heroTitle field exists but is empty');
            console.warn('⚠️ This means texts.heroTitle is:', texts.heroTitle);
            console.warn('⚠️ Full texts object:', texts);
        }
    } else {
        console.error('❌ heroTitle field does not exist in DOM!');
    }
}

// Load texts from current HTML content by fetching index.html
async function loadTextsFromHTML() {
    const texts = {};
    
    try {
        // Try multiple paths
        let response = null;
        const paths = ['/index.html', 'index.html', './index.html', '../index.html'];
        
        for (const path of paths) {
            try {
                console.log(`Trying to fetch: ${path}`);
                response = await fetch(path);
                if (response.ok) {
                    console.log(`✅ Successfully fetched ${path}`);
                    break;
                } else {
                    console.warn(`❌ ${path} returned status: ${response.status}`);
                }
            } catch (e) {
                console.warn(`❌ Error fetching ${path}:`, e.message);
            }
        }
        
        if (response && response.ok) {
            const html = await response.text();
            console.log('📄 Fetched HTML, length:', html.length);
            
            if (html.length < 100) {
                console.error('❌ HTML seems too short, might be an error page');
                return texts;
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Check for parsing errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                console.error('❌ HTML parsing error:', parserError.textContent);
                return texts;
            }
            
            // Load hero section
            const heroTitle = doc.querySelector('.hero-title');
            if (heroTitle) {
                texts.heroTitle = heroTitle.textContent.trim();
                console.log('✓ Found heroTitle:', texts.heroTitle.substring(0, 50));
            } else {
                console.warn('✗ .hero-title not found in HTML');
            }
            
            const heroSubtitle = doc.querySelector('.hero-subtitle');
            if (heroSubtitle) {
                texts.heroSubtitle = heroSubtitle.textContent.trim();
                console.log('✓ Found heroSubtitle');
            } else {
                console.warn('✗ .hero-subtitle not found in HTML');
            }
            
            const heroDescription = doc.querySelector('.hero-description');
            if (heroDescription) {
                texts.heroDescription = heroDescription.textContent.trim();
                console.log('✓ Found heroDescription');
            } else {
                console.warn('✗ .hero-description not found in HTML');
            }
            
            const heroButton = doc.querySelector('.btn-hero');
            if (heroButton) {
                texts.heroButtonText = heroButton.textContent.trim();
                console.log('✓ Found heroButtonText:', texts.heroButtonText);
            } else {
                console.warn('✗ .btn-hero not found in HTML');
            }
            
            // Load services section header
            const servicesHeader = doc.querySelector('#servicii .section-header h2');
            if (servicesHeader) {
                texts.servicesTitle = servicesHeader.textContent.trim();
                console.log('✓ Found servicesTitle:', texts.servicesTitle);
            } else {
                console.warn('✗ #servicii .section-header h2 not found');
            }
            
            const servicesSubtitle = doc.querySelector('#servicii .section-header p');
            if (servicesSubtitle) {
                texts.servicesSubtitle = servicesSubtitle.textContent.trim();
                console.log('✓ Found servicesSubtitle');
            } else {
                console.warn('✗ #servicii .section-header p not found');
            }
            
            // Load individual services
            const service1 = doc.querySelector('.service-card[data-service="1"]');
            if (service1) {
                const title = service1.querySelector('.service-title');
                if (title) {
                    texts.service1Title = title.textContent.trim();
                    console.log('✓ Found service1Title:', texts.service1Title);
                } else {
                    console.warn('✗ .service-title not found in service1');
                }
                const subtitle = service1.querySelector('.service-subtitle');
                if (subtitle) {
                    texts.service1Subtitle = subtitle.textContent.trim();
                    console.log('✓ Found service1Subtitle');
                }
                // Extract full content from .service-content (includes description + features)
                // Convert to a readable text format for editing
                const content = service1.querySelector('.service-content');
                if (content) {
                    let fullText = '';
                    // Get the main description
                    const desc = content.querySelector('.service-description');
                    if (desc) {
                        fullText = desc.textContent.trim() + '\n\n';
                    }
                    // Get all features
                    const features = content.querySelectorAll('.service-feature');
                    features.forEach((feature, index) => {
                        const title = feature.querySelector('h4');
                        const text = feature.querySelector('p');
                        if (title && text) {
                            fullText += `--- FEATURE ${index + 1} ---\n`;
                            fullText += title.textContent.trim() + '\n';
                            fullText += text.textContent.trim() + '\n\n';
                        }
                    });
                    texts.service1Description = fullText.trim();
                    console.log('✓ Found service1Description (full content with features)');
                } else {
                    // Fallback to just description if content not found
                    const desc = service1.querySelector('.service-description');
                    if (desc) {
                        texts.service1Description = desc.textContent.trim();
                        console.log('✓ Found service1Description (description only)');
                    }
                }
            } else {
                console.warn('✗ .service-card[data-service="1"] not found');
            }
            
            const service2 = doc.querySelector('.service-card[data-service="2"]');
            if (service2) {
                const title = service2.querySelector('.service-title');
                if (title) {
                    texts.service2Title = title.textContent.trim();
                    console.log('✓ Found service2Title:', texts.service2Title);
                }
                const subtitle = service2.querySelector('.service-subtitle');
                if (subtitle) {
                    texts.service2Subtitle = subtitle.textContent.trim();
                }
                // Extract full content from .service-content
                const content = service2.querySelector('.service-content');
                if (content) {
                    let fullText = '';
                    // Get the main description
                    const desc = content.querySelector('.service-description');
                    if (desc) {
                        fullText = desc.textContent.trim() + '\n\n';
                    }
                    // Get all features
                    const features = content.querySelectorAll('.service-feature');
                    features.forEach((feature, index) => {
                        const title = feature.querySelector('h4');
                        const text = feature.querySelector('p');
                        if (title && text) {
                            fullText += `--- FEATURE ${index + 1} ---\n`;
                            fullText += title.textContent.trim() + '\n';
                            fullText += text.textContent.trim() + '\n\n';
                        }
                    });
                    texts.service2Description = fullText.trim();
                    console.log('✓ Found service2Description (full content with features)');
                } else {
                    const desc = service2.querySelector('.service-description');
                    if (desc) {
                        texts.service2Description = desc.textContent.trim();
                    }
                }
            } else {
                console.warn('✗ .service-card[data-service="2"] not found');
            }
            
            const service3 = doc.querySelector('.service-card[data-service="3"]');
            if (service3) {
                const title = service3.querySelector('.service-title');
                if (title) {
                    texts.service3Title = title.textContent.trim();
                    console.log('✓ Found service3Title:', texts.service3Title);
                }
                const subtitle = service3.querySelector('.service-subtitle');
                if (subtitle) {
                    texts.service3Subtitle = subtitle.textContent.trim();
                }
                // Extract full content from .service-content
                const content = service3.querySelector('.service-content');
                if (content) {
                    let fullText = '';
                    // Get the main description
                    const desc = content.querySelector('.service-description');
                    if (desc) {
                        fullText = desc.textContent.trim() + '\n\n';
                    }
                    // Get all features
                    const features = content.querySelectorAll('.service-feature');
                    features.forEach((feature, index) => {
                        const title = feature.querySelector('h4');
                        const text = feature.querySelector('p');
                        if (title && text) {
                            fullText += `--- FEATURE ${index + 1} ---\n`;
                            fullText += title.textContent.trim() + '\n';
                            fullText += text.textContent.trim() + '\n\n';
                        }
                    });
                    texts.service3Description = fullText.trim();
                    console.log('✓ Found service3Description (full content with features)');
                } else {
                    const desc = service3.querySelector('.service-description');
                    if (desc) {
                        texts.service3Description = desc.textContent.trim();
                    }
                }
            } else {
                console.warn('✗ .service-card[data-service="3"] not found');
            }
            
            // Load guarantee section
            const guaranteeHeader = doc.querySelector('.guarantee-header h2');
            if (guaranteeHeader) {
                texts.guaranteeTitle = guaranteeHeader.textContent.trim();
                console.log('✓ Found guaranteeTitle:', texts.guaranteeTitle);
            } else {
                console.warn('✗ .guarantee-header h2 not found');
            }
            
            const guarantee1 = doc.querySelector('.guarantee-card[data-guarantee="1"]');
            if (guarantee1) {
                const title = guarantee1.querySelector('.guarantee-title');
                if (title) {
                    texts.guarantee1Title = title.textContent.trim();
                    console.log('✓ Found guarantee1Title:', texts.guarantee1Title);
                } else {
                    console.warn('✗ .guarantee-title not found in guarantee1');
                }
                const desc = guarantee1.querySelector('.guarantee-description');
                if (desc) {
                    texts.guarantee1Description = desc.innerHTML.trim();
                    console.log('✓ Found guarantee1Description');
                } else {
                    console.warn('✗ .guarantee-description not found in guarantee1');
                }
            } else {
                console.warn('✗ .guarantee-card[data-guarantee="1"] not found');
            }
            
            const guarantee2 = doc.querySelector('.guarantee-card[data-guarantee="2"]');
            if (guarantee2) {
                const title = guarantee2.querySelector('.guarantee-title');
                if (title) {
                    texts.guarantee2Title = title.textContent.trim();
                    console.log('✓ Found guarantee2Title:', texts.guarantee2Title);
                }
                const desc = guarantee2.querySelector('.guarantee-description');
                if (desc) {
                    texts.guarantee2Description = desc.innerHTML.trim();
                }
            } else {
                console.warn('✗ .guarantee-card[data-guarantee="2"] not found');
            }
            
            const guarantee3 = doc.querySelector('.guarantee-card[data-guarantee="3"]');
            if (guarantee3) {
                const title = guarantee3.querySelector('.guarantee-title');
                if (title) {
                    texts.guarantee3Title = title.textContent.trim();
                    console.log('✓ Found guarantee3Title:', texts.guarantee3Title);
                }
                const desc = guarantee3.querySelector('.guarantee-description');
                if (desc) {
                    texts.guarantee3Description = desc.innerHTML.trim();
                }
            } else {
                console.warn('✗ .guarantee-card[data-guarantee="3"] not found');
            }
            
            console.log('✅ Successfully parsed HTML, found', Object.keys(texts).length, 'text fields');
        } else {
            console.error('❌ Failed to fetch index.html - no valid response');
        }
    } catch (error) {
        console.error('❌ Could not load texts from HTML:', error);
        console.error('Error details:', error.stack);
    }
    
    console.log('📋 Final loaded texts from HTML:', Object.keys(texts).length, 'keys');
    return texts;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.deleteMessage = deleteMessage;
window.deleteChatbotConversation = deleteChatbotConversation;
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;
window.deleteTikTokVideo = deleteTikTokVideo;
window.deleteCertificate = deleteCertificate;
window.deletePartner = deletePartner;

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

