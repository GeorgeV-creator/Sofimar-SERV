// API Base URL - detect Vercel or local
const API_BASE_URL = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('localhost') === false
    ? `${window.location.protocol}//${window.location.hostname}/api`
    : `http://${window.location.hostname}:8001/api`;

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
            const response = await fetch(`${API_BASE_URL}/messages`, {
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
            console.error('API server not available, message not saved:', error);
            alert('Eroare: serverul nu este disponibil. Mesajul nu a fost trimis.');
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

// Chatbot responses - loaded from API
let chatbotResponses = {};

// Load chatbot responses from API
async function loadChatbotResponses() {
    try {
        const response = await fetch(`${API_BASE_URL}/chatbot-responses`);
        if (response.ok) {
            chatbotResponses = await response.json();
            console.log('Chatbot responses loaded:', Object.keys(chatbotResponses).length, 'responses');
        } else {
            console.error('Failed to load chatbot responses, using defaults');
            // Fallback to default responses if API fails
            chatbotResponses = {
                'default': 'Vă mulțumim pentru întrebare! Pentru informații detaliate despre serviciile noastre de deratizare, dezinsecție sau dezinfecție, vă rugăm să ne contactați direct. Oferim consultație gratuită și intervenție rapidă în 24 de ore pentru probleme urgente.'
            };
        }
    } catch (error) {
        console.error('Error loading chatbot responses:', error);
        chatbotResponses = {
            'default': 'Vă mulțumim pentru întrebare! Pentru informații detaliate despre serviciile noastre de deratizare, dezinsecție sau dezinfecție, vă rugăm să ne contactați direct. Oferim consultație gratuită și intervenție rapidă în 24 de ore pentru probleme urgente.'
        };
    }
}

function getChatbotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Check for keywords
    for (const [keyword, response] of Object.entries(chatbotResponses)) {
        if (keyword !== 'default' && message.includes(keyword)) {
            return response;
        }
    }
    
    // Return default response
    return chatbotResponses.default || 'Vă mulțumim pentru întrebare! Pentru informații detaliate despre serviciile noastre, vă rugăm să ne contactați direct.';
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
    
    // Save user message immediately
    const userMessage = {
        type: 'user',
        message: message,
        timestamp: new Date().toISOString()
    };
    
    // Try to save to API server
    fetch(`${API_BASE_URL}/chatbot`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userMessage)
    }).catch(error => {
        console.error('API server not available, chatbot message not saved:', error);
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
        fetch(`${API_BASE_URL}/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(botMessage)
        }).catch(error => {
            console.error('API server not available, chatbot response not saved:', error);
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

// TikTok Videos - Simple and clean implementation
const TIKTOK_USERNAME = 'sofimar_serv.srl';

// Get TikTok video IDs from API or use defaults
async function getTikTokVideoIds() {
    try {
        const response = await fetch(`${API_BASE_URL}/tiktok-videos`);
        if (response.ok) {
            const videos = await response.json();
            if (Array.isArray(videos) && videos.length > 0) {
                return videos;
            }
        }
    } catch (error) {
        console.warn('Could not load TikTok videos from API:', error);
    }
    // Default video IDs
    return [
        '7567003645250702614',
        '7564125179761167638',
        '7556587113244937475'
    ];
}

// Create TikTok embed blockquote
function createTikTokEmbed(videoId) {
    const videoUrl = `https://www.tiktok.com/@${TIKTOK_USERNAME}/video/${videoId}`;
    return `
        <div class="tiktok-video-wrapper">
            <blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoId}" style="max-width: 325px; min-width: 325px;">
                <section>
                    <a target="_blank" title="@${TIKTOK_USERNAME}" href="${videoUrl}">@${TIKTOK_USERNAME}</a>
                </section>
            </blockquote>
        </div>
    `;
}

// Load and display TikTok videos
async function loadTikTokVideos() {
    const carousel = document.getElementById('tiktokCarousel');
    if (!carousel) return;
    
    try {
        // Get video IDs
        const videoIds = await getTikTokVideoIds();
        
        if (!videoIds || videoIds.length === 0) {
            carousel.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nu sunt video-uri disponibile momentan.</p>';
            return;
        }
        
        // Clear and create embeds
        carousel.innerHTML = '';
        
        // Add videos (multiple duplicates for longer seamless loop)
        // Add 4 sets for a longer loop
        for (let i = 0; i < 4; i++) {
            videoIds.forEach(id => carousel.innerHTML += createTikTokEmbed(id));
        }
        
        // Load TikTok embed script if not already loaded
        if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.head.appendChild(script);
        }
        
        // Wait for script to load, then render
        const checkAndRender = setInterval(() => {
            if (window.tiktokEmbed && window.tiktokEmbed.lib) {
                clearInterval(checkAndRender);
                try {
                    window.tiktokEmbed.lib.render();
                    // Start animation after videos are rendered
                    setTimeout(() => {
                        const iframes = carousel.querySelectorAll('.tiktok-video-wrapper iframe');
                        if (iframes.length > 0) {
                            carousel.classList.add('animate');
                        }
                    }, 2000);
                } catch (error) {
                    console.error('Error rendering TikTok embeds:', error);
                }
            }
        }, 200);
        
        // Timeout after 10 seconds
        setTimeout(() => clearInterval(checkAndRender), 10000);
        
    } catch (error) {
        console.error('Error loading TikTok videos:', error);
        carousel.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Eroare la încărcarea video-urilor.</p>';
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

// Track page visits (IP-based via server)
function trackPageVisit() {
    try {
        fetch(`${API_BASE_URL}/track-visit`, { method: 'GET' }).catch(() => {});
    } catch (e) {}
}

// TikTok Embed Loader with Autoplay
document.addEventListener('DOMContentLoaded', () => {
    // Track page visit
    trackPageVisit();
    
    loadTikTokVideos().catch(err => console.error('Error loading TikTok videos:', err));
    // Initialize Romania map - wait for everything to load
    function tryInitMap() {
        if (typeof L !== 'undefined') {
            console.log('Leaflet loaded, initializing map...');
            initRomaniaMap().catch(err => console.error('Error initializing map:', err));
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
    console.log('📍 Locations updated event received, reloading map...');
    const mapContainer = document.getElementById('romaniaMap');
    if (mapContainer) {
        // Remove existing map instance if it exists
        if (romaniaMapInstance) {
            romaniaMapInstance.remove();
            romaniaMapInstance = null;
        }
        // Clear map container
        mapContainer.innerHTML = '';
        // Reinitialize map with new locations from API
        setTimeout(() => {
            initRomaniaMap().catch(err => console.error('Error reinitializing map:', err));
        }, 100);
    } else {
        console.warn('Map container not found, cannot update locations');
    }
});

// Listen for certificate updates from admin panel
window.addEventListener('certificatesUpdated', () => {
    if (document.getElementById('certificatesGrid') || document.getElementById('accreditationsGrid')) {
        loadCertificatesOnPage().catch(err => console.error('Error loading certificates:', err));
    }
});

window.addEventListener('partnersUpdated', () => {
    if (document.getElementById('partnersGrid')) {
        loadPartnersOnPage().catch(err => console.error('Error loading partners:', err));
    }
});

// Romania Map with Office Locations
async function initRomaniaMap() {
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
            zoomControl: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            dragging: true
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

    // Load office locations from API or use defaults
    let officeLocations = [];
    
    try {
        const response = await fetch(`${API_BASE_URL}/locations`);
        if (response.ok) {
            officeLocations = await response.json();
            console.log('Loaded locations from API:', officeLocations.length);
        }
    } catch (e) {
        console.warn('Error loading locations from API:', e);
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

// Load partners from API
async function loadPartnersOnPage() {
    const partnersGrid = document.getElementById('partnersGrid');
    if (!partnersGrid) {
        console.log('partnersGrid not found');
        return;
    }
    
    let partners = [];
    
    try {
        // Try to fetch from API server
        const response = await fetch(`${API_BASE_URL}/partners`);
        if (response.ok) {
            partners = await response.json();
            if (!Array.isArray(partners)) {
                console.error('❌ Partners data from API is not an array:', typeof partners, partners);
                partners = [];
            }
        } else {
            const errorText = await response.text();
            console.error('❌ API response not OK:', response.status, errorText);
            throw new Error(`API response not OK: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ API server not available, partners not loaded:', error);
        partners = [];
    }
    
    // Clear existing partners
    if (partners.length === 0) {
        partnersGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">Nu există parteneri adăugați momentan.</p>';
        return;
    }
    
    partnersGrid.innerHTML = partners.map(partner => {
        const isBase64 = partner.image && partner.image.startsWith('data:image');
        let imageSrc = partner.image || '';
        
        // If image is a path (not base64), ensure it starts with / for absolute path
        if (!isBase64 && imageSrc && !imageSrc.startsWith('http') && !imageSrc.startsWith('/') && !imageSrc.startsWith('data:')) {
            // Add leading slash if it's a relative path like "images/file.jpg"
            imageSrc = imageSrc.startsWith('images/') ? '/' + imageSrc : imageSrc;
        }
        
        const title = partner.title || 'Partner';
        const escapedTitle = escapeHtml(title);
        const escapedImageSrc = imageSrc.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        // Add error handler for missing images
        const onErrorHandler = `this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'150\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'200\\' height=\\'150\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3E📷 Imagine indisponibilă%3C/text%3E%3C/svg%3E';`;
        
        return `
            <div class="partner-item">
                <img src="${escapedImageSrc}" alt="${escapedTitle}" loading="lazy" style="width: 5cm; height: 5cm; object-fit: contain;" onerror="${onErrorHandler}">
            </div>
        `;
    }).join('');
}

// Load certificates from API - optimized for instant loading
async function loadCertificatesOnPage() {
    const certificatesGrid = document.getElementById('certificatesGrid');
    const accreditationsGrid = document.getElementById('accreditationsGrid');
    const certificatesContent = document.getElementById('certificatesContent');
    
    // Check if we're on certificate.html (has two columns) or index.html (single grid)
    const isCertificatePage = certificatesGrid && accreditationsGrid;
    
    if (!certificatesGrid && !accreditationsGrid) {
        console.log('certificatesGrid not found');
        return;
    }
    
    // Use pre-fetched data from inline script if available
    let certificates = window.__certificatesData;
    
    if (!certificates) {
        // Fallback: fetch if not pre-loaded
        try {
            const response = await fetch(`${API_BASE_URL}/certificates`, {
                cache: 'default',
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                certificates = await response.json();
                if (!Array.isArray(certificates)) {
                    console.error('❌ Certificates data from API is not an array:', typeof certificates, certificates);
                    certificates = [];
                }
            } else {
                certificates = [];
            }
        } catch (error) {
            console.error('❌ API server not available, certificates not loaded:', error);
            certificates = [];
        }
    }

    // Helper function to create certificate HTML - lazy loading, skeleton, fade-in
    const createCertificateHTML = (cert) => {
        const isBase64 = cert.image && cert.image.startsWith('data:image');
        let imageSrc = cert.image || '';
        
        if (!isBase64 && imageSrc && !imageSrc.startsWith('http') && !imageSrc.startsWith('/') && !imageSrc.startsWith('data:')) {
            imageSrc = imageSrc.startsWith('images/') ? '/' + imageSrc : imageSrc;
        }
        
        const title = cert.title || 'Certificat fără titlu';
        const escapedTitle = escapeHtml(title);
        const escapedImageSrc = imageSrc.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const escapedTitleForOnclick = escapedTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        const onErrorHandler = `this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'300\\' height=\\'200\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3E📷 Imagine indisponibilă%3C/text%3E%3C/svg%3E'; this.closest('.certificate-image-container').classList.add('loaded');`;
        const onLoadHandler = `this.closest('.certificate-image-container').classList.add('loaded');`;
        
        return `
            <div class="certificate-item">
                <h3 class="certificate-title">${escapedTitle}</h3>
                <div class="certificate-image-container" onclick="openCertificateModal('${escapedImageSrc}', '${escapedTitleForOnclick}')">
                    <div class="certificate-skeleton" aria-hidden="true"></div>
                    <img src="${escapedImageSrc}" alt="${escapedTitle}" class="certificate-image" loading="lazy" decoding="async" onload="${onLoadHandler}" onerror="${onErrorHandler}">
                </div>
            </div>
        `;
    };

    if (isCertificatePage) {
        const certs = certificates.filter(cert => (cert.type || 'certificat') === 'certificat');
        const accreds = certificates.filter(cert => (cert.type || 'certificat') === 'acreditare');
        
        if (certificatesGrid) {
            certificatesGrid.innerHTML = certs.length > 0 
                ? certs.map(createCertificateHTML).join('')
                : '<p class="empty-state">Nu există certificate disponibile.</p>';
        }
        
        if (accreditationsGrid) {
            accreditationsGrid.innerHTML = accreds.length > 0
                ? accreds.map(createCertificateHTML).join('')
                : '<p class="empty-state">Nu există acreditări disponibile.</p>';
        }
    } else {
        // Single grid (for index.html or other pages)
        if (certificatesGrid) {
            if (certificates.length === 0) {
                certificatesGrid.innerHTML = '';
                return;
            }
            certificatesGrid.innerHTML = certificates.map(createCertificateHTML).join('');
        }
    }
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
        const response = await fetch(`${API_BASE_URL}/site-texts`);
        if (response.ok) {
            texts = await response.json();
            console.log('Loaded texts from API:', texts);
        } else {
            throw new Error('API response not OK');
        }
    } catch (error) {
        console.error('API server not available, site texts not loaded:', error);
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

// Listen for site texts updates (same tab only)
window.addEventListener('siteTextsUpdated', () => {
    console.log('Site texts updated event received');
    // Reload from API
    setTimeout(() => {
        loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
    }, 50);
});

// Poll API periodically to check for text updates (for cross-tab updates)
// This ensures index.html updates even if admin is open in another tab
let lastTextsHash = null;
let pollingErrorCount = 0;
const MAX_POLLING_ERRORS = 3;

setInterval(async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/site-texts`);
        if (response.ok) {
            pollingErrorCount = 0; // Reset error count on success
            const texts = await response.json();
            // Create a simple hash of the texts to detect changes
            const currentHash = JSON.stringify(texts);
            if (lastTextsHash !== null && currentHash !== lastTextsHash) {
                console.log('Site texts changed in database, reloading...');
                loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
            }
            lastTextsHash = currentHash;
        } else if (response.status === 500) {
            pollingErrorCount++;
            // Stop polling if too many errors
            if (pollingErrorCount >= MAX_POLLING_ERRORS) {
                console.warn('Too many polling errors, stopping periodic checks');
                return; // This will stop the interval
            }
        }
    } catch (error) {
        pollingErrorCount++;
        // Stop polling if too many errors
        if (pollingErrorCount >= MAX_POLLING_ERRORS) {
            console.warn('Too many polling errors, stopping periodic checks');
            return; // This will stop the interval
        }
    }
}, 5000); // Check every 5 seconds (reduced frequency)

// Initialize certificates and partners when page loads (lazy loading with delay)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Load site texts first (lightweight)
        loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
        
        // Load certificates immediately for certificate.html (no delay)
        if (document.getElementById('certificatesGrid') || document.getElementById('accreditationsGrid')) {
            loadCertificatesOnPage().catch(err => console.error('Error loading certificates:', err));
        }
        
        // Load partners after certificates (small delay only for partners)
        setTimeout(() => {
            if (document.getElementById('partnersGrid')) {
                loadPartnersOnPage().catch(err => console.error('Error loading partners:', err));
            }
        }, 100);
    });
} else {
    // DOM already loaded - load certificates immediately
    loadSiteTexts().catch(err => console.error('Error loading site texts:', err));
    if (document.getElementById('certificatesGrid') || document.getElementById('accreditationsGrid')) {
        loadCertificatesOnPage().catch(err => console.error('Error loading certificates:', err));
    }
    setTimeout(() => {
        if (document.getElementById('partnersGrid')) {
            loadPartnersOnPage().catch(err => console.error('Error loading partners:', err));
        }
    }, 100);
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

// Custom reviews (GET /api/reviews)
async function loadReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        if (!response.ok) {
            reviewsContainer.innerHTML = '<div class="reviews-loading"><p>Nu există recenzii disponibile momentan.</p></div>';
            return;
        }
        const allReviews = await response.json();
        if (!Array.isArray(allReviews) || allReviews.length === 0) {
            reviewsContainer.innerHTML = '<div class="reviews-loading"><p>Nu există recenzii disponibile momentan.</p></div>';
            return;
        }

        const shuffled = [...allReviews].sort(() => 0.5 - Math.random());
        const selectedReviews = shuffled.slice(0, 6);

        reviewsContainer.innerHTML = selectedReviews.map(review => {
            const name = review.author || review.name || 'Anonim';
            const text = review.comment || review.text || '';
            const rating = review.rating || 0;
            const date = review.date || '';
            if (!rating || !text) return '';
            const stars = '⭐'.repeat(rating);
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            let formattedDate = date;
            try {
                const d = new Date(date);
                if (!isNaN(d)) formattedDate = d.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch (e) {}
            return `
                <div class="review-card">
                    <div class="review-card-top">
                        <div class="review-avatar">${escapeHtml(initials)}</div>
                        <div class="review-meta">
                            <h4 class="review-author-name">${escapeHtml(name)}</h4>
                            <span class="review-rating">${stars}</span>
                        </div>
                    </div>
                    <p class="review-date">${escapeHtml(formattedDate)}</p>
                    <p class="review-text">${escapeHtml(text)}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        reviewsContainer.innerHTML = '<div class="reviews-loading"><p>Nu există recenzii disponibile momentan.</p></div>';
    }
}

function initReviewsNav() {
    const slider = document.getElementById('reviewsContainer');
    const prevBtn = document.getElementById('reviewsPrevBtn');
    const nextBtn = document.getElementById('reviewsNextBtn');
    const sliderWrap = document.querySelector('.reviews-slider-wrap');
    if (!slider) return;

    const scrollAmount = 320;
    if (prevBtn) prevBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    let reviewsAutoPlayInterval = null;
    const INTERVAL_MS = 3000;

    function scrollToNextCard() {
        const cards = slider.querySelectorAll('.review-card');
        if (cards.length <= 1) return;
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        if (maxScroll <= 0) return;
        const nextPos = slider.scrollLeft + scrollAmount;
        if (nextPos >= maxScroll) {
            slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    function startAutoPlay() {
        if (reviewsAutoPlayInterval) return;
        reviewsAutoPlayInterval = setInterval(scrollToNextCard, INTERVAL_MS);
    }

    function stopAutoPlay() {
        if (reviewsAutoPlayInterval) {
            clearInterval(reviewsAutoPlayInterval);
            reviewsAutoPlayInterval = null;
        }
    }

    if (sliderWrap) {
        sliderWrap.addEventListener('mouseenter', stopAutoPlay);
        sliderWrap.addEventListener('mouseleave', startAutoPlay);
        sliderWrap.addEventListener('touchstart', stopAutoPlay, { passive: true });
        sliderWrap.addEventListener('touchend', () => setTimeout(startAutoPlay, 2000));
    }
    startAutoPlay();
}

function initReviewForm() {
    const form = document.getElementById('reviewForm');
    const msgEl = document.getElementById('reviewFormMessage');
    const starRating = document.getElementById('starRating');
    const reviewRating = document.getElementById('reviewRating');
    if (!form || !starRating || !reviewRating) return;

    let currentRating = 5;
    starRating.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRating = parseInt(btn.getAttribute('data-rating'), 10);
            reviewRating.value = currentRating;
            starRating.querySelectorAll('.star-btn').forEach(b => {
                const r = parseInt(b.getAttribute('data-rating'), 10);
                b.classList.toggle('active', r <= currentRating);
                b.style.color = r <= currentRating ? '#FFB800' : '#ddd';
            });
        });
    });
    starRating.querySelectorAll('.star-btn').forEach(b => {
        const r = parseInt(b.getAttribute('data-rating'), 10);
        b.style.color = r <= 5 ? '#FFB800' : '#ddd';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = (document.getElementById('reviewName')?.value || '').trim();
        const comment = (document.getElementById('reviewComment')?.value || '').trim();
        const rating = parseInt(reviewRating.value, 10) || 5;
        if (!author || !comment) {
            if (msgEl) { msgEl.textContent = 'Completează numele și mesajul.'; msgEl.style.color = '#c00'; }
            return;
        }
        if (msgEl) msgEl.textContent = '';
        try {
            const res = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, rating, comment })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                if (msgEl) { msgEl.textContent = 'Mulțumim! Recenzia a fost trimisă.'; msgEl.style.color = 'var(--primary-color, #1a5f3f)'; }
                form.reset();
                reviewRating.value = '5';
                currentRating = 5;
                starRating.querySelectorAll('.star-btn').forEach(b => { b.style.color = '#FFB800'; });
            } else {
                if (msgEl) { msgEl.textContent = data.error || 'Eroare la trimitere.'; msgEl.style.color = '#c00'; }
            }
        } catch (err) {
            if (msgEl) { msgEl.textContent = 'Eroare de conexiune.'; msgEl.style.color = '#c00'; }
        }
    });
}

function initPage() {
    loadReviews();
    loadChatbotResponses();
    initReviewForm();
    initReviewsNav();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

