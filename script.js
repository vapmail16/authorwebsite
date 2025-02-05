// Add at the very top of script.js
console.log('Script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');

    // Mobile Navigation Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Newsletter Form Submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input').value;
            alert('Thank you for subscribing!');
            e.target.reset();
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
        contactForm.addEventListener('submit', handleFormSubmit);
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
    let allMedia = [];
    
    if (filter === 'all') {
        allMedia = [
            ...mediaData.blogs,
            ...mediaData.social,
            ...mediaData.news,
            ...mediaData.hindiNews,
            ...mediaData.printMedia,
            ...mediaData.classifieds,
            ...mediaData.otherClassifieds,
            ...mediaData.otherPlatforms
        ];
    } else {
        allMedia = mediaData[filter] || [];
    }

    const startIndex = (page - 1) * mediaPerPage;
    const endIndex = startIndex + mediaPerPage;
    const itemsToShow = allMedia.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allMedia.length / mediaPerPage);

    // Clear existing content, pagination, and count
    mediaGrid.innerHTML = '';
    const existingPagination = document.querySelector('.pagination');
    if (existingPagination) {
        existingPagination.remove();
    }
    const existingCount = document.querySelector('.media-count');
    if (existingCount) {
        existingCount.remove();
    }

    // Add media items
    itemsToShow.forEach(item => {
        const card = `
            <div class="media-card" data-category="${getCategory(item.platform)}">
                ${item.image ? `
                    <div class="media-image">
                        <img src="${item.image}" alt="${item.title}" 
                            onerror="this.onerror=null; this.src='images/placeholder.jpg';">
                    </div>
                ` : ''}
                <div class="media-content">
                    <span class="media-platform">${item.platform}</span>
                    <h3 class="media-title">${item.title}</h3>
                    <a href="${item.url}" class="media-link" target="_blank">Read Article →</a>
                </div>
            </div>
        `;
        mediaGrid.insertAdjacentHTML('beforeend', card);
    });

    // Add pagination after the grid
    const pagination = createMediaPagination(page, totalPages, filter);
    mediaGrid.insertAdjacentHTML('afterend', pagination);

    // Add count message after pagination
    const countMessage = `
        <div class="media-count">
            <p>Showing ${startIndex + 1}-${Math.min(endIndex, allMedia.length)} of ${allMedia.length} items</p>
        </div>
    `;
    document.querySelector('.pagination').insertAdjacentHTML('afterend', countMessage);
}

function createMediaPagination(currentPage, totalPages, filter) {
    let buttons = `<div class="pagination">`;
    
    // Previous button
    buttons += `<button class="pagination-button" 
        onclick="changePage(${currentPage - 1}, '${filter}')"
        ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        buttons += `<button class="pagination-button ${currentPage === i ? 'active' : ''}" 
            onclick="changePage(${i}, '${filter}')">${i}</button>`;
    }

    // Next button
    buttons += `<button class="pagination-button" 
        onclick="changePage(${currentPage + 1}, '${filter}')"
        ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
    
    buttons += `</div>`;
    return buttons;
}

function changePage(page, filter) {
    currentMediaPage = page;
    displayMediaItems(page, filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getCategory(platform) {
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

// Add meta scraping function
async function fetchMetaImage(url) {
    try {
        const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        return data.image;
    } catch (error) {
        console.error('Error fetching meta image:', error);
        return null;
    }
}

// Update initializeMediaPage to include image fetching
async function initializeMediaPage() {
    // Fetch meta images for items that don't have them
    for (const category in mediaData) {
        for (const item of mediaData[category]) {
            if (!item.image) {
                item.image = await fetchMetaImage(item.url);
            }
        }
    }
    
    displayMediaItems(1, 'all');
    
    // Add event listeners for filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.getAttribute('data-filter');
            displayMediaItems(1, filter);
        });
    });
} 