// news-management.js - VERSI FINAL (SISTEM MANAJEMEN BERITA EGGTRACK)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Data berita dan state management
let newsData = [];
let filteredNewsData = [];
let currentPage = 1;
const itemsPerPage = 10;
let deleteNewsId = null;
let isOnline = true;
let editMode = false;
let currentUser = null;

// DEMO DATA - Backup jika koneksi gagal
const DEMO_ADMIN_NEWS_DATA = [
    {
        ID: 1,
        Title: 'Inovasi Pengolahan Telur Bebek dengan Teknologi Modern',
        Excerpt: 'Peternakan telur bebek di Indonesia mulai mengadopsi teknologi canggih untuk meningkatkan kualitas dan produktivitas...',
        Content: '<p>Industri peternakan telur bebek di Indonesia sedang mengalami transformasi digital yang signifikan.</p>',
        ImageURL: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        Category: 'Terbaru',
        Author: 'Admin EggTrack',
        Status: 'Published',
        Date: '2024-03-15',
        CreatedAt: '2024-03-15T10:00:00Z',
        Featured: true,
        Views: 1250
    },
    {
        ID: 2,
        Title: 'Peluang Pasar Ekspor Telur Bebek Meningkat 25%',
        Excerpt: 'Permintaan telur bebek dari pasar internasional menunjukkan peningkatan signifikan...',
        Content: '<p>Permintaan telur bebek dari pasar internasional menunjukkan peningkatan signifikan.</p>',
        ImageURL: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        Category: 'Trending',
        Author: 'Tim Riset EggTrack',
        Status: 'Published',
        Date: '2024-03-10',
        CreatedAt: '2024-03-10T14:30:00Z',
        Featured: false,
        Views: 890
    },
    {
        ID: 3,
        Title: 'Tips Manajemen Peternakan yang Efisien',
        Excerpt: 'Penerapan sistem manajemen digital terbukti meningkatkan efisiensi operasional...',
        Content: '<p>Penerapan sistem manajemen digital terbukti meningkatkan efisiensi operasional.</p>',
        ImageURL: 'https://images.unsplash.com/photo-1505253668822-42074d58a7c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        Category: 'Tips',
        Author: 'Admin EggTrack',
        Status: 'Draft',
        Date: '2024-03-05',
        CreatedAt: '2024-03-05T09:15:00Z',
        Featured: true,
        Views: 0
    },
    {
        ID: 4,
        Title: 'Studi Terbaru: Telur Bebek Lebih Kaya Omega-3',
        Excerpt: 'Penelitian terbaru menunjukkan kandungan nutrisi telur bebek lebih unggul...',
        Content: '<p>Penelitian terbaru menunjukkan kandungan nutrisi telur bebek lebih unggul.</p>',
        ImageURL: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        Category: 'Kesehatan',
        Author: 'Dr. Agus Santoso',
        Status: 'Archived',
        Date: '2024-02-28',
        CreatedAt: '2024-02-28T11:45:00Z',
        Featured: false,
        Views: 620
    }
];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeNewsManagement();
});

// Fungsi inisialisasi utama
async function initializeNewsManagement() {
    try {
        // Load user profile first
        loadUserProfile();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup editor
        setupEditor();
        
        // Check connection
        await checkConnection();
        
        // Load news data
        await loadNews();
        
        // Update stats
        updateNewsStats();
        
    } catch (error) {
        console.error('Error initializing news management:', error);
        showToast('Gagal menginisialisasi sistem berita', 'danger');
    }
}

// Setup semua event listeners
function setupEventListeners() {
    // Tombol tambah berita
    const addNewsBtn = document.getElementById('addNewsBtn');
    if (addNewsBtn) {
        addNewsBtn.addEventListener('click', () => openNewsEditor());
    }
    
    // Tombol simpan berita
    const saveNewsBtn = document.getElementById('saveNewsBtn');
    if (saveNewsBtn) {
        saveNewsBtn.addEventListener('click', saveNews);
    }
    
    // Tombol konfirmasi hapus
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteNews);
    }
    
    // Pencarian berita
    const searchBtn = document.getElementById('searchBtn');
    const searchNewsInput = document.getElementById('searchNews');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchNews);
    }
    
    if (searchNewsInput) {
        searchNewsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchNews();
        });
    }
    
    // Live search (debounced)
    let searchTimeout;
    if (searchNewsInput) {
        searchNewsInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchNews();
            }, 500);
        });
    }
    
    // Filter berita
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    
    if (filterCategory) {
        filterCategory.addEventListener('change', filterNews);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', filterNews);
    }
    
    // Preview gambar
    const newsImageInput = document.getElementById('newsImage');
    if (newsImageInput) {
        newsImageInput.addEventListener('input', function() {
            updateImagePreview(this.value);
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Modal events
    const newsEditorModal = document.getElementById('newsEditorModal');
    if (newsEditorModal) {
        newsEditorModal.addEventListener('shown.bs.modal', function() {
            const newsTitle = document.getElementById('newsTitle');
            if (newsTitle) newsTitle.focus();
        });
        
        newsEditorModal.addEventListener('hidden.bs.modal', function() {
            resetEditor();
        });
    }
    
    // Load draft on page load
    window.addEventListener('load', loadDraft);
}

// Setup rich text editor
function setupEditor() {
    const editor = document.getElementById('newsContentEditor');
    if (!editor) return;
    
    // Sync editor content with hidden textarea
    editor.addEventListener('input', syncEditor);
    
    editor.addEventListener('paste', function(e) {
        // Clean pasted HTML
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, text);
        syncEditor();
    });
    
    // Keyboard shortcuts
    editor.addEventListener('keydown', function(e) {
        // Bold: Ctrl+B
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            document.execCommand('bold', false, null);
            syncEditor();
        }
        // Italic: Ctrl+I
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            document.execCommand('italic', false, null);
            syncEditor();
        }
        // Save draft: Ctrl+S
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveDraft();
            showToast('Draf disimpan', 'info');
        }
    });
    
    // Setup toolbar buttons
    setupEditorToolbar();
}

// Setup editor toolbar
function setupEditorToolbar() {
    const toolbarButtons = [
        { command: 'bold', icon: 'bi-type-bold', title: 'Tebal (Ctrl+B)' },
        { command: 'italic', icon: 'bi-type-italic', title: 'Miring (Ctrl+I)' },
        { command: 'underline', icon: 'bi-type-underline', title: 'Garis Bawah' },
        { command: 'insertUnorderedList', icon: 'bi-list-ul', title: 'Daftar poin' },
        { command: 'insertOrderedList', icon: 'bi-list-ol', title: 'Daftar nomor' },
        { command: 'createLink', icon: 'bi-link', title: 'Tautan' },
        { command: 'insertImage', icon: 'bi-image', title: 'Gambar' },
        { command: 'undo', icon: 'bi-arrow-counterclockwise', title: 'Undo' },
        { command: 'redo', icon: 'bi-arrow-clockwise', title: 'Redo' }
    ];
    
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;
    
    toolbarButtons.forEach(btn => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-secondary me-1 mb-1';
        button.innerHTML = `<i class="bi ${btn.icon}"></i>`;
        button.title = btn.title;
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (btn.command === 'createLink') {
                insertLink();
            } else if (btn.command === 'insertImage') {
                insertImage();
            } else if (btn.command === 'formatBlock') {
                document.execCommand('formatBlock', false, btn.value);
            } else {
                document.execCommand(btn.command, false, null);
            }
            
            syncEditor();
        });
        
        toolbar.appendChild(button);
    });
}

// Sync editor content with hidden textarea
function syncEditor() {
    const editor = document.getElementById('newsContentEditor');
    const textarea = document.getElementById('newsContent');
    
    if (editor && textarea) {
        // Clean HTML before saving
        let content = editor.innerHTML
            .replace(/<div><br><\/div>/gi, '<br>')
            .replace(/<div>/gi, '<p>')
            .replace(/<\/div>/gi, '</p>')
            .replace(/<p><\/p>/gi, '')
            .replace(/\n/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        textarea.value = content;
    }
}

// Insert link dialog
function insertLink() {
    const url = prompt('Masukkan URL tautan:', 'https://');
    if (url) {
        const text = prompt('Teks untuk tautan:', 'Klik di sini');
        if (text) {
            document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
            syncEditor();
        }
    }
}

// Insert image dialog
function insertImage() {
    const url = prompt('Masukkan URL gambar:', 'https://');
    if (url) {
        const alt = prompt('Teks alternatif untuk gambar:', 'Gambar');
        const width = prompt('Lebar gambar (px):', '600');
        document.execCommand('insertHTML', false, 
            `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; width: ${width}px;" class="img-fluid rounded mb-2">`);
        syncEditor();
    }
}

// Load profil pengguna
function loadUserProfile() {
    try {
        const savedUser = localStorage.getItem('eggTrackUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            
            // Update UI dengan informasi user
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            if (userRoleDisplay) {
                userRoleDisplay.textContent = currentUser.name || currentUser.username || 'Administrator';
            }
            
            // Set author name in form jika kosong
            const authorField = document.getElementById('newsAuthor');
            if (authorField && !authorField.value && currentUser.name) {
                authorField.value = currentUser.name;
            }
        } else {
            // Redirect ke login jika tidak ada user
            window.location.href = 'login.html';
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
        window.location.href = 'login.html';
    }
}

// Check connection status
async function checkConnection() {
    try {
        const test = await fetch(`${APPS_SCRIPT_URL}?action=ping`, {
            method: 'GET',
            mode: 'no-cors'
        });
        isOnline = true;
        updateConnectionStatus(true);
        return true;
    } catch (error) {
        isOnline = false;
        updateConnectionStatus(false);
        return false;
    }
}

// Update connection status display
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (connected) {
            statusElement.innerHTML = '<i class="bi bi-wifi text-success me-1"></i> Online';
            statusElement.className = 'badge bg-success';
        } else {
            statusElement.innerHTML = '<i class="bi bi-wifi-off text-danger me-1"></i> Offline';
            statusElement.className = 'badge bg-danger';
        }
    }
}

// Load data berita dari server
async function loadNews() {
    try {
        showLoading('newsTableBody', true);
        
        if (isOnline) {
            // Try to load from server
            const result = await fetchData('getNews');
            
            if (result && result.success && result.data && result.data.length > 0) {
                // Process server data
                newsData = normalizeNewsData(result.data);
                showToast(`Berhasil memuat ${newsData.length} berita dari server`, 'success');
            } else {
                // Fallback to demo data
                useDemoNewsData();
                showToast('Server tidak merespon, menggunakan data demo', 'warning');
            }
        } else {
            // Offline mode - use demo data
            useDemoNewsData();
            showToast('Mode offline: Menggunakan data demo', 'warning');
        }
        
        // Sort by date (newest first)
        newsData.sort((a, b) => {
            const dateA = new Date(a.CreatedAt || a.Date || a.createdAt);
            const dateB = new Date(b.CreatedAt || b.Date || b.createdAt);
            return dateB - dateA;
        });
        
        filteredNewsData = [...newsData];
        
        displayNews();
        updateNewsStats();
        
    } catch (error) {
        console.error('Error loading news:', error);
        useDemoNewsData();
        showToast('Gagal memuat data, menggunakan data demo', 'danger');
    } finally {
        showLoading('newsTableBody', false);
    }
}

// Normalize news data from various formats
function normalizeNewsData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => {
        // Handle various field name formats
        return {
            ID: item.ID || item.id || generateId(),
            Title: item.Title || item.title || item.Headline || 'Tanpa Judul',
            Excerpt: item.Excerpt || item.excerpt || item.Summary || '',
            Content: item.Content || item.content || item.Body || '',
            ImageURL: item.ImageURL || item.imageURL || item.Image || item.image || '',
            Category: item.Category || item.category || item.Type || 'Terbaru',
            Author: item.Author || item.author || item.Creator || 'Admin EggTrack',
            Status: item.Status || item.status || 'Draft',
            Date: item.Date || item.date || item.PublishDate || new Date().toISOString().split('T')[0],
            CreatedAt: item.CreatedAt || item.createdAt || item.Timestamp || new Date().toISOString(),
            Featured: Boolean(item.Featured || item.featured || item.Highlight || false),
            Views: parseInt(item.Views || item.views || item.ViewCount || 0)
        };
    });
}

// Generate ID for new items
function generateId() {
    return Math.floor(Math.random() * 1000000);
}

// Gunakan data demo untuk pengujian
function useDemoNewsData() {
    newsData = [...DEMO_ADMIN_NEWS_DATA];
    filteredNewsData = [...newsData];
    
    // Sort by date (newest first)
    newsData.sort((a, b) => {
        const dateA = new Date(a.CreatedAt || a.Date);
        const dateB = new Date(b.CreatedAt || b.Date);
        return dateB - dateA;
    });
    
    displayNews();
    updateNewsStats();
}

// Tampilkan data berita dalam tabel
function displayNews() {
    const tableBody = document.getElementById('newsTableBody');
    if (!tableBody) return;
    
    if (filteredNewsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <i class="bi bi-newspaper display-4 text-muted d-block mb-3"></i>
                    <h5 class="text-muted mb-3">Belum ada berita</h5>
                    <p class="text-muted mb-4">Mulai dengan menambahkan berita pertama Anda</p>
                    <button class="btn btn-primary" id="addFirstNewsBtn">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Berita Pertama
                    </button>
                </td>
            </tr>
        `;
        
        // Add event listener to the button
        setTimeout(() => {
            const addFirstNewsBtn = document.getElementById('addFirstNewsBtn');
            if (addFirstNewsBtn) {
                addFirstNewsBtn.addEventListener('click', () => openNewsEditor());
            }
        }, 100);
        
        updatePagination(0);
        return;
    }
    
    // Pagination
    const totalPages = Math.ceil(filteredNewsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredNewsData.slice(startIndex, endIndex);
    
    // Generate table rows
    let html = '';
    
    pageData.forEach((news) => {
        // Status badge
        let statusClass = 'secondary';
        let statusText = news.Status;
        let statusIcon = 'bi-file-earmark';
        
        if (news.Status === 'Published') {
            statusClass = 'success';
            statusText = 'Terbit';
            statusIcon = 'bi-check-circle';
        } else if (news.Status === 'Draft') {
            statusClass = 'warning';
            statusText = 'Draf';
            statusIcon = 'bi-pencil';
        } else if (news.Status === 'Archived') {
            statusClass = 'secondary';
            statusText = 'Arsip';
            statusIcon = 'bi-archive';
        }
        
        // Featured badge
        const featuredBadge = news.Featured ? 
            '<span class="badge bg-warning text-dark ms-1" title="Berita Unggulan"><i class="bi bi-star-fill"></i></span>' : '';
        
        // Views badge
        const viewsBadge = news.Views > 0 ? 
            `<span class="badge bg-info ms-1" title="Dilihat ${news.Views} kali"><i class="bi bi-eye me-1"></i>${news.Views}</span>` : '';
        
        html += `
            <tr>
                <td>
                    <img src="${news.ImageURL || 'https://via.placeholder.com/100x60?text=No+Image'}" 
                         alt="${news.Title}" 
                         class="news-image-preview rounded"
                         onerror="this.src='https://via.placeholder.com/100x60?text=Error'">
                </td>
                <td>
                    <strong class="d-block">${news.Title}</strong>
                    <small class="text-muted">${(news.Excerpt || '').substring(0, 80)}...</small>
                </td>
                <td>
                    <div class="small">${formatDate(news.Date)}</div>
                </td>
                <td>
                    <span class="badge bg-primary">${news.Category}</span>
                    ${featuredBadge}
                    ${viewsBadge}
                </td>
                <td>
                    <span class="badge bg-${statusClass}">
                        <i class="bi ${statusIcon} me-1"></i>${statusText}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary edit-news-btn" data-id="${news.ID}" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-${news.Status === 'Published' ? 'warning' : 'success'} publish-news-btn" 
                                data-id="${news.ID}" 
                                data-status="${news.Status === 'Published' ? 'draft' : 'publish'}"
                                title="${news.Status === 'Published' ? 'Ubah ke Draf' : 'Terbitkan'}">
                            <i class="bi ${news.Status === 'Published' ? 'bi-file-earmark' : 'bi-cloud-arrow-up'}"></i>
                        </button>
                        <button class="btn btn-outline-info preview-news-btn" data-id="${news.ID}" title="Preview">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-news-btn" data-id="${news.ID}" title="Hapus">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to buttons
    addRowEventListeners();
    
    // Update pagination
    updatePagination(totalPages);
}

// Add event listeners to table row buttons
function addRowEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-news-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const newsId = this.dataset.id;
            openNewsEditor(newsId);
        });
    });
    
    // Publish/Draft buttons
    document.querySelectorAll('.publish-news-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const newsId = this.dataset.id;
            const newStatus = this.dataset.status === 'publish' ? 'Published' : 'Draft';
            togglePublishStatus(newsId, newStatus);
        });
    });
    
    // Preview buttons
    document.querySelectorAll('.preview-news-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const newsId = this.dataset.id;
            previewNews(newsId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-news-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const newsId = this.dataset.id;
            confirmDelete(newsId);
        });
    });
}

// Update pagination controls
function updatePagination(totalPages) {
    const pagination = document.getElementById('newsPagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous" data-page="${currentPage - 1}">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    pagination.appendChild(prevLi);
    
    // Page numbers - show max 5 pages
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        firstLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
        pagination.appendChild(firstLi);
        
        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(ellipsisLi);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        pagination.appendChild(li);
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(ellipsisLi);
        }
        
        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        lastLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
        pagination.appendChild(lastLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next" data-page="${currentPage + 1}">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    pagination.appendChild(nextLi);
    
    // Add event listeners
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                displayNews();
                // Scroll to top of table
                document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Open news editor modal
function openNewsEditor(newsId = null) {
    const modalElement = document.getElementById('newsEditorModal');
    if (!modalElement) return;
    
    const modal = new bootstrap.Modal(modalElement);
    const form = document.getElementById('newsForm');
    
    // Reset form
    if (form) form.reset();
    
    const editor = document.getElementById('newsContentEditor');
    if (editor) editor.innerHTML = '';
    
    document.getElementById('imagePreview')?.classList.add('d-none');
    
    // Set default date to today
    const publishDate = document.getElementById('publishDate');
    if (publishDate) {
        publishDate.value = new Date().toISOString().split('T')[0];
    }
    
    // Set default author
    const authorField = document.getElementById('newsAuthor');
    if (authorField && currentUser && !authorField.value) {
        authorField.value = currentUser.name || 'Admin EggTrack';
    }
    
    if (newsId) {
        // Edit mode
        editMode = true;
        
        const modalLabel = document.getElementById('newsEditorModalLabel');
        if (modalLabel) {
            modalLabel.textContent = 'Edit Berita';
        }
        
        const saveBtn = document.getElementById('saveNewsBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-save me-2"></i> Update Berita';
        }
        
        const news = newsData.find(n => n.ID == newsId);
        
        if (news) {
            document.getElementById('newsId').value = news.ID;
            document.getElementById('newsTitle').value = news.Title;
            document.getElementById('newsExcerpt').value = news.Excerpt || '';
            
            if (editor) {
                editor.innerHTML = news.Content || '';
                syncEditor();
            }
            
            document.getElementById('newsImage').value = news.ImageURL || '';
            document.getElementById('newsCategory').value = news.Category || 'Terbaru';
            document.getElementById('newsAuthor').value = news.Author || 'Admin EggTrack';
            document.getElementById('newsStatus').value = news.Status || 'Draft';
            
            if (publishDate && news.Date) {
                publishDate.value = news.Date;
            }
            
            document.getElementById('featuredNews').checked = news.Featured || false;
            
            // Show image preview
            if (news.ImageURL) {
                updateImagePreview(news.ImageURL);
            }
        }
    } else {
        // Add mode
        editMode = false;
        
        const modalLabel = document.getElementById('newsEditorModalLabel');
        if (modalLabel) {
            modalLabel.textContent = 'Tambah Berita Baru';
        }
        
        const saveBtn = document.getElementById('saveNewsBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-save me-2"></i> Simpan Berita';
        }
    }
    
    modal.show();
}

// Update image preview
function updateImagePreview(imageUrl) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    if (imageUrl) {
        preview.src = imageUrl;
        preview.classList.remove('d-none');
        
        // Add error handler
        preview.onerror = function() {
            this.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
            this.alt = 'Image not found';
        };
    } else {
        preview.classList.add('d-none');
    }
}

// Save news (add or update)
async function saveNews() {
    try {
        // Validate form
        const title = document.getElementById('newsTitle')?.value.trim();
        const content = document.getElementById('newsContent')?.value.trim();
        const image = document.getElementById('newsImage')?.value.trim();
        
        if (!title) {
            showToast('Judul berita wajib diisi', 'warning');
            document.getElementById('newsTitle')?.focus();
            return;
        }
        
        if (!content) {
            showToast('Konten berita wajib diisi', 'warning');
            document.getElementById('newsContentEditor')?.focus();
            return;
        }
        
        if (!image) {
            showToast('URL gambar wajib diisi', 'warning');
            document.getElementById('newsImage')?.focus();
            return;
        }
        
        const newsDataToSave = {
            Title: title,
            Excerpt: document.getElementById('newsExcerpt')?.value.trim() || '',
            Content: content,
            ImageURL: image,
            Category: document.getElementById('newsCategory')?.value || 'Terbaru',
            Author: document.getElementById('newsAuthor')?.value.trim() || 'Admin EggTrack',
            Status: document.getElementById('newsStatus')?.value || 'Draft',
            Date: document.getElementById('publishDate')?.value || new Date().toISOString().split('T')[0],
            Featured: document.getElementById('featuredNews')?.checked ? 1 : 0,
            Views: 0
        };
        
        const newsId = document.getElementById('newsId')?.value;
        let result;
        
        // Show loading on save button
        const saveBtn = document.getElementById('saveNewsBtn');
        const originalText = saveBtn ? saveBtn.innerHTML : '';
        
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Menyimpan...';
            saveBtn.disabled = true;
        }
        
        if (isOnline) {
            if (newsId) {
                // Update existing news
                newsDataToSave.ID = newsId;
                result = await fetchData('updateNews', newsDataToSave);
            } else {
                // Add new news
                result = await fetchData('addNews', newsDataToSave);
            }
        } else {
            // Offline mode - simulate success
            result = { success: true, message: 'Data disimpan secara lokal' };
        }
        
        if (result && result.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newsEditorModal'));
            if (modal) modal.hide();
            
            // Reload news
            await loadNews();
            
            // Show success message
            const message = newsId ? 'Berita berhasil diperbarui!' : 'Berita berhasil ditambahkan!';
            showToast(message, 'success');
            
        } else {
            throw new Error(result?.message || 'Gagal menyimpan berita');
        }
        
    } catch (error) {
        console.error('Error saving news:', error);
        showToast(`Gagal menyimpan berita: ${error.message}`, 'danger');
    } finally {
        // Restore save button
        const saveBtn = document.getElementById('saveNewsBtn');
        if (saveBtn) {
            saveBtn.innerHTML = editMode ? 
                '<i class="bi bi-save me-2"></i> Update Berita' : 
                '<i class="bi bi-save me-2"></i> Simpan Berita';
            saveBtn.disabled = false;
        }
    }
}

// Save draft automatically
function saveDraft() {
    const title = document.getElementById('newsTitle')?.value.trim();
    const content = document.getElementById('newsContent')?.value.trim();
    
    if (title || content) {
        const draft = {
            title: title,
            content: content,
            excerpt: document.getElementById('newsExcerpt')?.value.trim() || '',
            image: document.getElementById('newsImage')?.value.trim() || '',
            category: document.getElementById('newsCategory')?.value || 'Terbaru',
            author: document.getElementById('newsAuthor')?.value.trim() || '',
            status: document.getElementById('newsStatus')?.value || 'Draft',
            date: document.getElementById('publishDate')?.value || '',
            featured: document.getElementById('featuredNews')?.checked || false,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('eggTrackNewsDraft', JSON.stringify(draft));
    }
}

// Load draft if exists
function loadDraft() {
    try {
        const draft = localStorage.getItem('eggTrackNewsDraft');
        if (draft) {
            const data = JSON.parse(draft);
            
            // Check if draft is less than 1 hour old
            const draftTime = new Date(data.timestamp);
            const now = new Date();
            const hoursDiff = (now - draftTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 1) {
                if (confirm('Ada draf berita yang belum disimpan dari sesi sebelumnya. Muat draf?')) {
                    document.getElementById('newsTitle').value = data.title || '';
                    document.getElementById('newsExcerpt').value = data.excerpt || '';
                    document.getElementById('newsContentEditor').innerHTML = data.content || '';
                    document.getElementById('newsContent').value = data.content || '';
                    document.getElementById('newsImage').value = data.image || '';
                    document.getElementById('newsCategory').value = data.category || 'Terbaru';
                    document.getElementById('newsAuthor').value = data.author || '';
                    document.getElementById('newsStatus').value = data.status || 'Draft';
                    document.getElementById('publishDate').value = data.date || '';
                    document.getElementById('featuredNews').checked = data.featured || false;
                    
                    if (data.image) {
                        updateImagePreview(data.image);
                    }
                    
                    syncEditor();
                    showToast('Draf berita dimuat', 'info');
                }
            } else {
                // Clear old draft
                localStorage.removeItem('eggTrackNewsDraft');
            }
        }
    } catch (e) {
        console.error('Error loading draft:', e);
    }
}

// Reset editor
function resetEditor() {
    editMode = false;
    const form = document.getElementById('newsForm');
    if (form) form.reset();
    
    const editor = document.getElementById('newsContentEditor');
    if (editor) editor.innerHTML = '';
    
    const preview = document.getElementById('imagePreview');
    if (preview) preview.classList.add('d-none');
    
    // Clear draft after successful save
    localStorage.removeItem('eggTrackNewsDraft');
}

// Confirm delete news
function confirmDelete(newsId) {
    const news = newsData.find(n => n.ID == newsId);
    
    if (news) {
        deleteNewsId = newsId;
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }
}

// Delete news
async function deleteNews() {
    try {
        if (!deleteNewsId) return;
        
        if (isOnline) {
            const result = await fetchData('deleteNews', { id: deleteNewsId });
            
            if (!result || !result.success) {
                throw new Error(result?.message || 'Gagal menghapus berita');
            }
        }
        
        // Remove from local data
        newsData = newsData.filter(n => n.ID != deleteNewsId);
        filteredNewsData = filteredNewsData.filter(n => n.ID != deleteNewsId);
        
        // Update display
        displayNews();
        updateNewsStats();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        if (modal) modal.hide();
        
        // Show success message
        showToast('Berita berhasil dihapus!', 'success');
        
    } catch (error) {
        console.error('Error deleting news:', error);
        showToast('Gagal menghapus berita: ' + error.message, 'danger');
    } finally {
        deleteNewsId = null;
    }
}

// Toggle publish status
async function togglePublishStatus(newsId, newStatus) {
    try {
        const news = newsData.find(n => n.ID == newsId);
        if (!news) return;
        
        if (isOnline) {
            const result = await fetchData('updateNews', {
                ID: newsId,
                Status: newStatus
            });
            
            if (!result || !result.success) {
                throw new Error(result?.message || 'Gagal mengubah status');
            }
        }
        
        // Update local data
        news.Status = newStatus;
        
        // Update display
        displayNews();
        
        // Show success message
        const statusText = newStatus === 'Published' ? 'diterbitkan' : 'diubah ke draf';
        showToast(`Berita ${statusText}!`, 'success');
        
    } catch (error) {
        console.error('Error toggling publish status:', error);
        showToast('Gagal mengubah status berita', 'danger');
    }
}

// Preview news in new window
function previewNews(newsId) {
    const news = newsData.find(n => n.ID == newsId);
    if (news) {
        const previewUrl = `news-detail.html?id=${newsId}&preview=true`;
        window.open(previewUrl, '_blank', 'width=1200,height=800');
    }
}

// Search news
function searchNews() {
    const searchInput = document.getElementById('searchNews');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const category = document.getElementById('filterCategory')?.value;
    const status = document.getElementById('filterStatus')?.value;
    
    let filtered = newsData;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(news => {
            const title = (news.Title || '').toLowerCase();
            const excerpt = (news.Excerpt || '').toLowerCase();
            const content = (news.Content || '').toLowerCase();
            const author = (news.Author || '').toLowerCase();
            
            return title.includes(searchTerm) || 
                   excerpt.includes(searchTerm) || 
                   content.includes(searchTerm) || 
                   author.includes(searchTerm);
        });
    }
    
    // Filter by category
    if (category) {
        filtered = filtered.filter(news => news.Category === category);
    }
    
    // Filter by status
    if (status) {
        filtered = filtered.filter(news => news.Status === status);
    }
    
    filteredNewsData = filtered;
    currentPage = 1;
    displayNews();
}

// Filter news (alias for search)
function filterNews() {
    searchNews();
}

// Update news statistics
function updateNewsStats() {
    const totalNews = newsData.length;
    const publishedNews = newsData.filter(n => n.Status === 'Published').length;
    const draftNews = newsData.filter(n => n.Status === 'Draft').length;
    const archivedNews = newsData.filter(n => n.Status === 'Archived').length;
    const featuredNews = newsData.filter(n => n.Featured).length;
    
    // Update UI if needed
    console.log(`Statistik: Total=${totalNews}, Terbit=${publishedNews}, Draf=${draftNews}, Arsip=${archivedNews}, Unggulan=${featuredNews}`);
    
    // You can update a stats display element if you have one
    const statsElement = document.getElementById('newsStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="row g-2">
                <div class="col-6 col-md-3">
                    <div class="bg-primary text-white p-2 rounded text-center">
                        <div class="fs-4 fw-bold">${totalNews}</div>
                        <small>Total Berita</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-success text-white p-2 rounded text-center">
                        <div class="fs-4 fw-bold">${publishedNews}</div>
                        <small>Terbit</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-warning text-white p-2 rounded text-center">
                        <div class="fs-4 fw-bold">${draftNews}</div>
                        <small>Draf</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-info text-white p-2 rounded text-center">
                        <div class="fs-4 fw-bold">${featuredNews}</div>
                        <small>Unggulan</small>
                    </div>
                </div>
            </div>
        `;
    }
}

// Handler untuk logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout dari sistem?')) {
        // Save any unsaved draft
        const title = document.getElementById('newsTitle')?.value.trim();
        const content = document.getElementById('newsContent')?.value.trim();
        
        if (title || content) {
            saveDraft();
        }
        
        // Clear user data
        localStorage.removeItem('eggTrackUser');
        localStorage.removeItem('eggTrackToken');
        
        // Redirect to login
        window.location.href = 'login.html';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Fetch data from Google Apps Script
async function fetchData(action, params = {}) {
    if (!isOnline) {
        throw new Error('Offline mode - cannot connect to server');
    }
    
    try {
        const urlParams = new URLSearchParams();
        urlParams.append('action', action);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                urlParams.append(key, params[key].toString());
            }
        });
        
        const url = `${APPS_SCRIPT_URL}?${urlParams.toString()}`;
        const response = await fetch(url, { 
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Try to parse as JSON
        try {
            return JSON.parse(text);
        } catch (e) {
            // If not JSON, try to extract JSON from text
            const jsonMatch = text.match(/{.*}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        throw error;
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

// Show loading state
function showLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (isLoading) {
        element.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="d-flex flex-column align-items-center">
                        <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="text-muted">Memuat data berita...</p>
                        <div class="progress mt-2" style="height: 4px; width: 200px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${getToastIcon(type)} me-2 fs-5"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
        delay: 3000,
        autohide: true
    });
    bsToast.show();
    
    // Remove toast after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Get icon for toast type
function getToastIcon(type) {
    const icons = {
        'success': 'bi-check-circle-fill',
        'danger': 'bi-exclamation-triangle-fill',
        'warning': 'bi-exclamation-circle-fill',
        'info': 'bi-info-circle-fill'
    };
    return icons[type] || 'bi-info-circle-fill';
}

// Auto-refresh data every 5 minutes
setInterval(() => {
    if (isOnline && document.visibilityState === 'visible') {
        loadNews();
    }
}, 300000); // 5 minutes

// Save draft when leaving page
window.addEventListener('beforeunload', function(e) {
    const title = document.getElementById('newsTitle')?.value.trim();
    const content = document.getElementById('newsContent')?.value.trim();
    
    if (title || content) {
        saveDraft();
        // For Chrome
        e.preventDefault();
        // For other browsers
        e.returnValue = '';
    }
});

// Add CSS for spinner animation
if (!document.querySelector('style[data-spinner-animation]')) {
    const style = document.createElement('style');
    style.setAttribute('data-spinner-animation', 'true');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .spin {
            animation: spin 1s linear infinite;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
}