// API Base URL - use current hostname instead of localhost for mobile access
const API_BASE_URL = `http://${window.location.hostname}:8001`;

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

// Enhanced smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
            // Get navbar height
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            
            // Calculate target position
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
            
            // Smooth scroll with easing (10% faster)
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            const duration = Math.min(Math.abs(distance) / 2.2, 900); // 10% faster: divided by 2.2 instead of 2, max 900ms instead of 1000ms
            let start = null;
            
            function easeInOutCubic(t) {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }
            
            function animation(currentTime) {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const progress = Math.min(timeElapsed / duration, 1);
                
                window.scrollTo(0, startPosition + distance * easeInOutCubic(progress));
                
                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            }
            
            requestAnimationFrame(animation);
            
            // Close mobile menu if open
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const spans = document.querySelector('.mobile-menu-toggle')?.querySelectorAll('span');
                if (spans) {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
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
            const response = await fetch(`${API_BASE_URL}/api/messages`, {
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
    fetch(`${API_BASE_URL}/api/chatbot`, {
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
        fetch(`${API_BASE_URL}/api/chatbot`, {
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
                
                // Try to enable autoplay and loop after videos load
                setTimeout(() => {
                    const tiktokIframes = document.querySelectorAll('.tiktok-video-wrapper iframe');
                    tiktokIframes.forEach((iframe) => {
                        if (iframe.src) {
                            try {
                                const url = new URL(iframe.src);
                                url.searchParams.set('autoplay', '1');
                                url.searchParams.set('mute', '1');
                                url.searchParams.set('loop', '1');
                                iframe.src = url.toString();
                                // Disable pointer events on iframe
                                iframe.style.pointerEvents = 'none';
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
        fetch(`${API_BASE_URL}/api/visits`, {
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
        loadCertificatesOnPage().catch(err => console.error('Error loading certificates:', err));
    }
});

window.addEventListener('partnersUpdated', () => {
    if (document.getElementById('partnersGrid')) {
        loadPartnersOnPage().catch(err => console.error('Error loading partners:', err));
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
    
    if (!modal || !modalImage) return;
    
    modalImage.src = imageSrc;
    modalImage.alt = title;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Load partners from localStorage or API
async function loadPartnersOnPage() {
    const partnersGrid = document.getElementById('partnersGrid');
    if (!partnersGrid) {
        console.log('partnersGrid not found');
        return;
    }
    
    let partners = [];
    
    try {
        // Try to fetch from API server
        const response = await fetch(`${API_BASE_URL}/api/partners`);
        if (response.ok) {
            partners = await response.json();
            console.log('Loading partners from API:', partners.length, 'partners');
            if (!Array.isArray(partners)) {
                console.error('Partners data from API is not an array');
                partners = [];
            }
        } else {
            throw new Error('API response not OK');
        }
    } catch (error) {
        // Fallback to localStorage
        console.warn('API server not available, loading from localStorage:', error);
        const STORAGE_KEY_PARTNERS = 'sofimar_partners';
        try {
            const stored = localStorage.getItem(STORAGE_KEY_PARTNERS);
            if (stored) {
                partners = JSON.parse(stored);
                if (!Array.isArray(partners)) {
                    console.error('Partners data is not an array');
                    partners = [];
                }
            }
        } catch (e) {
            console.error('Error loading partners:', e);
            partners = [];
        }
        console.log('Loading partners from localStorage:', partners.length, 'partners');
    }
    
    // Clear existing partners
    if (partners.length === 0) {
        partnersGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">Nu există parteneri adăugați momentan.</p>';
        return;
    }
    
    partnersGrid.innerHTML = partners.map(partner => {
        const isBase64 = partner.image && partner.image.startsWith('data:image');
        const imageSrc = isBase64 ? partner.image : partner.image;
        const title = partner.title || 'Partner';
        const escapedTitle = escapeHtml(title);
        const escapedImageSrc = imageSrc.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        return `
            <div class="partner-item">
                <img src="${escapedImageSrc}" alt="${escapedTitle}" loading="lazy" style="width: 5cm; height: 5cm; object-fit: contain;">
            </div>
        `;
    }).join('');
}

// Load certificates from localStorage or API
async function loadCertificatesOnPage() {
    const certificatesGrid = document.getElementById('certificatesGrid');
    if (!certificatesGrid) {
        console.log('certificatesGrid not found');
        return;
    }
    
    let certificates = [];
    
    try {
        // Try to fetch from API server
        const response = await fetch(`${API_BASE_URL}/api/certificates`);
        if (response.ok) {
            certificates = await response.json();
            console.log('Loading certificates from API:', certificates.length, 'certificates');
            if (!Array.isArray(certificates)) {
                console.error('Certificates data from API is not an array');
                certificates = [];
            }
        } else {
            throw new Error('API response not OK');
        }
    } catch (error) {
        // Fallback to localStorage
        console.warn('API server not available, loading from localStorage:', error);
        const STORAGE_KEY_CERTIFICATES = 'sofimar_certificates';
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
    }
    
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
        const title = cert.title || 'Certificat fără titlu';
        const escapedTitle = escapeHtml(title);
        const escapedImageSrc = imageSrc.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const escapedTitleForOnclick = escapedTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        return `
            <div class="certificate-item">
                <h3 class="certificate-title">${escapedTitle}</h3>
                <div class="certificate-image-container" onclick="openCertificateModal('${escapedImageSrc}', '${escapedTitleForOnclick}')">
                    <img src="${escapedImageSrc}" alt="${escapedTitle}" class="certificate-image" loading="lazy">
                </div>
            </div>
        `;
    }).join('');
}

// Convert service text format back to HTML
// Format: "Description text\n\n--- FEATURE 1 ---\nTitle\nText\n\n--- FEATURE 2 ---\n..."
// Also accepts: "--- FEATURE ---\nTitle\nText" (without number)
function convertServiceTextToHTML(text) {
    if (!text) return '';
    
    // Check if it's already HTML (contains tags)
    if (text.includes('<') && text.includes('>')) {
        return text; // Already HTML, return as is
    }
    
    // Check if text contains feature markers (with or without number)
    const hasFeatures = /--- FEATURE/.test(text);
    
    if (!hasFeatures) {
        // Simple text without features - just return as description paragraph
        // Replace newlines with spaces for better formatting
        const cleanText = text.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
        return `<p class="service-description">${escapeHtml(cleanText)}</p>`;
    }
    
    // Split by feature markers (accepts both "--- FEATURE 1 ---" and "--- FEATURE ---")
    const parts = text.split(/--- FEATURE(?:\s+\d+)?\s*---/);
    let html = '';
    
    // First part is the main description
    if (parts[0]) {
        const desc = parts[0].trim();
        if (desc) {
            // Replace newlines with spaces for description
            const cleanDesc = desc.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
            html += `<p class="service-description">${escapeHtml(cleanDesc)}</p>\n                        \n`;
        }
    }
    
    // Process each feature
    for (let i = 1; i < parts.length; i++) {
        const featureText = parts[i].trim();
        if (featureText) {
            const lines = featureText.split('\n').filter(line => line.trim());
            if (lines.length >= 2) {
                const title = lines[0].trim();
                // Join remaining lines as description, replacing multiple spaces/newlines with single space
                const description = lines.slice(1).join(' ').replace(/\s+/g, ' ').trim();
                html += `                        <div class="service-feature">\n                            <h4>${escapeHtml(title)}</h4>\n                            <p>${escapeHtml(description)}</p>\n                        </div>\n\n`;
            } else if (lines.length === 1) {
                // Only title, no description - still create feature
                const title = lines[0].trim();
                html += `                        <div class="service-feature">\n                            <h4>${escapeHtml(title)}</h4>\n                        </div>\n\n`;
            }
        }
    }
    
    return html.trim();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load site texts and update page content
async function loadSiteTexts() {
    let texts = {};
    
    try {
        // Try to fetch from API server
        const response = await fetch(`${API_BASE_URL}/api/site-texts`);
        if (response.ok) {
            texts = await response.json();
            console.log('Loaded texts from API:', texts);
        } else {
            throw new Error('API response not OK');
        }
    } catch (error) {
        // Fallback to localStorage
        console.warn('API server not available, loading from localStorage:', error);
        try {
            const stored = localStorage.getItem('sofimar_site_texts');
            if (stored) {
                texts = JSON.parse(stored);
                console.log('Loaded texts from localStorage:', texts);
            } else {
                console.log('No texts found in localStorage');
            }
        } catch (e) {
            console.error('Error loading site texts:', e);
        }
    }
    
    // Only update if we have texts
    if (!texts || Object.keys(texts).length === 0) {
        console.log('⚠ No texts to update - texts object is empty');
        return;
    }
    
    console.log('🔄 Updating page with texts...');
    console.log('📝 Available text keys:', Object.keys(texts));
    console.log('📄 Sample values:', {
        heroTitle: texts.heroTitle?.substring(0, 30) + '...',
        service1Title: texts.service1Title,
        guarantee1Title: texts.guarantee1Title
    });
    
    // Update page elements if texts exist
    // Force update even if text is empty (to clear old values)
    const heroTitleEl = document.querySelector('.hero-title');
    if (heroTitleEl) {
        if (texts.heroTitle !== undefined) {
            heroTitleEl.textContent = texts.heroTitle;
            console.log('✓ Updated hero title:', texts.heroTitle);
        } else {
            console.warn('⚠ heroTitle not in texts object');
        }
    } else {
        console.warn('✗ Hero title element (.hero-title) not found in DOM');
    }
    
    const heroSubtitleEl = document.querySelector('.hero-subtitle');
    if (heroSubtitleEl) {
        if (texts.heroSubtitle !== undefined) {
            heroSubtitleEl.textContent = texts.heroSubtitle;
            console.log('✓ Updated hero subtitle:', texts.heroSubtitle);
        }
    } else {
        console.warn('✗ Hero subtitle element not found');
    }
    
    const heroDescriptionEl = document.querySelector('.hero-description');
    if (heroDescriptionEl) {
        if (texts.heroDescription !== undefined) {
            heroDescriptionEl.textContent = texts.heroDescription;
            console.log('✓ Updated hero description');
        }
    } else {
        console.warn('✗ Hero description element not found');
    }
    
    const heroButtonEl = document.querySelector('.btn-hero');
    if (heroButtonEl) {
        if (texts.heroButtonText !== undefined) {
            heroButtonEl.textContent = texts.heroButtonText;
            console.log('✓ Updated hero button:', texts.heroButtonText);
        }
    } else {
        console.warn('✗ Hero button element not found');
    }
    
    // Update section headers
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        const h2 = header.querySelector('h2');
        const p = header.querySelector('p');
        
        if (h2) {
            const headerText = h2.textContent.trim();
            if (headerText === 'Serviciile Noastre' && texts.servicesTitle) {
                h2.textContent = texts.servicesTitle;
            } else if (headerText === 'Urmăriți-ne pe TikTok' && texts.tiktokTitle) {
                h2.textContent = texts.tiktokTitle;
            } else if (headerText === 'Contactați-ne' && texts.contactTitle) {
                h2.textContent = texts.contactTitle;
            } else if (headerText === 'Punctele Noastre de Lucru' && texts.locationsTitle) {
                h2.textContent = texts.locationsTitle;
            }
        }
        
        if (p) {
            const subtitleText = p.textContent.trim();
            if (subtitleText.includes('Trei piloni') && texts.servicesSubtitle) {
                p.textContent = texts.servicesSubtitle;
            } else if (subtitleText.includes('Descoperiți serviciile') && texts.tiktokSubtitle) {
                p.textContent = texts.tiktokSubtitle;
            } else if (subtitleText.includes('Suntem aici') && texts.contactSubtitle) {
                p.textContent = texts.contactSubtitle;
            } else if (subtitleText.includes('Găsiți cel mai apropiat') && texts.locationsSubtitle) {
                p.textContent = texts.locationsSubtitle;
            }
        }
    });
    
    // Update individual service cards
    // Service 1
    const service1Card = document.querySelector('.service-card[data-service="1"]');
    if (service1Card) {
        if (texts.service1Title !== undefined) {
            const titleEl = service1Card.querySelector('.service-title');
            if (titleEl) {
                titleEl.textContent = texts.service1Title;
                console.log('✓ Updated service1 title:', texts.service1Title);
            } else {
                console.warn('✗ .service-title not found in service1 card');
            }
        }
        if (texts.service1Subtitle !== undefined) {
            const subtitleEl = service1Card.querySelector('.service-subtitle');
            if (subtitleEl) {
                subtitleEl.textContent = texts.service1Subtitle;
                console.log('✓ Updated service1 subtitle:', texts.service1Subtitle);
            }
        }
        if (texts.service1Description !== undefined) {
            // Convert text format back to HTML
            const contentEl = service1Card.querySelector('.service-content');
            if (contentEl) {
                const html = convertServiceTextToHTML(texts.service1Description);
                contentEl.innerHTML = html;
                console.log('✓ Updated service1 description (full content with features)');
            } else {
                // Fallback to just .service-description if .service-content not found
                const descEl = service1Card.querySelector('.service-description');
                if (descEl) {
                    descEl.textContent = texts.service1Description;
                    console.log('✓ Updated service1 description (description only)');
                }
            }
        }
    } else {
        console.warn('✗ Service1 card not found');
    }
    
    // Service 2
    const service2Card = document.querySelector('.service-card[data-service="2"]');
    if (service2Card) {
        if (texts.service2Title !== undefined) {
            const titleEl = service2Card.querySelector('.service-title');
            if (titleEl) {
                titleEl.textContent = texts.service2Title;
                console.log('✓ Updated service2 title:', texts.service2Title);
            }
        }
        if (texts.service2Subtitle !== undefined) {
            const subtitleEl = service2Card.querySelector('.service-subtitle');
            if (subtitleEl) {
                subtitleEl.textContent = texts.service2Subtitle;
                console.log('✓ Updated service2 subtitle:', texts.service2Subtitle);
            }
        }
        if (texts.service2Description !== undefined) {
            // Convert text format back to HTML
            const contentEl = service2Card.querySelector('.service-content');
            if (contentEl) {
                const html = convertServiceTextToHTML(texts.service2Description);
                contentEl.innerHTML = html;
                console.log('✓ Updated service2 description (full content with features)');
            } else {
                // Fallback to just .service-description if .service-content not found
                const descEl = service2Card.querySelector('.service-description');
                if (descEl) {
                    descEl.textContent = texts.service2Description;
                    console.log('✓ Updated service2 description (description only)');
                }
            }
        }
    } else {
        console.warn('✗ Service2 card not found');
    }
    
    // Service 3
    const service3Card = document.querySelector('.service-card[data-service="3"]');
    if (service3Card) {
        if (texts.service3Title !== undefined) {
            const titleEl = service3Card.querySelector('.service-title');
            if (titleEl) {
                titleEl.textContent = texts.service3Title;
                console.log('✓ Updated service3 title:', texts.service3Title);
            }
        }
        if (texts.service3Subtitle !== undefined) {
            const subtitleEl = service3Card.querySelector('.service-subtitle');
            if (subtitleEl) {
                subtitleEl.textContent = texts.service3Subtitle;
                console.log('✓ Updated service3 subtitle:', texts.service3Subtitle);
            }
        }
        if (texts.service3Description !== undefined) {
            // Convert text format back to HTML
            const contentEl = service3Card.querySelector('.service-content');
            if (contentEl) {
                const html = convertServiceTextToHTML(texts.service3Description);
                contentEl.innerHTML = html;
                console.log('✓ Updated service3 description (full content with features)');
            } else {
                // Fallback to just .service-description if .service-content not found
                const descEl = service3Card.querySelector('.service-description');
                if (descEl) {
                    descEl.textContent = texts.service3Description;
                    console.log('✓ Updated service3 description (description only)');
                }
            }
        }
    } else {
        console.warn('✗ Service3 card not found');
    }
    
    // Update TikTok button
    if (texts.tiktokButtonText) {
        const tiktokBtn = document.querySelector('.tiktok-cta .btn');
        if (tiktokBtn) {
            tiktokBtn.textContent = texts.tiktokButtonText;
        }
    }
    
    // Update guarantee section
    const guaranteeHeader = document.querySelector('.guarantee-header h2');
    if (guaranteeHeader) {
        if (texts.guaranteeTitle !== undefined) {
            guaranteeHeader.textContent = texts.guaranteeTitle;
            console.log('✓ Updated guarantee header:', texts.guaranteeTitle);
        }
    } else {
        console.warn('✗ Guarantee header not found');
    }
    
    // Update individual guarantee cards
    const guarantee1Card = document.querySelector('.guarantee-card[data-guarantee="1"]');
    if (guarantee1Card) {
        if (texts.guarantee1Title !== undefined) {
            const titleEl = guarantee1Card.querySelector('.guarantee-title');
            if (titleEl) {
                titleEl.textContent = texts.guarantee1Title;
                console.log('✓ Updated guarantee1 title:', texts.guarantee1Title);
            } else {
                console.warn('✗ .guarantee-title not found in guarantee1 card');
            }
        }
        if (texts.guarantee1Description !== undefined) {
            const descEl = guarantee1Card.querySelector('.guarantee-description');
            if (descEl) {
                descEl.innerHTML = texts.guarantee1Description;
                console.log('✓ Updated guarantee1 description');
            } else {
                console.warn('✗ .guarantee-description not found in guarantee1 card');
            }
        }
    } else {
        console.warn('✗ Guarantee1 card not found');
    }
    
    const guarantee2Card = document.querySelector('.guarantee-card[data-guarantee="2"]');
    if (guarantee2Card) {
        if (texts.guarantee2Title !== undefined) {
            const titleEl = guarantee2Card.querySelector('.guarantee-title');
            if (titleEl) {
                titleEl.textContent = texts.guarantee2Title;
                console.log('✓ Updated guarantee2 title:', texts.guarantee2Title);
            }
        }
        if (texts.guarantee2Description !== undefined) {
            const descEl = guarantee2Card.querySelector('.guarantee-description');
            if (descEl) {
                descEl.innerHTML = texts.guarantee2Description;
                console.log('✓ Updated guarantee2 description');
            }
        }
    } else {
        console.warn('✗ Guarantee2 card not found');
    }
    
    const guarantee3Card = document.querySelector('.guarantee-card[data-guarantee="3"]');
    if (guarantee3Card) {
        if (texts.guarantee3Title !== undefined) {
            const titleEl = guarantee3Card.querySelector('.guarantee-title');
            if (titleEl) {
                titleEl.textContent = texts.guarantee3Title;
                console.log('✓ Updated guarantee3 title:', texts.guarantee3Title);
            }
        }
        if (texts.guarantee3Description !== undefined) {
            const descEl = guarantee3Card.querySelector('.guarantee-description');
            if (descEl) {
                descEl.innerHTML = texts.guarantee3Description;
                console.log('✓ Updated guarantee3 description');
            }
        }
    } else {
        console.warn('✗ Guarantee3 card not found');
    }
    
    console.log('✅ Finished updating page texts');
    console.log('📊 Summary - Texts loaded:', Object.keys(texts).length, 'keys');
}

// Listen for site texts updates
window.addEventListener('siteTextsUpdated', () => {
    console.log('Site texts updated event received');
    // Force reload from localStorage immediately
    setTimeout(() => {
        loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
    }, 50);
});

// Also listen for storage events (cross-tab communication)
window.addEventListener('storage', (e) => {
    if (e.key === 'sofimar_site_texts') {
        console.log('Site texts storage event received', e.newValue);
        loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
    }
});

// Also poll localStorage periodically when page is visible (for same-tab updates)
if (document.visibilityState !== 'hidden') {
    let lastTextsHash = '';
    setInterval(() => {
        try {
            const stored = localStorage.getItem('sofimar_site_texts');
            if (stored) {
                const currentHash = stored;
                if (currentHash !== lastTextsHash) {
                    console.log('Detected texts change in localStorage');
                    lastTextsHash = currentHash;
                    loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }, 500); // Check every 500ms
}

// Initialize certificates and partners when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
        if (document.getElementById('certificatesGrid')) {
            loadCertificatesOnPage().catch(err => console.error('Error loading certificates:', err));
        }
        if (document.getElementById('partnersGrid')) {
            loadPartnersOnPage().catch(err => console.error('Error loading partners:', err));
        }
    });
} else {
    // DOM already loaded
    loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
    if (document.getElementById('certificatesGrid')) {
        loadCertificatesOnPage().catch(err => console.error('Error loading certificates:', err));
    }
    if (document.getElementById('partnersGrid')) {
        loadPartnersOnPage().catch(err => console.error('Error loading partners:', err));
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

