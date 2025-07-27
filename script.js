// Shared functions
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function downloadPhoto(photoUrl, photoName) {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = photoName || 'photo_' + Date.now() + '.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function setupConfirmationDialog() {
    const dialog = document.getElementById('confirmation-dialog');
    const message = document.getElementById('confirmation-message');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');
    
    let currentAction = null;

    function show(msg, action) {
        message.textContent = msg;
        currentAction = action;
        dialog.classList.add('active');
    }

    function hide() {
        dialog.classList.remove('active');
        currentAction = null;
    }

    confirmBtn?.addEventListener('click', () => {
        if (currentAction) currentAction();
        hide();
    });

    cancelBtn?.addEventListener('click', hide);

    return { show };
}

// Album Storage with IndexedDB fallback
const dbName = "GalleryPixDB";
const storeName = "albums";
let albumsDB = [];
let currentPage = 1;
const albumsPerPage = 12;

// Initialize database
function initDatabase() {
    return new Promise((resolve) => {
        // First try to load from localStorage
        const localData = localStorage.getItem('albumsDB');
        if (localData) {
            try {
                albumsDB = JSON.parse(localData);
                resolve(true);
                return;
            } catch (e) {
                console.error('Error parsing localStorage data:', e);
            }
        }

        // Fallback to IndexedDB
        const request = indexedDB.open(dbName, 1);
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id" });
            }
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = function() {
                albumsDB = getAllRequest.result || [];
                resolve(true);
            };
            
            getAllRequest.onerror = function() {
                albumsDB = [];
                resolve(false);
            };
        };
        
        request.onerror = function() {
            albumsDB = [];
            resolve(false);
        };
    });
}

// Save albums to storage
function saveAlbums() {
    // First try localStorage
    try {
        const compressed = JSON.stringify(albumsDB);
        if (compressed.length < 5 * 1024 * 1024) { // 5MB limit for localStorage
            localStorage.setItem('albumsDB', compressed);
            return;
        }
    } catch (e) {
        console.error('LocalStorage save error:', e);
    }

    // Fallback to IndexedDB
    const request = indexedDB.open(dbName, 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        
        // Clear existing data
        store.clear();
        
        // Add all albums
        albumsDB.forEach(album => {
            store.add(album);
        });
    };
}

// Album pagination and rendering
function renderAlbums(page = 1) {
    currentPage = page;
    const startIdx = (page - 1) * albumsPerPage;
    const endIdx = startIdx + albumsPerPage;
    const paginatedAlbums = albumsDB.slice(startIdx, endIdx);
    
    renderAlbumChunk(paginatedAlbums);
    updatePaginationControls();
}

function renderAlbumChunk(albums) {
    const albumsContainer = document.getElementById('albums-container');
    
    if (albums.length === 0) {
        albumsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <p>No albums found. Create your first album!</p>
                <a href="create-album.html" class="btn btn-primary">
                    Create Album
                </a>
            </div>
        `;
        return;
    }
    
    albumsContainer.innerHTML = '';
    
    albums.forEach((album, index) => {
        const globalIndex = ((currentPage - 1) * albumsPerPage) + index;
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.innerHTML = `
            <div class="album-cover" style="background-image: url('${album.cover}')">
                <div class="album-overlay">
                    <div class="album-actions">
                        <button class="view-photos-btn" data-index="${globalIndex}" title="View Photos">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="download-all-btn" data-index="${globalIndex}" title="Download All">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="delete-album-btn" data-index="${globalIndex}" title="Delete Album">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="album-info">
                <h3>${album.name}</h3>
                <div class="album-stats">
                    <span><i class="fas fa-images"></i> ${album.photos.length} photos</span>
                    <span>${new Date(album.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="photo-list" id="photo-list-${globalIndex}">
                ${album.photos.map((photo, photoIndex) => `
                    <div class="photo-item">
                        <img src="${photo}" alt="Photo ${photoIndex + 1}">
                        <div class="photo-actions">
                            <button class="btn-download-photo" data-album="${globalIndex}" data-photo="${photoIndex}">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn-delete-photo btn-error" data-album="${globalIndex}" data-photo="${photoIndex}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        albumsContainer.appendChild(albumCard);
    });

    // Add event listeners
    document.querySelectorAll('.view-photos-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const photoList = document.getElementById(`photo-list-${index}`);
            photoList.style.display = photoList.style.display === 'none' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.btn-download-photo').forEach(btn => {
        btn.addEventListener('click', function() {
            const albumIndex = parseInt(this.dataset.album);
            const photoIndex = parseInt(this.dataset.photo);
            const photoUrl = albumsDB[albumIndex].photos[photoIndex];
            const photoName = albumsDB[albumIndex].photoNames?.[photoIndex] || 
                             `${albumsDB[albumIndex].name}_${photoIndex + 1}.jpg`;
            downloadPhoto(photoUrl, photoName);
        });
    });

    document.querySelectorAll('.btn-delete-photo').forEach(btn => {
        btn.addEventListener('click', function() {
            const albumIndex = parseInt(this.dataset.album);
            const photoIndex = parseInt(this.dataset.photo);
            const photoName = albumsDB[albumIndex].photoNames?.[photoIndex] || 
                            `photo ${photoIndex + 1}`;
            
            const { show } = setupConfirmationDialog();
            show(
                `Are you sure you want to delete "${photoName}" from "${albumsDB[albumIndex].name}"?`,
                () => deletePhoto(albumIndex, photoIndex)
            );
        });
    });

    document.querySelectorAll('.download-all-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const albumIndex = parseInt(this.dataset.index);
            const album = albumsDB[albumIndex];
            
            showToast(`Starting download of ${album.photos.length} photos...`, 2000);
            
            album.photos.forEach((photo, i) => {
                const photoName = album.photoNames?.[i] || `${album.name}_${i + 1}.jpg`;
                setTimeout(() => {
                    downloadPhoto(photo, photoName);
                }, i * 300); // Stagger downloads
            });
        });
    });

    document.querySelectorAll('.delete-album-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const albumIndex = parseInt(this.dataset.index);
            const albumName = albumsDB[albumIndex].name;
            
            const { show } = setupConfirmationDialog();
            show(
                `Are you sure you want to delete the album "${albumName}" and all its ${albumsDB[albumIndex].photos.length} photos?`,
                () => deleteAlbum(albumIndex)
            );
        });
    });
}

function updatePaginationControls() {
    const totalPages = Math.ceil(albumsDB.length / albumsPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

// Album operations
function deleteAlbum(index) {
    albumsDB.splice(index, 1);
    saveAlbums();
    renderAlbums(currentPage);
    showToast('Album deleted successfully');
}

function deletePhoto(albumIndex, photoIndex) {
    albumsDB[albumIndex].photos.splice(photoIndex, 1);
    if (albumsDB[albumIndex].photoNames) {
        albumsDB[albumIndex].photoNames.splice(photoIndex, 1);
    }
    
    // If we deleted the cover photo, update the cover
    if (photoIndex === 0 && albumsDB[albumIndex].photos.length > 0) {
        albumsDB[albumIndex].cover = albumsDB[albumIndex].photos[0];
    }
    
    saveAlbums();
    renderAlbums(currentPage);
    showToast('Photo deleted successfully');
}

// Search and sort functionality
function setupSearchAndSort() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort-select');
    
    function performSearch() {
        const query = searchInput.value.toLowerCase();
        if (!query) {
            renderAlbums(1);
            return;
        }
        
        const filtered = albumsDB.filter(album => 
            album.name.toLowerCase().includes(query) ||
            (album.photoNames && album.photoNames.some(name => name.toLowerCase().includes(query)))
        );
        
        renderAlbumChunk(filtered);
        updatePaginationControlsForSearch(filtered);
    }
    
    function performSort() {
        const sortBy = sortSelect.value;
        
        switch(sortBy) {
            case 'newest':
                albumsDB.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                albumsDB.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name-asc':
                albumsDB.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                albumsDB.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
        
        saveAlbums();
        renderAlbums(1);
    }
    
    searchInput.addEventListener('input', performSearch);
    searchBtn.addEventListener('click', performSearch);
    sortSelect.addEventListener('change', performSort);
}

function updatePaginationControlsForSearch(filteredAlbums) {
    const totalPages = Math.ceil(filteredAlbums.length / albumsPerPage);
    document.getElementById('page-info').textContent = filteredAlbums.length === albumsDB.length ? 
        `Page ${currentPage} of ${totalPages}` : 
        `${filteredAlbums.length} results`;
    
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages || filteredAlbums.length <= albumsPerPage;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    
    // Setup pagination controls
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            renderAlbums(currentPage - 1);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(albumsDB.length / albumsPerPage);
        if (currentPage < totalPages) {
            renderAlbums(currentPage + 1);
        }
    });
    
    setupSearchAndSort();
    renderAlbums(1);
});

// Create Album Page Specific Code
if (document.getElementById('photos-input')) {
    document.addEventListener('DOMContentLoaded', function() {
        const photosInput = document.getElementById('photos-input');
        const photosPreview = document.getElementById('photos-preview');
        const albumName = document.getElementById('album-name');
        const createAlbumBtn = document.getElementById('create-album-btn');
        const createAnotherBtn = document.getElementById('create-another-btn');
        const uploadArea = document.getElementById('photo-upload-area');
        const uploadProgress = document.getElementById('upload-progress');
        
        let photos = [];

        // Handle file selection
        photosInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 50) {
                showToast(`Processing ${files.length} photos, please wait...`, 3000);
                uploadProgress.style.display = 'block';
                setTimeout(() => processFiles(files), 100);
            } else {
                processFiles(files);
            }
        });

        function processFiles(files) {
            photos = [];
            photosPreview.innerHTML = '';
            
            let processed = 0;
            const batchSize = 10; // Process 10 files at a time
            
            function processBatch(startIdx) {
                const batch = files.slice(startIdx, startIdx + batchSize);
                if (batch.length === 0) {
                    uploadProgress.style.display = 'none';
                    return;
                }
                
                batch.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        photos.push({
                            url: event.target.result,
                            name: file.name,
                            size: file.size
                        });
                        processed++;
                        
                        // Update progress
                        const progress = Math.round((processed / files.length) * 100);
                        uploadProgress.querySelector('.progress-bar').style.width = `${progress}%`;
                        uploadProgress.querySelector('.progress-text').textContent = `${processed}/${files.length} (${progress}%)`;
                        
                        // Render preview only for the last batch
                        if (processed === files.length) {
                            renderPhotosPreview();
                            showToast(`Successfully loaded ${files.length} photos`, 2000);
                            uploadProgress.style.display = 'none';
                        }
                    };
                    reader.readAsDataURL(file);
                });
                
                // Process next batch
                setTimeout(() => processBatch(startIdx + batchSize), 100);
            }
            
            processBatch(0);
        }

        // Render photo previews
        function renderPhotosPreview() {
            photosPreview.innerHTML = '';
            photos.forEach((photo, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'photo-thumbnail';
                thumbnail.innerHTML = `
                    <img src="${photo.url}" alt="${photo.name}">
                    <button class="remove-photo" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                photosPreview.appendChild(thumbnail);
            });

            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-photo').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    photos.splice(index, 1);
                    renderPhotosPreview();
                });
            });
        }

        // Create album function
        function createAlbum() {
            if (!albumName.value || photos.length === 0) {
                showToast('Please enter an album name and add at least one photo');
                return;
            }

            const newAlbum = {
                id: Date.now().toString(),
                name: albumName.value,
                cover: photos[0].url,
                photos: photos.map(photo => photo.url),
                photoNames: photos.map(photo => photo.name),
                createdAt: new Date().toISOString()
            };
            
            albumsDB.unshift(newAlbum);
            saveAlbums();
            
            showToast(`Album "${albumName.value}" created with ${photos.length} photos!`);
            
            // Reset form but keep the page
            albumName.value = '';
            photos = [];
            photosPreview.innerHTML = '';
            photosInput.value = '';
            
            // Show create another button
            createAlbumBtn.style.display = 'none';
            createAnotherBtn.style.display = 'inline-flex';
        }

        // Event listeners
        createAlbumBtn.addEventListener('click', createAlbum);
        
        createAnotherBtn.addEventListener('click', function() {
            createAlbumBtn.style.display = 'inline-flex';
            this.style.display = 'none';
        });

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                photosInput.files = files;
                const event = new Event('change');
                photosInput.dispatchEvent(event);
            }
        });
    });
}
