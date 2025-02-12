let googleUser = null;

// Wait for Firebase to be ready
window.addEventListener('firebaseReady', () => {
    // Hide loading state
    document.getElementById('loadingState').style.display = 'none';
    
    // Initialize Google Auth Provider
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    
    // Initialize tabs immediately after Firebase is ready
    initializeTabs();
    
    // Handle redirect result first
    firebase.auth().getRedirectResult().then(async (result) => {
        if (result.user) {
            console.log('Redirect sign-in successful:', result.user.email);
            try {
                await checkAdminAccess(result.user);
                // Initialize tabs again after successful auth
                initializeTabs();
            } catch (error) {
                console.error('Error after redirect:', error);
                await signOut();
            }
        }
    }).catch((error) => {
        console.error('Redirect sign-in error:', error);
    });
    
    // Set up auth state observer
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        if (user) {
            try {
                await checkAdminAccess(user);
                // Initialize tabs after successful auth
                initializeTabs();
            } catch (error) {
                console.error('Error in auth state change:', error);
                console.error('Admin access check failed:', error);
            }
        } else {
            // Hide admin content when logged out
            document.getElementById('loginMessage').style.display = 'none';
            document.querySelector('.admin-container').style.display = 'none';
            document.querySelector('.signout-btn').style.display = 'none';
            document.getElementById('signInBtn').style.display = 'block';
        }
    });
    
    // Show initial sign-in button
    document.getElementById('signInBtn').style.display = 'block';
    
    initializeAdmin(provider);
});

// Move initializeTabs function definition to the top level
function initializeTabs() {
    console.log('Initializing tabs...');
    const tabButtons = document.querySelectorAll('.tab-button');
    const contentSections = document.querySelectorAll('.content-section');
    
    if (!tabButtons.length || !contentSections.length) {
        console.warn('Tab elements not found');
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            console.log('Tab clicked:', tabId);
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            button.classList.add('active');
            const targetSection = document.getElementById(`${tabId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Load data for specific tabs
                if (tabId === 'apps') {
                    loadApps();
                }
            } else {
                console.error('Target section not found:', tabId);
            }
        });
    });
}

// Firebase test function
window.testFirebase = async function() {
    try {
        console.log('Testing Firebase connection...');
        
        // Check Firebase initialization
        if (!window.firebase) {
            throw new Error('Firebase not initialized');
        }
        
        // Test Firestore connection
        if (!window.db) {
            throw new Error('Firestore not initialized');
        }
        
        // Test collection access
        const testDoc = await window.db.collection('_test_').add({
            test: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await window.db.collection('_test_').doc(testDoc.id).delete();
        
        // Test Auth state
        const currentUser = firebase.auth().currentUser;
        console.log('Current auth state:', currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in');
        
        alert('Firebase connection test successful! Check console for details.');
    } catch (error) {
        console.error('Firebase test failed:', error);
        alert(`Firebase test failed: ${error.message}`);
    }
};

// Add test button in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Firebase';
    testButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 1000;
    `;
    testButton.onclick = window.testFirebase;
    document.body.appendChild(testButton);
}

function initializeAdmin(provider) {
    // Sign In Handler
    document.getElementById('signInBtn')?.addEventListener('click', async () => {
        const button = document.getElementById('signInBtn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        try {
            console.log('Starting Google Sign In...');
            // Use popup for local development, redirect for production
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                const result = await firebase.auth().signInWithPopup(provider);
                console.log('Popup sign-in successful:', result.user.email);
                await checkAdminAccess(result.user);
            } else {
                await firebase.auth().signInWithRedirect(provider);
            }
        } catch (error) {
            console.error('Auth Error:', error);
            alert('Authentication failed: ' + error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = 'Sign in with Google';
        }
    });

    // Update signOut function
    window.signOut = async function() {
        try {
            // Clear any cached auth data
            await firebase.auth().signOut();
            
            // Hide admin UI
            document.getElementById('loginMessage').style.display = 'none';
            document.querySelector('.admin-container').style.display = 'none';
            document.querySelector('.signout-btn').style.display = 'none';
            document.getElementById('signInBtn').style.display = 'block';
            
            alert('Successfully logged out');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    // Update checkAdminAccess
    async function checkAdminAccess(user) {
        try {
            console.log('Checking admin access for:', user.email);
            
            if (!window.db) {
                throw new Error('Firestore is not initialized');
            }
            
            // Add retry logic for Firestore
            let retries = 3;
            let adminDoc;
            
            while (retries > 0) {
                try {
                    adminDoc = await window.db.collection('admins').doc(user.email).get();
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            console.log('Admin document fetch result:', {
                exists: adminDoc.exists,
                id: adminDoc.id,
                data: adminDoc.exists ? adminDoc.data() : null
            });
            
            if (adminDoc.exists) {
                console.log('Admin access granted');
                // Show admin UI
                document.getElementById('userEmail').textContent = user.email;
                document.getElementById('loginMessage').style.display = 'flex';
                document.querySelector('.admin-container').style.display = 'block';
                document.querySelector('.signout-btn').style.display = 'block';
                document.getElementById('signInBtn').style.display = 'none';
                
                // Initialize tabs after admin UI is shown
                initializeTabs();
                
                // Initialize data
                await loadApps();
                return true;
            } else {
                console.log('Admin access denied for:', user.email);
                alert('Access denied. You are not authorized.');
                await signOut();
                return false;
            }
        } catch (error) {
            console.error('Admin access check failed:', error);
            alert('Error checking admin access: ' + error.message);
            return false;
        }
    }

    // Protect all admin operations
    function requireAuth(operation) {
        return async function(...args) {
            if (!firebase.auth().currentUser) {
                alert('Please sign in first');
                return;
            }
            return operation.apply(this, args);
        };
    }

    // Wrap your app operations with requireAuth
    const addApp = requireAuth(async function(formData) {
        // Your existing addApp logic
    });

    // App form submission
    document.getElementById('app-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            let imageUrl = null;
            const imageFile = document.getElementById('app-image').files[0];
            
            if (imageFile) {
                // Validate file type and size
                if (!imageFile.type.match('image.*')) {
                    throw new Error('Please upload an image file');
                }
                
                if (imageFile.size > 5 * 1024 * 1024) { // 5MB
                    throw new Error('Image size should be less than 5MB');
                }
                
                // Create a storage reference
                const storageRef = firebase.storage().ref();
                // Sanitize filename and add timestamp
                const fileName = `${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const imageRef = storageRef.child(`app-images/${fileName}`);
                
                // Upload the file
                const metadata = {
                    contentType: imageFile.type,
                    customMetadata: {
                        'uploadedBy': firebase.auth().currentUser.email
                    }
                };
                
                // Show upload progress
                const uploadTask = imageRef.put(imageFile, metadata);
                
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                    },
                    (error) => {
                        console.error('Upload failed:', error);
                        throw error;
                    }
                );
                
                // Wait for upload to complete
                const snapshot = await uploadTask;
                
                // Get the download URL
                imageUrl = await snapshot.ref.getDownloadURL();
            }

            const formData = {
                title: document.getElementById('app-title').value || null,
                description: document.getElementById('app-description').value || null,
                category: (() => {
                    const status = document.getElementById('app-status').value;
                    switch(status) {
                        case 'completed': return 'Production';
                        case 'in-progress': return 'Work in Progress';
                        case 'planned': return 'Wish List';
                        default: return 'Work in Progress';
                    }
                })(),
                image: imageUrl,
                url: document.getElementById('app-url').value || null,
                github: document.getElementById('app-github').value || null,
                technologies: document.getElementById('app-tech').value ? 
                    document.getElementById('app-tech').value.split(',').map(tech => tech.trim()) : [],
                status: document.getElementById('app-status').value || 'planned',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Validate required fields
            if (!formData.title || !formData.category) {
                throw new Error('Title and Category are required');
            }

            console.log('Saving app with data:', formData);

            // Check if we're editing or creating
            const editId = this.dataset.editId;
            
            if (editId) {
                await window.db.collection('apps').doc(editId).update(formData);
                alert('App updated successfully!');
            } else {
                formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await window.db.collection('apps').add(formData);
                alert('App added successfully!');
            }

            // Reset form
            this.reset();
            delete this.dataset.editId;
            document.getElementById('image-preview').innerHTML = '';
            loadApps();
        } catch (error) {
            console.error('Error saving app:', error);
            alert(error.message || 'Error saving app. Please try again.');
        }
    });

    async function initializeSearchConsole() {
        await gapi.client.init({
            apiKey: GSC_CONFIG.API_KEY,
            clientId: GSC_CONFIG.CLIENT_ID,
            scope: GSC_CONFIG.SCOPES.join(' ')
        });
        
        // Initialize indexing status check
        await indexingStatus.checkIndexingStatus();
    }

    // Load apps function
    async function loadApps(filter = 'all') {
        try {
            const appsList = document.getElementById('apps-list');
            if (!appsList) return;
            
            appsList.innerHTML = '<div class="loading-spinner"></div>';
            
            let query = window.db.collection('apps');
            
            // Only apply category filter if it's not 'all'
            if (filter !== 'all') {
                query = query.where('category', '==', filter);
            }
            
            // Always order by createdAt
            query = query.orderBy('createdAt', 'desc');
            
            const snapshot = await query.get();
            
            let html = '';
            snapshot.forEach(doc => {
                const app = doc.data();
                html += `
                    <div class="link-item">
                        <div class="link-info">
                            <h4>${app.title || 'Untitled'}</h4>
                            <p>${app.category || 'No category'} - ${app.status || 'No status'}</p>
                            <small>${app.description?.substring(0, 100) || 'No description'}...</small>
                        </div>
                        <div class="link-actions">
                            <button onclick="window.editApp('${doc.id}')" class="edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="window.deleteApp('${doc.id}')" class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            appsList.innerHTML = html || '<p class="empty-message">No apps found</p>';
        } catch (error) {
            console.error('Error loading apps:', error);
            appsList.innerHTML = '<p class="error-message">Error loading apps. Please try again.</p>';
        }
    }

    // Add edit function
    window.editApp = async function(id) {
        try {
            const doc = await window.db.collection('apps').doc(id).get();
            if (!doc.exists) {
                throw new Error('App not found');
            }
            
            const app = doc.data();
            
            // Fill form with app data
            document.getElementById('app-title').value = app.title || '';
            document.getElementById('app-description').value = app.description || '';
            document.getElementById('app-category').value = app.category || '';
            document.getElementById('app-url').value = app.url || '';
            document.getElementById('app-github').value = app.github || '';
            document.getElementById('app-tech').value = app.technologies?.join(', ') || '';
            document.getElementById('app-status').value = app.status || 'planned';
            
            // Store the app ID for updating
            document.getElementById('app-form').dataset.editId = id;
            
            // Show image preview if exists
            if (app.image) {
                document.getElementById('image-preview').innerHTML = `
                    <img src="${app.image}" alt="Preview">
                `;
            }
            
            // Scroll to form
            document.getElementById('app-form').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error editing app:', error);
            alert('Error loading app data. Please try again.');
        }
    };

    // Add delete function
    window.deleteApp = async function(id) {
        if (confirm('Are you sure you want to delete this app?')) {
            try {
                await window.db.collection('apps').doc(id).delete();
                loadApps();
                alert('App deleted successfully');
            } catch (error) {
                console.error('Error deleting app:', error);
                alert('Error deleting app. Please try again.');
            }
        }
    };
} 