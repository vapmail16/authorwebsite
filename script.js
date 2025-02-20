// Add at the very top of script.js
console.log('Script loaded');

// Single DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');

    // Initialize pages based on current path
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('media.html')) {
        initializeMediaPage();
    } else if (currentPath.includes('apps.html')) {
        initializeAppsPage();
    } else if (currentPath.includes('writings.html')) {
        initializeWritingsPage();
    }

    // Mobile Navigation Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Reviews Section
    const reviewsContainer = document.querySelector('.reviews-container');
    const prevButton = document.querySelector('.prev-arrow');
    const nextButton = document.querySelector('.next-arrow');
    
    if (reviewsContainer && prevButton && nextButton) {
        let scrollAmount = 0;
        const cardWidth = 320;

        nextButton.addEventListener('click', () => {
            scrollAmount += cardWidth;
            if (scrollAmount > reviewsContainer.scrollWidth - reviewsContainer.clientWidth) {
                scrollAmount = 0;
            }
            reviewsContainer.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        prevButton.addEventListener('click', () => {
            scrollAmount -= cardWidth;
            if (scrollAmount < 0) {
                scrollAmount = reviewsContainer.scrollWidth - reviewsContainer.clientWidth;
            }
            reviewsContainer.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
    }

    // Navigation scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        console.log('Contact form found');
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = contactForm.querySelector('button');
            const buttonText = button.querySelector('.button-text');
            const spinner = button.querySelector('.spinner');
            const messageDiv = document.getElementById('contactMessage');

            try {
                buttonText.style.display = 'none';
                spinner.style.display = 'inline-block';
                button.disabled = true;

                // First send via EmailJS
                const emailjsResponse = await emailjs.send(
                    CONFIG.emailjs.serviceId,
                    CONFIG.emailjs.templateId,
                    {
                        from_name: contactForm.name.value,
                        from_email: contactForm.email.value,
                        message: contactForm.message.value
                    }
                );
                console.log('EmailJS Response:', emailjsResponse);

                // Try to store in Firebase if available
                if (window.db) {
                    try {
                        await window.db.collection('contactMessages').add({
                            name: contactForm.name.value,
                            email: contactForm.email.value,
                            message: contactForm.message.value,
                            date: firebase.firestore.FieldValue.serverTimestamp(),
                            status: 'new'
                        });
                        console.log('Message stored in Firebase');
                    } catch (firebaseError) {
                        console.error('Firebase storage failed:', firebaseError);
                        // Continue since EmailJS succeeded
                    }
                }

                messageDiv.textContent = 'Message sent successfully!';
                messageDiv.className = 'form-message success';
                contactForm.reset();
            } catch (error) {
                console.error('Contact form error:', error);
                messageDiv.textContent = 'Error sending message. Please try again.';
                messageDiv.className = 'form-message error';
            } finally {
                buttonText.style.display = 'inline-block';
                spinner.style.display = 'none';
                button.disabled = false;
            }
        });

        // Handle book inquiry parameters
        const urlParams = new URLSearchParams(window.location.search);
        const bookParam = urlParams.get('book');
        
        if (bookParam === 'blue-flamingo') {
            // Pre-fill subject field if it exists
            const subjectField = contactForm.querySelector('[name="subject"]');
            if (subjectField) {
                subjectField.value = 'Inquiry: The Adventures of Blue Flamingo - Personalised Book';
            }
            
            // Add a message at the top of the form
            const formHeader = document.createElement('div');
            formHeader.className = 'form-header';
            formHeader.innerHTML = `
                <h3>Inquiry about "The Adventures of Blue Flamingo - Personalised"</h3>
                <p>Please fill out the form below to learn more about personalizing this book for your child.</p>
            `;
            contactForm.insertBefore(formHeader, contactForm.firstChild);
        }
    } else {
        console.log('Contact form not found');
    }

    // Blog Posts - Only fetch if we're on the index page and blog grid exists
    const blogGrid = document.querySelector('.blog-grid');
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/');
    
    if (blogGrid && isIndexPage) {
        try {
            fetchMediumPosts();
        } catch (error) {
            console.error('Error fetching Medium posts:', error);
            handleError(error);
        }
    }

    // Media Items - Only initialize if we're on the media page
    const mediaGrid = document.querySelector('.media-grid');
    const isMediaPage = window.location.pathname.includes('media.html');
    
    if (mediaGrid && isMediaPage) {
        try {
            initializeMediaPage();
        } catch (error) {
            console.error('Error initializing media page:', error);
            mediaGrid.innerHTML = `
                <div class="error-message">
                    <p>Unable to load media items. Please try again later.</p>
                    <button onclick="initializeMediaPage()" class="cta-button">Try Again</button>
                </div>
            `;
        }
    }

    // Media Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const filter = button.getAttribute('data-filter');
                displayMediaItems(1, filter);
            });
        });
    }

    // Set active state in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPage || 
            (currentPage === 'index.html' && linkPath === './') ||
            (linkPath.includes(currentPage))) {
            link.classList.add('active');
        }
        
        // Handle hash links on index page
        if (currentPage === 'index.html' && linkPath.startsWith('#')) {
            if (window.location.hash === linkPath) {
                link.classList.add('active');
            }
        }
    });

    initializeAppsPage();

    // Initialize all forms
    initializeContactForms();
    initializeNewsletterForm();
});

// Add these variables at the top of your script
let currentPage = 1;
const postsPerPage = 6;
let allPosts = [];

// Update the fetchMediumPosts function
function fetchMediumPosts(page = 1) {
    const blogGrid = document.querySelector('.blog-grid');
    if (!blogGrid) return;

    try {
        const mediumUsername = '@vapbooksfeedback';
        const apiKey = 'xbsp8jexymlqjppjezmfhttqsdepdlehsfamkpgt';
        const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/${mediumUsername}&api_key=${apiKey}`;

        // Only fetch if it's the first page or we don't have posts yet
        if (page === 1 || allPosts.length === 0) {
            blogGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading blog posts...</p>
                </div>
            `;

            fetch(rssUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'ok' && data.items && data.items.length > 0) {
                        allPosts = data.items;
                        displayPosts(page);
                    } else {
                        throw new Error('No blog posts found');
                    }
                })
                .catch(error => handleError(error));
        } else {
            displayPosts(page);
        }
    } catch (error) {
        console.error('Error in fetchMediumPosts:', error);
        handleError(error);
    }
}

function displayPosts(page) {
    const blogGrid = document.querySelector('.blog-grid');
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = allPosts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allPosts.length / postsPerPage);

    blogGrid.innerHTML = '';

    // Add blog count header
    const blogCountHeader = `
        <div class="blog-count">
            <p>Showing ${startIndex + 1}-${Math.min(endIndex, allPosts.length)} of ${allPosts.length} posts</p>
        </div>
    `;
    blogGrid.innerHTML = blogCountHeader;

    // Display posts
    postsToShow.forEach(post => {
        const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
        const imageUrl = imgMatch ? imgMatch[1] : 'https://placehold.co/600x400?text=Blog+Post';

        const blogCard = `
            <article class="blog-card">
                <img src="${imageUrl}" alt="${post.title}" class="blog-image">
                <div class="blog-content">
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${extractExcerpt(post.content)}</p>
                    <div class="blog-meta">
                        <span>${new Date(post.pubDate).toLocaleDateString()}</span>
                        <a href="${post.link}" target="_blank" class="cta-button">Read More</a>
                    </div>
                </div>
            </article>
        `;
        blogGrid.innerHTML += blogCard;
    });

    // Add pagination
    const pagination = `
        <div class="pagination">
            ${createPaginationButtons(page, totalPages)}
        </div>
    `;
    blogGrid.innerHTML += pagination;

    // Add event listeners to pagination buttons
    document.querySelectorAll('.pagination-button').forEach(button => {
        button.addEventListener('click', () => {
            const newPage = parseInt(button.dataset.page);
            currentPage = newPage;
            displayPosts(newPage);
            // Scroll to top of blog section
            document.querySelector('#blog').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function createPaginationButtons(currentPage, totalPages) {
    let buttons = '';
    
    // Previous button
    buttons += `<button class="pagination-button" data-page="${currentPage - 1}" 
        ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        buttons += `<button class="pagination-button ${currentPage === i ? 'active' : ''}" 
            data-page="${i}">${i}</button>`;
    }

    // Next button
    buttons += `<button class="pagination-button" data-page="${currentPage + 1}" 
        ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

    return buttons;
}

function handleError(error) {
    const blogGrid = document.querySelector('.blog-grid');
    console.error('Error fetching blog posts:', error);
    blogGrid.innerHTML = `
        <div class="error-message">
            <p>Unable to load blog posts. Please try again later.</p>
            <button onclick="fetchMediumPosts(1)" class="cta-button">Try Again</button>
        </div>
    `;
}

function extractExcerpt(content) {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.textContent.slice(0, 100) + '...';
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('Form submitted');
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    const templateParams = {
        from_name: e.target.name.value,
        from_email: e.target.email.value,
        message: e.target.message.value,
        to_name: 'Vikkas Arun Pareek',
        reply_to: e.target.email.value
    };

    console.log('Sending email with params:', templateParams);

    emailjs.send(
        CONFIG.emailjs.serviceId,
        CONFIG.emailjs.templateId,
        templateParams
    )
    .then(function(response) {
        console.log('SUCCESS!', response.status, response.text);
        e.target.reset();
        showThankYouModal();
    })
    .catch(function(error) {
        console.error('FAILED...', error);
        alert('Sorry, there was an error sending your message. Please try again.');
    })
    .finally(function() {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    });
}

function showThankYouModal() {
    const modal = document.getElementById('thankYouModal');
    modal.classList.add('show');
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.getElementById('thankYouModal');
    modal.classList.remove('show');
}

// Add to your existing script.js
let currentMediaPage = 1;
const mediaPerPage = 12;

function displayMediaItems(page, filter = 'all') {
    const mediaGrid = document.querySelector('.media-grid');
    if (!mediaGrid) return;

    let itemsToShow = [];
    if (filter === 'all') {
        Object.values(mediaData).forEach(items => {
            itemsToShow = [...itemsToShow, ...items];
        });
    } else {
        itemsToShow = mediaData[filter] || [];
    }

    // Pagination
    const startIndex = (page - 1) * mediaPerPage;
    const endIndex = startIndex + mediaPerPage;
    const totalPages = Math.ceil(itemsToShow.length / mediaPerPage);

    // Sort items by date
    itemsToShow.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });

    // Get current page items
    const currentItems = itemsToShow.slice(startIndex, endIndex);

    // Clear grid
    mediaGrid.innerHTML = '';

    // Add count text
    const countText = document.createElement('div');
    countText.className = 'media-count';
    countText.textContent = `Showing ${startIndex + 1}-${Math.min(endIndex, itemsToShow.length)} of ${itemsToShow.length} items`;
    mediaGrid.appendChild(countText);

    // Create container for media cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'media-cards-container';
    mediaGrid.appendChild(cardsContainer);

    // Add media cards
    currentItems.forEach(item => {
        const card = `
            <div class="media-card" data-category="${getCategory(item.platform)}">
                <div class="media-content">
                    <span class="media-platform">${item.platform || 'Blog'}</span>
                    <h3 class="media-title">${item.title}</h3>
                    <p class="media-description">${item.description || ''}</p>
                    <div class="media-metadata">
                        <span class="media-date">${item.date ? formatDate(item.date) : ''}</span>
                    </div>
                    <a href="${item.url}" class="media-link" target="_blank" rel="noopener">
                        Read More →
                    </a>
                </div>
            </div>
        `;
        cardsContainer.insertAdjacentHTML('beforeend', card);
    });

    // Add pagination if needed
    if (totalPages > 1) {
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button';
        prevButton.textContent = '←';
        prevButton.disabled = page === 1;
        prevButton.addEventListener('click', () => displayMediaItems(page - 1, filter));
        pagination.appendChild(prevButton);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `pagination-button ${i === page ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => displayMediaItems(i, filter));
            pagination.appendChild(pageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button';
        nextButton.textContent = '→';
        nextButton.disabled = page === totalPages;
        nextButton.addEventListener('click', () => displayMediaItems(page + 1, filter));
        pagination.appendChild(nextButton);
        
        mediaGrid.appendChild(pagination);
    }
}

// Helper function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Add event listeners for filter buttons
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded'); // Debug log
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) {
        console.error('No filter buttons found');
        return;
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            console.log('Filter clicked:', filter); // Debug log
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Display filtered items
            displayMediaItems(1, filter);
        });
    });

    // Initial display
    displayMediaItems(1, 'all');
});

function getCategory(platform) {
    // Handle undefined or null platform
    if (!platform) {
        return 'blogs';  // Default category
    }

    // Social media platforms
    const socialPlatforms = [
        'Medium', 'LinkedIn', 'Reddit', 'Facebook', 'Twitter', 'X', 
        'Instagram', 'YouTube', 'Tumblr'
    ];
    
    // News platforms
    const newsPlatforms = [
        'Press News', 'PR Free', 'Corporate Hours', 'News Agency'
    ];

    // Classified platforms
    const classifiedPlatforms = [
        'Classified Ads', 'Post All Ads', 'My Free Ads', 'Tuff Classified',
        'Merchant Circle', 'Free Ad1', 'Canet Ads', 'Aunet Ads', 'US Net Ads',
        'UK Ads List', 'USA Online Classifieds', 'Classifieds4w', 'Ads4u',
        'Free Ads XYZ', 'Your Ads', 'In Net Ads', 'Hot Web Ads', 'Classtize',
        'Classifieds Guru', 'Go Local Classified', 'Quick Post India',
        'Go Free Classified', 'Free Ads Posting Site', 'Buy Now US',
        'Mix Classified', 'Post Online Ads', 'Qwik Ad', 'Quick Finds'
    ];

    // Other Classified platforms
    const otherClassifiedPlatforms = [
        'Muamat', 'Free Web Ads', 'Classified 4u', 'My Pet Ads',
        'Free Ads Online', 'Get Ads Online', 'Fold Ads', 'Great Classified',
        'Global Classified', 'Classified 4 Free', 'Pet Ads Hub', 'Free Ads Home',
        'Urs Ads', 'Ads Lov', 'E Online Ads', 'Post Here Free',
        'EZ Classified Ads', 'Instant Adz', 'Post EZ Ad', 'Lets Post Free',
        'Post Quick Ads', 'FDL Classifieds', 'Do Classifieds',
        'Classifieds 4 Free', 'Tot Ads', 'Classifieds Home',
        'Classifieds Link', 'Total Classified', 'One Buy Sales',
        'Total Classifieds'
    ];

    // Other platforms
    const otherPlatforms = [
        'Just Paste It', 'Pastebin', 'Dropmark', 'Pearltrees'
    ];
    
    // Determine category
    if (socialPlatforms.some(p => platform.toLowerCase().includes(p.toLowerCase()))) {
        return 'social';
    } else if (newsPlatforms.some(p => platform.toLowerCase().includes(p.toLowerCase()))) {
        return 'news';
    } else if (classifiedPlatforms.some(p => platform.toLowerCase().includes(p.toLowerCase()))) {
        return 'classifieds';
    } else if (otherClassifiedPlatforms.some(p => platform.toLowerCase().includes(p.toLowerCase()))) {
        return 'otherClassifieds';
    } else if (otherPlatforms.some(p => platform.toLowerCase().includes(p.toLowerCase()))) {
        return 'otherPlatforms';
    } else {
        return 'blogs';
    }
}

// Media handling functions
function initializeMediaPage() {
    if (!window.location.pathname.includes('media.html')) return;

    const mediaGrid = document.querySelector('.media-grid');
    if (!mediaGrid) return;

    let currentView = 'grid';
    let currentFilter = 'all';
    let currentPage = 1;
    const itemsPerPage = 12;

    // Initialize media display
    function displayMedia(filter = 'all', page = 1, view = 'grid') {
        const mediaItems = getAllMediaItems(filter);
        const totalPages = Math.ceil(mediaItems.length / itemsPerPage);
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedItems = mediaItems.slice(start, end);

        mediaGrid.innerHTML = `
            <div class="items-count">
                Showing ${start + 1}-${Math.min(end, mediaItems.length)} of ${mediaItems.length} items
            </div>
            <div class="media-grid-container ${view}-view">
                ${paginatedItems.map(item => createMediaCard(item, view)).join('')}
            </div>
            ${createPagination(page, totalPages, filter)}
        `;

        updateActiveStates(filter, view);
    }

    // Get all media items based on filter
    function getAllMediaItems(filter) {
        if (filter === 'all') {
            return Object.entries(mediaData).flatMap(([category, items]) => 
                items.map(item => ({...item, category}))
            );
        }
        return mediaData[filter] || [];
    }

    // Create media card HTML
    function createMediaCard(item, view) {
        return `
            <div class="media-card">
                <div class="platform">${item.platform}</div>
                <h3 class="title">${item.title}</h3>
                ${item.description ? `<p class="description">${item.description}</p>` : ''}
                ${item.date ? `<div class="date">${formatDate(item.date)}</div>` : ''}
                <a href="${item.url}" target="_blank" class="read-more" 
                   onclick="trackMediaClick('${item.category}', '${item.title}')">
                   Read More →
                </a>
            </div>
        `;
    }

    // Create pagination HTML
    function createPagination(currentPage, totalPages, filter) {
        if (totalPages <= 1) return '';
        
        let html = '<div class="pagination">';
        
        if (currentPage > 1) {
            html += `<button onclick="changePage(${currentPage - 1})" class="page-btn">←</button>`;
        }
        
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button onclick="changePage(${i})" 
                        class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>
            `;
        }
        
        if (currentPage < totalPages) {
            html += `<button onclick="changePage(${currentPage + 1})" class="page-btn">→</button>`;
        }
        
        return html + '</div>';
    }

    // Update active states
    function updateActiveStates(filter, view) {
        // Update filter buttons
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }

    // Event Listeners
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            currentPage = 1;
            displayMedia(currentFilter, currentPage, currentView);
        });
    });

    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentView = button.dataset.view;
            displayMedia(currentFilter, currentPage, currentView);
        });
    });

    // Initialize display
    displayMedia('all', 1, 'grid');

    // Expose necessary functions globally
    window.changePage = (page) => {
        currentPage = page;
        displayMedia(currentFilter, currentPage, currentView);
        mediaGrid.scrollIntoView({ behavior: 'smooth' });
    };
}

// Apps handling functions
function initializeAppsPage() {
    if (!window.location.pathname.includes('apps.html')) return;
    ['production', 'wip', 'wishlist'].forEach(loadApps);
}

function loadApps(category) {
    const containerId = {
        'production': 'production-apps',
        'wip': 'wip-apps',
        'wishlist': 'wishlist-apps'
    }[category];

    const container = document.getElementById(containerId);
    if (!container) return;

    const apps = appsData[category] || [];
    
    if (apps.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code"></i>
                <p>No ${category === 'wip' ? 'work in progress' : category} apps available yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = apps.map(app => createAppCard(app)).join('');
}

function createAppCard(app) {
    return `
        <div class="app-card">
            ${app.image ? `<img src="${app.image}" alt="${app.title}" class="app-image">` : ''}
            <div class="app-content">
                <h3 class="app-title">${app.title}</h3>
                <p class="app-description">${app.description || 'No description available'}</p>
                <div class="app-technologies">
                    ${(app.technologies || []).map(tech => `
                        <span class="tech-tag">${tech}</span>
                    `).join('')}
                </div>
                <div class="app-status">${app.status || ''}</div>
                <div class="app-links">
                    ${app.github ? `
                        <a href="${app.github}" target="_blank" class="app-link github-link">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                    ` : ''}
                    ${app.url ? `
                        <a href="${app.url}" target="_blank" class="app-link demo-link">
                            <i class="fas fa-external-link-alt"></i> Demo
                        </a>
                    ` : ''}
                    ${app.website_url ? `
                        <a href="${app.website_url}" target="_blank" class="app-link website-link">
                            <i class="fas fa-globe"></i> Website
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Writings handling
function initializeWritingsPage() {
    if (!window.location.pathname.includes('writings.html')) return;
    
    const writingsContainer = document.querySelector('.writings-grid');
    if (!writingsContainer) return;

    // Initialize filter buttons
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get filter value and display writings
            const filter = button.getAttribute('data-filter');
            displayWritings(filter);
        });
    });

    // Initial display
    displayWritings('all');
}

function displayWritings(category = 'all') {
    const writingsContainer = document.querySelector('.writings-grid');
    if (!writingsContainer) return;

    const writings = writingsData.items;
    
    if (!writings.length) {
        writingsContainer.innerHTML = '<p class="empty-message">No articles available yet.</p>';
        return;
    }

    // Sort by date descending
    const sortedWritings = [...writings].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter writings based on category
    const filteredWritings = category === 'all' 
        ? sortedWritings 
        : sortedWritings.filter(w => w.category.toLowerCase() === category.toLowerCase());

    if (filteredWritings.length === 0) {
        writingsContainer.innerHTML = `<p class="empty-message">No articles found in ${category} category.</p>`;
        return;
    }

    writingsContainer.innerHTML = filteredWritings.map(writing => createWritingCard(writing)).join('');
}

function createWritingCard(writing) {
    return `
        <div class="writing-card" data-category="${writing.category.toLowerCase()}">
            <div class="writing-content">
                <h3 class="writing-title">${writing.title}</h3>
                <p class="writing-description">${writing.description || ''}</p>
                <div class="writing-metadata">
                    <span class="writing-date">${formatDate(writing.date) || ''}</span>
                    <span class="writing-category">${writing.category || ''}</span>
                </div>
                ${writing.url ? 
                    `<a href="${writing.url}" target="_blank" class="read-more">
                        Read Full Article <i class="fas fa-external-link-alt"></i>
                    </a>` : ''
                }
            </div>
        </div>
    `;
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function trackMediaClick(category, title) {
    const clickData = JSON.parse(localStorage.getItem('linkClicks') || '{}');
    const key = `${category}-${title}`;
    clickData[key] = (clickData[key] || 0) + 1;
    localStorage.setItem('linkClicks', JSON.stringify(clickData));
}

// Contact form handling
function initializeContactForms() {
    // Main contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Book inquiry form
    const ideaForm = document.getElementById('ideaForm');
    if (ideaForm) {
        ideaForm.addEventListener('submit', handleContactSubmit);
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('.spinner');
    const messageDiv = form.querySelector('.form-message') || document.createElement('div');
    
    if (!form.querySelector('.form-message')) {
        messageDiv.className = 'form-message';
        form.appendChild(messageDiv);
    }

    try {
        // Disable button and show spinner
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        // Get form data
        const templateParams = {
            from_name: form.querySelector('[name="name"]').value,
            from_email: form.querySelector('[name="email"]').value,
            message: form.querySelector('[name="message"]').value,
            to_name: 'Vikkas Arun Pareek',
            reply_to: form.querySelector('[name="email"]').value
        };

        // Add subject for book inquiry
        if (form.id === 'ideaForm') {
            templateParams.subject = 'Book Inquiry: The Adventures of Blue Flamingo - Personalised';
        }

        // Send email using EmailJS
        await emailjs.send(
            CONFIG.emailjs.serviceId,
            CONFIG.emailjs.templateId,
            templateParams
        );

        // Show success message
        messageDiv.textContent = 'Message sent successfully!';
        messageDiv.className = 'form-message success';
        form.reset();

        // Show modal if it exists
        const modal = document.getElementById('thankYouModal');
        if (modal) {
            modal.classList.add('show');
        }

    } catch (error) {
        console.error('Form submission error:', error);
        messageDiv.textContent = 'Error sending message. Please try again.';
        messageDiv.className = 'form-message error';
    } finally {
        // Re-enable button and hide spinner
        buttonText.style.display = 'inline-block';
        spinner.style.display = 'none';
        button.disabled = false;
    }
}

// Newsletter subscription handling
function initializeNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const button = newsletterForm.querySelector('button');
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');
        const messageDiv = document.getElementById('newsletterMessage');

        if (!messageDiv) {
            console.error('Newsletter message div not found');
            return;
        }

        try {
            // Disable button and show spinner
            buttonText.style.display = 'none';
            spinner.style.display = 'inline-block';
            button.disabled = true;

            const email = newsletterForm.querySelector('[name="email"]').value;

            // Send subscription notification email
            await emailjs.send(
                CONFIG.emailjs.serviceId,
                CONFIG.emailjs.templateId,
                {
                    from_name: 'Newsletter Subscription',
                    from_email: email,
                    to_name: 'Vikkas Arun Pareek',
                    message: `New newsletter subscription request from: ${email}`,
                    subject: 'New Newsletter Subscription',
                    reply_to: email
                }
            );

            messageDiv.textContent = 'Thank you for subscribing!';
            messageDiv.className = 'form-message success';
            newsletterForm.reset();

        } catch (error) {
            console.error('Subscription error:', error);
            messageDiv.textContent = 'Error subscribing. Please try again later.';
            messageDiv.className = 'form-message error';
        } finally {
            buttonText.style.display = 'inline-block';
            spinner.style.display = 'none';
            button.disabled = false;
        }
    });
}