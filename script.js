// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Animate hamburger icon
        const spans = mobileMenuToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(8px, 8px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = mobileMenuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Form submission handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Disable submit button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Se trimite...';
        
        try {
            // Try to save to API server first
            console.log('Sending message to API:', data);
            const response = await fetch('http://localhost:8001/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Message saved to API successfully:', result);
                // Success - message saved to database
                alert('Mulțumim pentru mesaj! Vă vom contacta în cel mai scurt timp.');
                contactForm.reset();
            } else {
                const errorText = await response.text();
                console.error('API error:', response.status, errorText);
                throw new Error('Server error: ' + response.status);
            }
        } catch (error) {
            // Fallback to localStorage if API is not available
            console.warn('API server not available, saving to localStorage:', error);
            const STORAGE_KEY_MESSAGES = 'sofimar_contact_messages';
            const messages = JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES) || '[]');
            const messageWithTimestamp = {
                ...data,
                timestamp: new Date().toISOString()
            };
            messages.push(messageWithTimestamp);
            localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
            console.log('Message saved to localStorage:', messageWithTimestamp);
            alert('Mulțumim pentru mesaj! Vă vom contacta în cel mai scurt timp.');
            contactForm.reset();
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and guarantee cards
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.service-card, .guarantee-card, .contact-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add active state to navigation links based on scroll position
const sections = document.querySelectorAll('section[id]');

function highlightNavigation() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightNavigation);

// Chatbot functionality
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotBadge = document.querySelector('.chatbot-badge');

// Toggle chatbot
if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.add('active');
        chatbotBadge.style.display = 'none';
        chatbotInput.focus();
    });
}

if (chatbotClose) {
    chatbotClose.addEventListener('click', () => {
        chatbotContainer.classList.remove('active');
    });
}

// Chatbot responses based on keywords
const chatbotResponses = {
    'dezinsecție': 'Dezinsecția noastră elimină eficient gândacii, ploșnițele, furnicile și puricii folosind insecticide profesionale cu miros redus. Tratamentul este sigur pentru familie și animalele de companie, fiind efectuat de tehnicieni certificați CEPA. Pentru ploșnițe, garantăm tratament în două etape (18-21 zile) pentru a elimina complet ciclul reproductiv.',
    'gândaci': 'Folosim metode profesionale de dezinsecție pentru eliminarea gândacilor. Tratamentul vizăm strict locurile de ascunzătoare (crăpături, goluri) pentru eficiență maximă și siguranță. Toate intervențiile sunt efectuate de tehnicieni certificați.',
    'ploșnițe': 'Pentru ploșnițe, oferim tratament garantat în minim două etape la interval de 18-21 de zile. Acest protocol este esențial pentru a rupe ciclul reproductiv și a elimina larvele nou-eclozate. Utilizăm produse profesionale, sigure pentru familie.',
    'deratizare': 'Deratizarea noastră este discretă, sigură și eficientă. Folosim momeli anticoagulante profesionale, securizate în stații rezistente la deschidere accidentală, prevenind accesul copiilor și animalelor. Identificăm și tratăm punctele de acces exterioare pentru o apărare perimetrală completă.',
    'șoareci': 'Pentru eliminarea șoarecilor, implementăm stații sigure de momeală și ținem cont de neofobie (frica rozătoarelor de obiecte noi). Protocoalele noastre asigură consumul momelei și eliminarea eficientă a populației de rozătoare.',
    'șobolani': 'Șobolanii sunt vectori majori de boli (Salmonela, Leptospiroză) și cauzează daune structurale. Deratizarea noastră rezidențială folosește momeli profesionale securizate și crează o barieră protectoare în jurul proprietății.',
    'dezinfecție': 'Dezinfecția noastră utilizează tehnologia de Nebulizare Uscată (sistemul Nocospray cu Peroxid de Hidrogen H₂O₂) care ajunge la 100% din volumul aerului și suprafețelor, inclusiv în spatele mobilierului. Formulă non-corozivă care se descompune natural în apă și oxigen, fără reziduuri toxice.',
    'preț': 'Prețurile variază în funcție de tipul de serviciu și dimensiunea locuinței. Oferim consultație gratuită și estimare de preț personalizată. Contactați-ne pentru un devis detaliat.',
    'garanție': 'Oferim GARANȚIE 300% - o garanție triplă care oferă proprietarilor liniște și un angajament de neegalat pentru o soluție permanentă.',
    'certificat': 'Suntem prima firmă din România certificată cu standardul european de calitate ISO 16.636 (CEPA Certified®). Procedurile noastre sunt recunoscute la nivel internațional ca fiind cele mai bune practici.',
    'timp': 'Oferim intervenție rapidă în maximum 24 de ore pentru probleme urgente în zonele noastre de acoperire națională.',
    'contact': 'Ne puteți contacta prin email la contact@sofimarserv.ro sau prin formularul de contact de pe site. Suntem disponibili pentru consultații și intervenții urgente.',
    'default': 'Vă mulțumim pentru întrebare! Pentru informații detaliate despre serviciile noastre de deratizare, dezinsecție sau dezinfecție, vă rugăm să ne contactați direct. Oferim consultație gratuită și intervenție rapidă în 24 de ore pentru probleme urgente.'
};

function getChatbotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Check for keywords
    for (const [keyword, response] of Object.entries(chatbotResponses)) {
        if (keyword !== 'default' && message.includes(keyword)) {
            return response;
        }
    }
    
    // Check for common greetings
    if (message.includes('salut') || message.includes('bună') || message.includes('hello') || message.includes('hi')) {
        return 'Bună ziua! Cu ce vă pot ajuta astăzi? Puteți întreba despre serviciile noastre de deratizare, dezinsecție sau dezinfecție.';
    }
    
    if (message.includes('mulțum') || message.includes('mersi') || message.includes('mulțumesc')) {
        return 'Cu plăcere! Dacă mai aveți întrebări, sunt aici să vă ajut. O zi bună!';
    }
    
    return chatbotResponses.default;
}

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatbotMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    
    // Save chatbot message to localStorage for admin panel
    const STORAGE_KEY_CHATBOT_MESSAGES = 'sofimar_chatbot_messages';
    let chatbotMessages = JSON.parse(localStorage.getItem(STORAGE_KEY_CHATBOT_MESSAGES) || '[]');
    
    // Save user message immediately
    const userMessage = {
        type: 'user',
        message: message,
        timestamp: new Date().toISOString()
    };
    
    // Try to save to API server
    fetch('http://localhost:8001/api/chatbot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userMessage)
    }).catch(error => {
        // Fallback to localStorage if API is not available
        console.warn('API server not available, saving to localStorage:', error);
        chatbotMessages.push(userMessage);
        localStorage.setItem(STORAGE_KEY_CHATBOT_MESSAGES, JSON.stringify(chatbotMessages));
    });
    
    // Dispatch custom event for admin panel
    window.dispatchEvent(new CustomEvent('chatbotMessageAdded'));
    
    chatbotInput.value = '';
    
    // Simulate bot thinking
    setTimeout(() => {
        const response = getChatbotResponse(message);
        addMessage(response, false);
        
        // Save bot response
        const botMessage = {
            type: 'bot',
            message: response,
            timestamp: new Date().toISOString()
        };
        
        // Try to save to API server
        fetch('http://localhost:8001/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(botMessage)
        }).catch(error => {
            // Fallback to localStorage if API is not available
            console.warn('API server not available, saving to localStorage:', error);
            chatbotMessages = JSON.parse(localStorage.getItem(STORAGE_KEY_CHATBOT_MESSAGES) || '[]');
            chatbotMessages.push(botMessage);
            localStorage.setItem(STORAGE_KEY_CHATBOT_MESSAGES, JSON.stringify(chatbotMessages));
        });
        
        // Dispatch custom event for admin panel
        window.dispatchEvent(new CustomEvent('chatbotMessageAdded'));
    }, 500);
}

// Send message on button click
if (chatbotSend) {
    chatbotSend.addEventListener('click', sendMessage);
}

// Send message on Enter key
if (chatbotInput) {
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// TikTok Video IDs - Adaugă aici toate ID-urile video-urilor de pe canalul TikTok
// Pentru a obține ID-ul: Mergi pe video > Share > Copy Link > Copiază numărul de după /video/
// Video-urile pot fi gestionate din panoul de admin
const STORAGE_KEY_VIDEOS = 'sofimar_tiktok_videos';
const DEFAULT_TIKTOK_VIDEO_IDS = [
    '7567003645250702614',
    '7564125179761167638',
    '7556587113244937475'
    // Adaugă aici mai multe ID-uri de video când ai videoclipuri noi
    // Exemplu: '1234567890123456789',
];

// Load videos from localStorage or use default
function getTikTokVideoIds() {
    const stored = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (stored) {
        try {
            const videos = JSON.parse(stored);
            return videos.length > 0 ? videos : DEFAULT_TIKTOK_VIDEO_IDS;
        } catch (e) {
            return DEFAULT_TIKTOK_VIDEO_IDS;
        }
    }
    return DEFAULT_TIKTOK_VIDEO_IDS;
}

const TIKTOK_VIDEO_IDS = getTikTokVideoIds();

const TIKTOK_USERNAME = '@sofimar_serv.srl';

// Function to create TikTok embed HTML
function createTikTokEmbed(videoId) {
    const videoUrl = `https://www.tiktok.com/${TIKTOK_USERNAME}/video/${videoId}`;
    return `
        <div class="tiktok-video-wrapper">
            <blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoId}" style="max-width: 100%; min-width: 325px;">
                <section>
                    <a target="_blank" title="${TIKTOK_USERNAME}" href="${videoUrl}">${TIKTOK_USERNAME}</a>
                </section>
            </blockquote>
        </div>
    `;
}

// Load all TikTok videos dynamically
function loadTikTokVideos() {
    const carousel = document.getElementById('tiktokCarousel');
    if (!carousel) return;
    
    // Clear existing content
    carousel.innerHTML = '';
    
    // Create embeds for all videos
    TIKTOK_VIDEO_IDS.forEach(videoId => {
        carousel.innerHTML += createTikTokEmbed(videoId);
    });
    
    // Duplicate videos for seamless loop
    TIKTOK_VIDEO_IDS.forEach(videoId => {
        carousel.innerHTML += createTikTokEmbed(videoId);
    });
    
    // Load TikTok embed script and render
    if (!window.tiktokEmbedLoaded) {
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        script.onload = () => {
            window.tiktokEmbedLoaded = true;
            if (window.tiktokEmbed) {
                window.tiktokEmbed.lib.render();
                
                // Try to enable autoplay after videos load
                setTimeout(() => {
                    const tiktokIframes = document.querySelectorAll('.tiktok-video-wrapper iframe');
                    tiktokIframes.forEach((iframe) => {
                        if (iframe.src) {
                            try {
                                const url = new URL(iframe.src);
                                url.searchParams.set('autoplay', '1');
                                url.searchParams.set('mute', '1');
                                iframe.src = url.toString();
                            } catch (e) {
                                console.log('Could not modify iframe URL');
                            }
                        }
                    });
                }, 2000);
            }
        };
        document.head.appendChild(script);
    } else if (window.tiktokEmbed) {
        window.tiktokEmbed.lib.render();
    }
}

// Store map instance globally for updates
let romaniaMapInstance = null;

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Track page visits
function trackPageVisit() {
    const STORAGE_KEY_VISITS = 'sofimar_page_visits';
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    try {
        // Try to save to API server first
        fetch('http://localhost:8001/api/visits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: dateKey,
                timestamp: today.toISOString()
            })
        }).catch(error => {
            // Fallback to localStorage
            console.warn('API server not available, saving visit to localStorage:', error);
            const visits = JSON.parse(localStorage.getItem(STORAGE_KEY_VISITS) || '{}');
            visits[dateKey] = (visits[dateKey] || 0) + 1;
            localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(visits));
        });
    } catch (error) {
        // Fallback to localStorage
        const visits = JSON.parse(localStorage.getItem(STORAGE_KEY_VISITS) || '{}');
        visits[dateKey] = (visits[dateKey] || 0) + 1;
        localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(visits));
    }
}

// TikTok Embed Loader with Autoplay
document.addEventListener('DOMContentLoaded', () => {
    // Track page visit
    trackPageVisit();
    
    loadTikTokVideos();
    // Initialize Romania map - wait for everything to load
    function tryInitMap() {
        if (typeof L !== 'undefined') {
            console.log('Leaflet loaded, initializing map...');
            initRomaniaMap();
        } else {
            console.warn('Leaflet not loaded yet, retrying...');
            setTimeout(tryInitMap, 200);
        }
    }
    
    // Start trying after a short delay
    setTimeout(tryInitMap, 300);
});

// Listen for location updates from admin panel
window.addEventListener('locationsUpdated', () => {
    if (romaniaMapInstance) {
        // Reload map with new locations
        const mapContainer = document.getElementById('romaniaMap');
        if (mapContainer) {
            mapContainer.innerHTML = ''; // Clear map
            initRomaniaMap(); // Reinitialize
        }
    }
});

// Listen for certificate updates from admin panel
window.addEventListener('certificatesUpdated', () => {
    if (document.getElementById('certificatesGrid')) {
        loadCertificatesOnPage();
    }
});

// Romania Map with Office Locations
function initRomaniaMap() {
    const mapContainer = document.getElementById('romaniaMap');
    if (!mapContainer) {
        console.warn('romaniaMap container not found');
        return;
    }

    console.log('Initializing Romania map...');
    console.log('Map container:', mapContainer);
    console.log('Container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet.js is not loaded! Make sure Leaflet script is loaded before this script.');
        mapContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">Eroare: Leaflet.js nu este încărcat. Te rugăm să reîmprospătezi pagina.</p>';
        return;
    }

    // Clear any existing content
    mapContainer.innerHTML = '';

    try {
        // Initialize map centered on Romania
        const map = L.map('romaniaMap', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([45.9432, 24.9668], 7);
        
        romaniaMapInstance = map; // Store for updates
        console.log('Map initialized successfully');

        // Add OpenStreetMap tiles with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        }).addTo(map);

        tileLayer.on('tileerror', function(error, tile) {
            console.warn('Tile loading error:', error);
        });

        // Force map to invalidate size after a short delay to ensure container is visible
        setTimeout(() => {
            map.invalidateSize();
            console.log('Map size invalidated');
        }, 100);

    // Load office locations from localStorage or use defaults
    const STORAGE_KEY_LOCATIONS = 'sofimar_office_locations';
    let officeLocations = [];
    
    try {
        const stored = localStorage.getItem(STORAGE_KEY_LOCATIONS);
        if (stored) {
            officeLocations = JSON.parse(stored);
            console.log('Loaded locations from localStorage:', officeLocations.length);
        } else {
            console.log('No locations in localStorage, using defaults');
        }
    } catch (e) {
        console.warn('Error loading locations from localStorage:', e);
    }
    
    // Use default locations if none stored
    if (!officeLocations || officeLocations.length === 0) {
        console.log('Using default locations');
        officeLocations = [
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

    console.log('Adding markers for', officeLocations.length, 'locations');

    // Create custom icon
    const customIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: '📍',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });

    // Add markers for each location
    officeLocations.forEach((location, index) => {
        if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            console.warn('Invalid coordinates for location:', location.name, location.coordinates);
            return;
        }

        try {
            const marker = L.marker(location.coordinates, { icon: customIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width: 200px;">
                        <h4>${escapeHtml(location.name || 'Locație')}</h4>
                        <p><strong>${escapeHtml(location.description || '')}</strong></p>
                        <p>📍 ${escapeHtml(location.address || '')}</p>
                        <p>📞 ${escapeHtml(location.phone || '')}</p>
                    </div>
                `);
            console.log(`Marker added for ${location.name} at`, location.coordinates);
        } catch (error) {
            console.error(`Error adding marker for ${location.name}:`, error);
        }
    });

    // Fit map to show all markers
    if (officeLocations.length > 0) {
        const validLocations = officeLocations.filter(loc => 
            loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2
        );
        
        if (validLocations.length > 0) {
            const bounds = validLocations.map(loc => loc.coordinates);
            // Use setTimeout to ensure map is fully rendered
            setTimeout(() => {
                map.fitBounds(bounds, { padding: [50, 50] });
                console.log('Map fitted to bounds with', validLocations.length, 'locations');
            }, 200);
        } else {
            console.warn('No valid locations to fit bounds');
        }
    } else {
        console.warn('No locations to display');
    }
    } catch (error) {
        console.error('Error initializing map:', error);
        mapContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: #e76f51;">Eroare la inițializarea hărții. Te rugăm să reîmprospătezi pagina.</p>';
    }
}

// Certificate Modal Functions
function openCertificateModal(imageSrc, title) {
    const modal = document.getElementById('certificateModal');
    const modalImage = document.getElementById('modalCertificateImage');
    const modalTitle = document.getElementById('modalCertificateTitle');
    
    if (!modal || !modalImage || !modalTitle) return;
    
    modalImage.src = imageSrc;
    modalImage.alt = title;
    modalTitle.textContent = title;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Load certificates from localStorage
function loadCertificatesOnPage() {
    const certificatesGrid = document.getElementById('certificatesGrid');
    if (!certificatesGrid) {
        console.log('certificatesGrid not found');
        return;
    }
    
    const STORAGE_KEY_CERTIFICATES = 'sofimar_certificates';
    let certificates = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY_CERTIFICATES);
        if (stored) {
            certificates = JSON.parse(stored);
            if (!Array.isArray(certificates)) {
                console.error('Certificates data is not an array');
                certificates = [];
            }
        }
    } catch (e) {
        console.error('Error loading certificates:', e);
        certificates = [];
    }
    
    console.log('Loading certificates from localStorage:', certificates.length, 'certificates');
    
    // Always replace certificates with those from localStorage (even if empty)
    // Clear existing certificates and load from localStorage
    if (certificates.length === 0) {
        // If no certificates, keep the grid empty or show default
        certificatesGrid.innerHTML = '';
        return;
    }
    
    certificatesGrid.innerHTML = certificates.map(cert => {
        const isBase64 = cert.image && cert.image.startsWith('data:image');
        const imageSrc = isBase64 ? cert.image : cert.image;
        const escapedTitle = escapeHtml(cert.title);
        // Escape quotes and backslashes for onclick attribute
        const escapedImageSrc = imageSrc.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const escapedTitleForOnclick = escapedTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        return `
            <div class="certificate-item">
                <div class="certificate-image-wrapper">
                    <img src="${escapedImageSrc}" alt="${escapedTitle}" class="certificate-image">
                    <div class="certificate-overlay">
                        <button class="certificate-view-btn" onclick="openCertificateModal('${escapedImageSrc}', '${escapedTitleForOnclick}')">
                            Vezi Detalii
                        </button>
                    </div>
                </div>
                <div class="certificate-info">
                    <h3>${escapedTitle}</h3>
                    ${cert.description ? `<p>${escapeHtml(cert.description)}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Initialize certificates when page loads (if on certificate page)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('certificatesGrid')) {
            loadCertificatesOnPage();
        }
    });
} else {
    // DOM already loaded
    if (document.getElementById('certificatesGrid')) {
        loadCertificatesOnPage();
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('certificateModal');
    if (e.target === modal) {
        closeCertificateModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCertificateModal();
    }
});

