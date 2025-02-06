let googleUser = null;

function onSignIn(user) {
    googleUser = user;
    document.querySelector('.g-signin2').style.display = 'none';
    document.querySelector('.signout-btn').style.display = 'block';
    
    // Initialize Search Console API after sign-in
    initializeSearchConsole();
}

function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => {
        googleUser = null;
        document.querySelector('.g-signin2').style.display = 'block';
        document.querySelector('.signout-btn').style.display = 'none';
    });
}

async function initializeSearchConsole() {
    await gapi.client.init({
        apiKey: GSC_CONFIG.API_KEY,
        clientId: GSC_CONFIG.CLIENT_ID,
        scope: GSC_CONFIG.SCOPES.join(' ')
    });
    
    // Initialize indexing status check
    await indexingStatus.checkIndexingStatus();
}

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const contentSections = document.querySelectorAll('.content-section');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabId}-section`).classList.add('active');
        });
    });

    // Handle Media Form Submission
    const mediaForm = document.getElementById('media-form');
    mediaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newMedia = {
            title: document.getElementById('media-title').value,
            url: document.getElementById('media-url').value,
            category: document.getElementById('media-category').value,
            date: document.getElementById('media-date').value,
            description: document.getElementById('media-description').value
        };

        // Get existing media data
        let mediaData = JSON.parse(localStorage.getItem('mediaData')) || {};
        if (!mediaData[newMedia.category]) {
            mediaData[newMedia.category] = [];
        }
        
        // Add new media
        mediaData[newMedia.category].push(newMedia);
        
        // Save to localStorage
        localStorage.setItem('mediaData', JSON.stringify(mediaData));
        
        // Reset form and update display
        mediaForm.reset();
        displayMediaLinks();
    });

    // Handle Writings Form Submission
    const writingsForm = document.getElementById('writings-form');
    writingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newWriting = {
            title: document.getElementById('writing-title').value,
            url: document.getElementById('writing-url').value,
            category: document.getElementById('writing-category').value,
            publication: document.getElementById('writing-publication').value,
            date: document.getElementById('writing-date').value,
            description: document.getElementById('writing-description').value
        };

        // Get existing writings data
        let writingsData = JSON.parse(localStorage.getItem('writingsData')) || {};
        if (!writingsData[newWriting.category]) {
            writingsData[newWriting.category] = [];
        }
        
        // Add new writing
        writingsData[newWriting.category].push(newWriting);
        
        // Save to localStorage
        localStorage.setItem('writingsData', JSON.stringify(writingsData));
        
        // Reset form and update display
        writingsForm.reset();
        displayWritingLinks();
    });

    // Display existing links
    function displayMediaLinks() {
        const mediaList = document.getElementById('media-links-list');
        const mediaData = JSON.parse(localStorage.getItem('mediaData')) || {};
        
        let html = '';
        let allMedia = [];
        
        for (const category in mediaData) {
            allMedia = [...allMedia, ...mediaData[category].map(item => ({...item, category}))];
        }
        
        // Sort by date (most recent first)
        allMedia.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        allMedia.forEach((item, index) => {
            html += `
                <div class="link-item">
                    <div class="link-info">
                        <h4>${item.title}</h4>
                        <p>${item.category} - ${item.date}</p>
                    </div>
                    <div class="link-actions">
                        <button class="edit-btn" onclick="editMediaLink('${item.category}', ${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteMediaLink('${item.category}', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        mediaList.innerHTML = html;
    }

    function displayWritingLinks() {
        const writingsList = document.getElementById('writings-links-list');
        const writingsData = JSON.parse(localStorage.getItem('writingsData')) || {};
        
        let html = '';
        let allWritings = [];
        
        for (const category in writingsData) {
            allWritings = [...allWritings, ...writingsData[category].map(item => ({...item, category}))];
        }
        
        // Sort by date (most recent first)
        allWritings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        allWritings.forEach((item, index) => {
            html += `
                <div class="link-item">
                    <div class="link-info">
                        <h4>${item.title}</h4>
                        <p>${item.publication} - ${item.date}</p>
                    </div>
                    <div class="link-actions">
                        <button class="edit-btn" onclick="editWritingLink('${item.category}', ${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteWritingLink('${item.category}', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        writingsList.innerHTML = html;
    }

    // Initial display
    displayMediaLinks();
    displayWritingLinks();
});

// Edit and Delete functions
function editMediaLink(category, index) {
    const mediaData = JSON.parse(localStorage.getItem('mediaData'));
    const item = mediaData[category][index];
    
    // Populate form
    document.getElementById('media-title').value = item.title;
    document.getElementById('media-url').value = item.url;
    document.getElementById('media-category').value = category;
    document.getElementById('media-date').value = item.date;
    document.getElementById('media-description').value = item.description;
    
    // Remove old item
    mediaData[category].splice(index, 1);
    localStorage.setItem('mediaData', JSON.stringify(mediaData));
    displayMediaLinks();
}

function deleteMediaLink(category, index) {
    if (confirm('Are you sure you want to delete this item?')) {
        const mediaData = JSON.parse(localStorage.getItem('mediaData'));
        mediaData[category].splice(index, 1);
        localStorage.setItem('mediaData', JSON.stringify(mediaData));
        displayMediaLinks();
    }
}

function editWritingLink(category, index) {
    const writingsData = JSON.parse(localStorage.getItem('writingsData'));
    const item = writingsData[category][index];
    
    // Populate form
    document.getElementById('writing-title').value = item.title;
    document.getElementById('writing-url').value = item.url;
    document.getElementById('writing-category').value = category;
    document.getElementById('writing-publication').value = item.publication;
    document.getElementById('writing-date').value = item.date;
    document.getElementById('writing-description').value = item.description;
    
    // Remove old item
    writingsData[category].splice(index, 1);
    localStorage.setItem('writingsData', JSON.stringify(writingsData));
    displayWritingLinks();
}

function deleteWritingLink(category, index) {
    if (confirm('Are you sure you want to delete this item?')) {
        const writingsData = JSON.parse(localStorage.getItem('writingsData'));
        writingsData[category].splice(index, 1);
        localStorage.setItem('writingsData', JSON.stringify(writingsData));
        displayWritingLinks();
    }
}

// SEO Management Functions
const seoKeywords = {
    loadKeywords: async (page) => {
        // Load keywords from localStorage or your backend
        const keywords = JSON.parse(localStorage.getItem(`seoKeywords_${page}`)) || {
            primary: [],
            secondary: [],
            'long-tail': []
        };
        return keywords;
    },

    saveKeywords: async (page, type, keywords) => {
        const currentKeywords = await seoKeywords.loadKeywords(page);
        currentKeywords[type] = keywords.split(',').map(k => k.trim());
        localStorage.setItem(`seoKeywords_${page}`, JSON.stringify(currentKeywords));
        
        // Update meta tags if on the relevant page
        if (window.location.pathname.includes(page)) {
            seoKeywords.updateMetaTags(page);
        }
    },

    updateMetaTags: async (page) => {
        const keywords = await seoKeywords.loadKeywords(page);
        const allKeywords = [
            ...keywords.primary,
            ...keywords.secondary,
            ...keywords['long-tail']
        ].join(', ');

        // Update meta keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.setAttribute('name', 'keywords');
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', allKeywords);
    }
};

// Google Search Console Integration
const searchConsole = {
    auth: null,

    async initialize() {
        try {
            await this.loadGAPIClient();
            await this.authenticate();
            return true;
        } catch (error) {
            console.error('GSC initialization failed:', error);
            return false;
        }
    },

    async loadGAPIClient() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: GSC_CONFIG.API_KEY,
                        clientId: GSC_CONFIG.CLIENT_ID,
                        scope: GSC_CONFIG.SCOPES.join(' ')
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    },

    async authenticate() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance.isSignedIn.get()) {
                await authInstance.signIn();
            }
            this.auth = authInstance.currentUser.get();
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    },

    async fetchSearchAnalytics(startDate, endDate, dimensions = ['query']) {
        try {
            const response = await gapi.client.webmasters.searchanalytics.query({
                siteUrl: GSC_CONFIG.SITE_URL,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions,
                    rowLimit: 100
                }
            });
            return response.result.rows || [];
        } catch (error) {
            console.error('Failed to fetch search analytics:', error);
            return [];
        }
    }
};

// Update seoAnalytics object with real data
const seoAnalytics = {
    async fetchAnalytics(page = 'all', period = 30) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - period * 86400000).toISOString().split('T')[0];

        try {
            if (!searchConsole.auth) {
                await searchConsole.initialize();
            }

            const [queryData, pageData] = await Promise.all([
                searchConsole.fetchSearchAnalytics(startDate, endDate, ['query']),
                searchConsole.fetchSearchAnalytics(startDate, endDate, ['page'])
            ]);

            return {
                impressions: this.processTimeseriesData(pageData),
                keywords: this.processKeywordData(queryData),
                pagePerformance: this.processPageData(pageData)
            };
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            return this.getMockData(period); // Fallback to mock data
        }
    },

    processTimeseriesData(data) {
        return data.map(row => ({
            date: row.keys[0],
            value: row.impressions
        }));
    },

    processKeywordData(data) {
        return data.map(row => ({
            keyword: row.keys[0],
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: `${(row.ctr * 100).toFixed(2)}%`
        }));
    },

    processPageData(data) {
        return data.map(row => ({
            page: row.keys[0].replace(GSC_CONFIG.SITE_URL, ''),
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: `${(row.ctr * 100).toFixed(2)}%`
        }));
    }
};

// Event Listeners
document.getElementById('keyword-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const page = document.getElementById('page-select').value;
    const type = document.getElementById('keyword-type').value;
    const keywords = document.getElementById('keywords').value;
    
    await seoKeywords.saveKeywords(page, type, keywords);
    alert('Keywords updated successfully!');
});

document.getElementById('analytics-page')?.addEventListener('change', async (e) => {
    const page = e.target.value;
    const period = document.getElementById('analytics-period').value;
    const data = await seoAnalytics.fetchAnalytics(page, parseInt(period));
    seoAnalytics.displayAnalytics(data);
});

document.getElementById('analytics-period')?.addEventListener('change', async (e) => {
    const period = parseInt(e.target.value);
    const page = document.getElementById('analytics-page').value;
    const data = await seoAnalytics.fetchAnalytics(page, period);
    seoAnalytics.displayAnalytics(data);
});

// Keyword Suggestions Feature
const keywordSuggestions = {
    async getKeywordIdeas(seed) {
        try {
            // Try KeywordTool.io first
            let suggestions = await this.fetchKeywordToolSuggestions(seed);
            
            if (!suggestions || suggestions.length === 0) {
                // Fallback to SEMrush
                suggestions = await this.fetchSemrushSuggestions(seed);
            }
            
            if (!suggestions || suggestions.length === 0) {
                // Fallback to SerpApi
                suggestions = await this.fetchSerpApiSuggestions(seed);
            }

            return this.processKeywordSuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching keyword suggestions:', error);
            return null;
        }
    },

    async fetchKeywordToolSuggestions(keyword) {
        const response = await fetch(`${CONFIG.seo.keywordtool.endpoint}/search/suggestions/google`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CONFIG.seo.keywordtool.apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                keyword: keyword,
                country: 'US',
                language: 'en'
            }
        });
        return await response.json();
    },

    async fetchSemrushSuggestions(keyword) {
        const response = await fetch(`${CONFIG.seo.semrush.endpoint}/keywords_suggestions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CONFIG.seo.semrush.apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                keyword: keyword,
                database: 'us'
            }
        });
        return await response.json();
    },

    async fetchSerpApiSuggestions(keyword) {
        const response = await fetch(`${CONFIG.seo.serpapi.endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CONFIG.seo.serpapi.apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                q: keyword,
                engine: 'google',
                location: 'United States'
            }
        });
        return await response.json();
    },

    processKeywordSuggestions(data) {
        // Process and normalize data from different sources
        return {
            related: this.normalizeKeywordData(data.related_keywords || []),
            volume: this.normalizeVolumeData(data.volume_data || []),
            trending: this.normalizeTrendData(data.trending_data || [])
        };
    }
};

// Add to the keyword form
document.getElementById('keywords').addEventListener('input', debounce(async function(e) {
    const keyword = e.target.value.trim();
    if (keyword.length < 3) return;

    const suggestions = await keywordSuggestions.getKeywordIdeas(keyword);
    if (!suggestions) return;

    // Display suggestions
    const suggestionsContainer = document.getElementById('keyword-suggestions') || 
        createSuggestionsContainer();

    suggestionsContainer.innerHTML = `
        <div class="suggestions-group">
            <h4>Related Searches</h4>
            ${suggestions.related.map(s => `
                <div class="suggestion-item" onclick="addKeyword('${s.keyword}')">
                    <span>${s.keyword}</span>
                    <span class="metrics">
                        <span title="Search Volume">${s.volume}/mo</span>
                        <span title="Competition">${s.competition}</span>
                    </span>
                </div>
            `).join('')}
        </div>
        <div class="suggestions-group">
            <h4>Trending Topics</h4>
            ${suggestions.trending.map(t => `
                <div class="suggestion-item" onclick="addKeyword('${t.topic}')">
                    <span>${t.topic}</span>
                    <span class="trend-indicator">
                        <i class="fas fa-trending-${t.trend > 0 ? 'up' : 'down'}"></i>
                        ${t.trend}%
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}, 500));

function createSuggestionsContainer() {
    const container = document.createElement('div');
    container.id = 'keyword-suggestions';
    container.className = 'keyword-suggestions';
    document.getElementById('keyword-form').appendChild(container);
    return container;
}

function addKeyword(keyword) {
    const keywordsInput = document.getElementById('keywords');
    const currentKeywords = keywordsInput.value.split(',').map(k => k.trim());
    if (!currentKeywords.includes(keyword)) {
        currentKeywords.push(keyword);
        keywordsInput.value = currentKeywords.join(', ');
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add to your searchConsole object
const indexingStatus = {
    async checkIndexingStatus() {
        const urlsToCheck = [
            'https://www.vikkasarunpareek.com/',
            'https://www.vikkasarunpareek.com/about.html',
            'https://www.vikkasarunpareek.com/media.html',
            'https://www.vikkasarunpareek.com/writings.html',
            'https://www.vikkasarunpareek.com/contact.html'
        ];

        const results = await Promise.all(urlsToCheck.map(url => this.checkUrlStatus(url)));
        this.displayIndexingStatus(results);
    },

    async checkUrlStatus(url) {
        try {
            const response = await gapi.client.searchconsole.urlInspection.index.inspect({
                inspectionUrl: url,
                siteUrl: GSC_CONFIG.SITE_URL
            });

            return {
                url,
                status: response.result.inspectionResult.indexStatusResult.coverageState,
                lastCrawl: response.result.inspectionResult.indexStatusResult.lastCrawlTime,
                isIndexed: response.result.inspectionResult.indexStatusResult.verdict === 'PASS',
                issues: response.result.inspectionResult.indexStatusResult.robotsTxtState,
                mobileFriendly: response.result.inspectionResult.mobileFriendlinessResult.verdict === 'PASS'
            };
        } catch (error) {
            console.error(`Error checking ${url}:`, error);
            return {
                url,
                status: 'ERROR',
                error: error.message
            };
        }
    },

    displayIndexingStatus(results) {
        const container = document.createElement('div');
        container.className = 'indexing-status';
        container.innerHTML = `
            <h3>Indexing Status</h3>
            <div class="status-grid">
                ${results.map(result => `
                    <div class="status-card ${result.isIndexed ? 'indexed' : 'not-indexed'}">
                        <h4>${new URL(result.url).pathname || 'Home'}</h4>
                        <div class="status-details">
                            <p>Status: ${result.status}</p>
                            ${result.lastCrawl ? `<p>Last Crawled: ${new Date(result.lastCrawl).toLocaleDateString()}</p>` : ''}
                            <p>Mobile Friendly: ${result.mobileFriendly ? '✅' : '❌'}</p>
                            ${result.issues ? `<p class="issues">Issues: ${result.issues}</p>` : ''}
                        </div>
                        <button onclick="requestIndexing('${result.url}')" class="index-btn">
                            Request Indexing
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Add to SEO section
        document.querySelector('.seo-analytics').appendChild(container);
    }
};

// Add this function to request indexing
async function requestIndexing(url) {
    try {
        await gapi.client.searchconsole.urlInspection.index.inspect({
            inspectionUrl: url,
            siteUrl: GSC_CONFIG.SITE_URL
        });
        alert('Indexing requested successfully!');
    } catch (error) {
        console.error('Error requesting indexing:', error);
        alert('Error requesting indexing. Please try again.');
    }
}

const seoPerformance = {
    async trackMetrics() {
        const metrics = {
            pageSpeed: await this.getPageSpeedMetrics(),
            searchAnalytics: await this.getSearchAnalytics(),
            backlinks: await this.getBacklinkData(),
            rankings: await this.getKeywordRankings()
        };
        
        this.displayMetrics(metrics);
    },

    async getPageSpeedMetrics() {
        try {
            const response = await fetch(
                `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${CONFIG.siteUrl}`
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching PageSpeed:', error);
            return null;
        }
    },

    async getSearchAnalytics() {
        // Implementation using Search Console API
        try {
            const response = await gapi.client.searchconsole.searchanalytics.query({
                siteUrl: CONFIG.siteUrl,
                requestBody: {
                    startDate: '2024-01-01',
                    endDate: new Date().toISOString().split('T')[0],
                    dimensions: ['query', 'page', 'device']
                }
            });
            return response.result;
        } catch (error) {
            console.error('Error fetching Search Analytics:', error);
            return null;
        }
    },

    displayMetrics(metrics) {
        const container = document.createElement('div');
        container.className = 'seo-metrics';
        container.innerHTML = `
            <h3>SEO Performance Metrics</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Page Speed</h4>
                    <div class="speed-score">
                        ${this.formatPageSpeedScore(metrics.pageSpeed)}
                    </div>
                </div>
                <div class="metric-card">
                    <h4>Search Performance</h4>
                    ${this.formatSearchMetrics(metrics.searchAnalytics)}
                </div>
                <div class="metric-card">
                    <h4>Top Keywords</h4>
                    ${this.formatKeywordRankings(metrics.rankings)}
                </div>
            </div>
        `;
        document.querySelector('.seo-analytics').appendChild(container);
    }
};

const technicalSEO = {
    async runAllChecks() {
        const results = {
            meta: await this.checkMetaTags(),
            images: await this.checkImages(),
            links: await this.checkLinks(),
            performance: await this.checkPerformance(),
            security: await this.checkSecurity(),
            mobile: await this.checkMobileOptimization(),
            structure: await this.checkStructure()
        };

        this.displayResults(results);
    },

    async checkMetaTags() {
        const pages = ['index.html', 'about.html', 'media.html', 'writings.html', 'contact.html'];
        const results = [];

        for (const page of pages) {
            try {
                const response = await fetch(page);
                const html = await response.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');

                results.push({
                    page,
                    checks: {
                        title: {
                            status: doc.title.length > 0 && doc.title.length <= 60 ? 'passed' : 'warning',
                            message: `Title length: ${doc.title.length} characters`,
                            value: doc.title
                        },
                        description: {
                            status: this.checkMetaDescription(doc),
                            message: 'Meta description length check',
                            value: doc.querySelector('meta[name="description"]')?.content
                        },
                        canonical: {
                            status: doc.querySelector('link[rel="canonical"]') ? 'passed' : 'warning',
                            message: 'Canonical URL check'
                        },
                        viewport: {
                            status: doc.querySelector('meta[name="viewport"]') ? 'passed' : 'critical',
                            message: 'Viewport meta tag check'
                        }
                    }
                });
            } catch (error) {
                console.error(`Error checking ${page}:`, error);
            }
        }
        return results;
    },

    async checkImages() {
        const images = document.querySelectorAll('img');
        const results = [];

        for (const img of images) {
            results.push({
                src: img.src,
                checks: {
                    alt: {
                        status: img.alt ? 'passed' : 'warning',
                        message: 'Alt text present',
                        value: img.alt
                    },
                    size: await this.checkImageSize(img),
                    lazy: {
                        status: img.loading === 'lazy' ? 'passed' : 'warning',
                        message: 'Lazy loading attribute'
                    }
                }
            });
        }
        return results;
    },

    async checkLinks() {
        const links = document.querySelectorAll('a');
        const results = [];

        for (const link of links) {
            results.push({
                href: link.href,
                checks: {
                    internal: {
                        status: this.isInternalLink(link) ? 'passed' : 'info',
                        message: 'Internal/External link check'
                    },
                    target: {
                        status: this.checkLinkTarget(link),
                        message: 'Link target attribute check'
                    },
                    text: {
                        status: link.textContent.trim() ? 'passed' : 'warning',
                        message: 'Link text present'
                    }
                }
            });
        }
        return results;
    },

    async checkPerformance() {
        return {
            loadTime: await this.measureLoadTime(),
            resourceSize: await this.checkResourceSizes(),
            compression: await this.checkCompression(),
            caching: await this.checkCaching()
        };
    },

    async checkSecurity() {
        return {
            https: {
                status: location.protocol === 'https:' ? 'passed' : 'critical',
                message: 'HTTPS protocol check'
            },
            mixedContent: await this.checkMixedContent(),
            headers: await this.checkSecurityHeaders()
        };
    },

    async checkMobileOptimization() {
        return {
            viewport: this.checkViewportMeta(),
            touchTargets: await this.checkTouchTargets(),
            fontSizes: this.checkFontSizes(),
            mediaQueries: this.checkMediaQueries()
        };
    },

    async checkStructure() {
        return {
            headings: this.checkHeadingStructure(),
            schema: this.checkSchemaMarkup(),
            breadcrumbs: this.checkBreadcrumbs(),
            siteMap: await this.checkSitemap()
        };
    },

    displayResults(results) {
        const container = document.getElementById('technical-checks');
        container.innerHTML = this.generateResultsHTML(results);
        this.attachFilterHandlers();
    },

    generateResultsHTML(results) {
        return `
            <div class="check-section">
                ${Object.entries(results).map(([category, checks]) => `
                    <div class="category-card">
                        <h4>${this.formatCategoryName(category)}</h4>
                        ${this.generateChecksHTML(checks)}
                    </div>
                `).join('')}
            </div>
        `;
    },

    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
    },

    generateChecksHTML(checks) {
        if (Array.isArray(checks)) {
            return checks.map(check => this.generateCheckItemHTML(check)).join('');
        }
        return Object.entries(checks).map(([name, check]) => `
            <div class="check-item ${check.status}">
                <span class="check-name">${this.formatCategoryName(name)}</span>
                <span class="check-status">${check.status}</span>
                ${check.message ? `<p class="check-message">${check.message}</p>` : ''}
                ${check.value ? `<p class="check-value">${check.value}</p>` : ''}
            </div>
        `).join('');
    }
}; 