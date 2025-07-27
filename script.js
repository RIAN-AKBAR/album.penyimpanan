// Simulated database using localStorage
let albumsDB = JSON.parse(localStorage.getItem('albumsDB')) || [];

// DOM Elements
const albumsContainer = document.getElementById('albums-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const createAlbumBtn = document.getElementById('create-album-btn');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    if (albumsContainer) {
        renderAlbums();
    }
    
    if (createAlbumBtn) {
        setupCreatorPage();
    }
});

// Render all albums
function renderAlbums(filter = '') {
    albumsContainer.innerHTML = '';
    
    const filteredAlbums = filter 
        ? albumsDB.filter(album => 
            album.name.toLowerCase().includes(filter.toLowerCase()) || 
            album.description.toLowerCase().includes(filter.toLowerCase()))
        : albumsDB;
    
    if (filteredAlbums.length === 0) {
        albumsContainer.innerHTML = `
            <div class="no-albums">
                <i class="fas fa-images"></i>
                <p>No albums found. Create your first album!</p>
                <a href="create-album.html" class="btn-create">Create Album</a>
            </div>
        `;
        return;
    }
    
    filteredAlbums.forEach((album, index) => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.innerHTML = `
            <div class="album-cover" style="background-image: url('${album.cover}')">
                <div class="album-overlay">
                    <div class="album-actions">
                        <button class="download-btn" data-index="${index}">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="delete-btn" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="album-info">
                <h3>${album.name}</h3>
                <p>${album.description}</p>
                <div class="album-stats">
                    <span><i class="fas fa-images"></i> ${album.photos.length} photos</span>
                    <span><i class="far fa-calendar-alt"></i> ${new Date(album.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        albumsContainer.appendChild(albumCard);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.closest('.delete-btn').dataset.index;
            deleteAlbum(index);
        });
    });
    
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.closest('.download-btn').dataset.index;
            downloadAlbum(index);
        });
    });
}

// Delete an album
function deleteAlbum(index) {
    if (confirm('Are you sure you want to delete this album?')) {
        albumsDB.splice(index, 1);
        localStorage.setItem('albumsDB', JSON.stringify(albumsDB));
        renderAlbums();
    }
}

// Download an album (simulated)
function downloadAlbum(index) {
    const album = albumsDB[index];
    alert(`Downloading album "${album.name}" with ${album.photos.length} photos.`);
    // In a real app, you would create a zip file or similar
}

// Search functionality
if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        renderAlbums(searchInput.value);
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            renderAlbums(searchInput.value);
        }
    });
}

// Creator page functionality
function setupCreatorPage() {
    const uploadArea = document.getElementById('upload-area');
    const coverInput = document.getElementById('cover-image');
    const preview = document.getElementById('preview');
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photosInput = document.getElementById('photos-input');
    const photosPreview = document.getElementById('photos-preview');
    const albumName = document.getElementById('album-name');
    const albumDescription = document.getElementById('album-description');
    
    let coverImage = null;
    let photos = [];
    
    // Cover image upload
    coverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                coverImage = event.target.result;
                preview.innerHTML = `<img src="${coverImage}" alt="Cover Preview">`;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Photos upload
    photosInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    photos.push(event.target.result);
                    renderPhotosPreview();
                };
                reader.readAsDataURL(file);
            });
        }
    });
    
    // Render photos preview
    function renderPhotosPreview() {
        photosPreview.innerHTML = '';
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
                const index = e.target.dataset.index;
                photos.splice(index, 1);
                renderPhotosPreview();
            });
        });
    }
    
    // Drag and drop for cover
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.backgroundColor = 'rgba(108, 92, 231, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'transparent';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                coverImage = event.target.result;
                preview.innerHTML = `<img src="${coverImage}" alt="Cover Preview">`;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Drag and drop for photos
    photoUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        photoUploadArea.style.borderColor = 'var(--primary-color)';
        photoUploadArea.style.backgroundColor = 'rgba(108, 92, 231, 0.1)';
    });
    
    photoUploadArea.addEventListener('dragleave', () => {
        photoUploadArea.style.borderColor = '#ddd';
        photoUploadArea.style.backgroundColor = 'transparent';
    });
    
    photoUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        photoUploadArea.style.borderColor = '#ddd';
        photoUploadArea.style.backgroundColor = 'transparent';
        
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    photos.push(event.target.result);
                    renderPhotosPreview();
                };
                reader.readAsDataURL(file);
            });
        }
    });
    
    // Create album
    createAlbumBtn.addEventListener('click', () => {
        const name = albumName.value.trim();
        const description = albumDescription.value.trim();
        
        if (!name) {
            alert('Please enter an album name');
            return;
        }
        
        if (!coverImage) {
            alert('Please select a cover image');
            return;
        }
        
        if (photos.length === 0) {
            alert('Please add at least one photo to the album');
            return;
        }
        
        const newAlbum = {
            id: Date.now().toString(),
            name,
            description,
            cover: coverImage,
            photos,
            createdAt: new Date().toISOString()
        };
        
        albumsDB.unshift(newAlbum);
        localStorage.setItem('albumsDB', JSON.stringify(albumsDB));
        
        alert('Album created successfully!');
        window.location.href = 'index.html';
    });
}
