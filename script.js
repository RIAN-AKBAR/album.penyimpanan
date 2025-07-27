// Enhanced GalleryPix Application with Dark Theme
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app based on current page
    if (document.getElementById('albums-container')) {
        initGalleryPage();
    } else if (document.getElementById('create-album-btn')) {
        initCreateAlbumPage();
    }
});

// Gallery Page Functionality
function initGalleryPage() {
    // Load albums from localStorage or initialize empty array
    let albumsDB = JSON.parse(localStorage.getItem('albumsDB')) || [];
    const albumsContainer = document.getElementById('albums-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort-select');
    
    // Initial render
    renderAlbums();
    
    // Search functionality
    searchBtn.addEventListener('click', () => filterAndSortAlbums());
    searchInput.addEventListener('input', () => filterAndSortAlbums());
    
    // Sort functionality
    sortSelect.addEventListener('change', () => filterAndSortAlbums());
    
    function filterAndSortAlbums() {
        const searchTerm = searchInput.value.toLowerCase();
        const sortOption = sortSelect.value;
        
        let filteredAlbums = albumsDB.filter(album => 
            album.name.toLowerCase().includes(searchTerm) || 
            album.description.toLowerCase().includes(searchTerm)
        );
        
        // Sort albums based on selected option
        switch(sortOption) {
            case 'newest':
                filteredAlbums.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filteredAlbums.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name-asc':
                filteredAlbums.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredAlbums.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
        
        renderAlbums(filteredAlbums);
    }
    
    function renderAlbums(albumsToRender = albumsDB) {
        albumsContainer.innerHTML = '';
        
        if (albumsToRender.length === 0) {
            albumsContainer.innerHTML = `
                <div class="no-albums">
                    <i class="fas fa-images"></i>
                    <p>No albums found. Create your first album!</p>
                    <a href="create-album.html" class="btn-create">Create Album</a>
                </div>
            `;
            return;
        }
        
        albumsToRender.forEach((album, index) => {
            const albumCard = document.createElement('div');
            albumCard.className = 'album-card';
            albumCard.innerHTML = `
                <div class="album-cover" style="background-image: url('${album.cover}')">
                    <div class="album-overlay">
                        <div class="album-actions">
                            <button class="download-btn" data-index="${index}" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="delete-btn" data-index="${index}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="album-info">
                    <h3>${album.name}</h3>
                    <p>${album.description || 'No description'}</p>
                    <div class="album-stats">
                        <span><i class="fas fa-images"></i> ${album.photos.length} ${album.photos.length === 1 ? 'photo' : 'photos'}</span>
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(album.createdAt)}</span>
                    </div>
                </div>
            `;
            albumsContainer.appendChild(albumCard);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                deleteAlbum(index);
            });
        });
        
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                downloadAlbum(index);
            });
        });
    }
    
    function deleteAlbum(index) {
        if (confirm('Are you sure you want to delete this album? All photos will be lost.')) {
            albumsDB.splice(index, 1);
            localStorage.setItem('albumsDB', JSON.stringify(albumsDB));
            renderAlbums();
            showToast('Album deleted successfully');
        }
    }
    
    function downloadAlbum(index) {
        const album = albumsDB[index];
        // In a real app, this would create a zip file for download
        showToast(`Preparing download for "${album.name}"...`);
        setTimeout(() => {
            showToast(`Downloaded "${album.name}" with ${album.photos.length} photos`);
        }, 1500);
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Create Album Page Functionality
function initCreateAlbumPage() {
    const uploadArea = document.getElementById('upload-area');
    const coverInput = document.getElementById('cover-image');
    const preview = document.getElementById('preview');
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photosInput = document.getElementById('photos-input');
    const photosPreview = document.getElementById('photos-preview');
    const albumName = document.getElementById('album-name');
    const albumDescription = document.getElementById('album-description');
    const createAlbumBtn = document.getElementById('create-album-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    let coverImage = null;
    let photos = [];
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
        if ((albumName.value || albumDescription.value || coverImage || photos.length > 0) &&
            confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'index.html';
        }
    });
    
    // Cover image upload
    coverInput.addEventListener('change', handleCoverUpload);
    
    function handleCoverUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showError('Cover image should be less than 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                coverImage = event.target.result;
                preview.innerHTML = `<img src="${coverImage}" alt="Cover Preview">`;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Photos upload
    photosInput.addEventListener('change', handlePhotosUpload);
    
    function handlePhotosUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Check total size and number of photos
            const totalSize = files.reduce((total, file) => total + file.size, 0);
            if (totalSize > 50 * 1024 * 1024) { // 50MB total limit
                showError('Total photos size should be less than 50MB');
                return;
            }
            
            if (photos.length + files.length > 50) { // 50 photos limit
                showError('You can upload maximum 50 photos per album');
                return;
            }
            
            let loadedCount = 0;
            
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    photos.push(event.target.result);
                    loadedCount++;
                    
                    if (loadedCount === files.length) {
                        renderPhotosPreview();
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    }
    
    // Render photos preview
    function renderPhotosPreview() {
        photosPreview.innerHTML = '';
        
        if (photos.length === 0) {
            photosPreview.innerHTML = '<p class="empty-message">No photos added yet</p>';
            return;
        }
        
        photos.forEach((photo, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'photo-thumbnail';
            thumbnail.innerHTML = `
                <img src="${photo}" alt="Photo ${index + 1}">
                <span class="remove-photo" data-index="${index}">&times;</span>
            `;
            photosPreview.appendChild(thumbnail);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-photo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                photos.splice(index, 1);
                renderPhotosPreview();
            });
        });
    }
    
    // Drag and drop for cover
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.backgroundColor = 'rgba(187, 134, 252, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        uploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        uploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            coverInput.files = e.dataTransfer.files;
            handleCoverUpload({ target: coverInput });
        }
    });
    
    // Drag and drop for photos
    photoUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        photoUploadArea.style.borderColor = 'var(--primary)';
        photoUploadArea.style.backgroundColor = 'rgba(187, 134, 252, 0.1)';
    });
    
    photoUploadArea.addEventListener('dragleave', () => {
        photoUploadArea.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        photoUploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
    });
    
    photoUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        photoUploadArea.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        photoUploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            photosInput.files = files;
            handlePhotosUpload({ target: photosInput });
        }
    });
    
    // Create album
    createAlbumBtn.addEventListener('click', () => {
        const name = albumName.value.trim();
        const description = albumDescription.value.trim();
        
        if (!name) {
            showError('Please enter an album name');
            albumName.focus();
            return;
        }
        
        if (!coverImage) {
            showError('Please select a cover image');
            return;
        }
        
        if (photos.length === 0) {
            showError('Please add at least one photo to the album');
            return;
        }
        
        // Load existing albums
        let albumsDB = JSON.parse(localStorage.getItem('albumsDB')) || [];
        
        // Create new album
        const newAlbum = {
            id: Date.now().toString(),
            name,
            description,
            cover: coverImage,
            photos,
            createdAt: new Date().toISOString()
        };
        
        // Add to beginning of array
        albumsDB.unshift(newAlbum);
        
        // Save to localStorage
        localStorage.setItem('albumsDB', JSON.stringify(albumsDB));
        
        // Show success message
        showToast('Album created successfully!');
        
        // Redirect to home page after a delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
    
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            errorEl.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            errorEl.classList.remove('show');
            setTimeout(() => {
                errorEl.remove();
            }, 300);
        }, 3000);
    }
    
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Initial render
    renderPhotosPreview();
}

// Add some basic styles for dynamic elements
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--primary);
        color: var(--on-primary);
        padding: 12px 24px;
        border-radius: 50px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .toast.show {
        opacity: 1;
    }
    
    .error-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--error);
        color: var(--on-error);
        padding: 12px 24px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
        max-width: 90%;
        text-align: center;
    }
    
    .error-message.show {
        opacity: 1;
    }
    
    .empty-message {
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
        padding: 1rem;
    }
    
    @media (max-width: 480px) {
        .toast, .error-message {
            width: 90%;
            text-align: center;
        }
    }
`;
document.head.appendChild(dynamicStyles);
