// news-management.js
// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Data berita dan state management
let newsData = [];
let filteredNewsData = [];
let currentPage = 1;
const itemsPerPage = 10;
let deleteNewsId = null;
let isOnline = true;
let editMode = false;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeNewsManagement();
});

// Fungsi inisialisasi utama
async function initializeNewsManagement() {
    try {
        loadUserProfile();
        setupEventListeners();
        setupEditor();
        checkConnection();
        await loadNews();
        updateNewsStats();
    } catch (error) {
        console.error('Error initializing news management:', error);
        showToast('Gagal menginisialisasi sistem berita', 'danger');
    }
}

// Setup semua event listeners
function setupEventListeners() {
    // Tombol tambah berita
    document.getElementById('addNewsBtn')?.addEventListener('click', () => openNewsEditor());
    
    // Tombol simpan berita
    document.getElementById('saveNewsBtn')?.addEventListener('click', saveNews);
    
    // Tombol konfirmasi hapus
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', deleteNews);
    
    // Pencarian berita
    document.getElementById('searchBtn')?.addEventListener('click', searchNews);
    document.getElementById('searchNews')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchNews();
    });
    
    // Live search (debounced)
    let searchTimeout;
    document.getElementById('searchNews')?.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchNews();
        }, 300);
    });
    
    // Filter berita
    document.getElementById('filterCategory')?.addEventListener('change', filterNews);
    document.getElementById('filterStatus')?.addEventListener('change', filterNews);
    document.getElementById('sortOrder')?.addEventListener('change', filterNews);
    
    // Preview gambar
    document.getElementById('newsImage')?.addEventListener('input', function() {
        updateImagePreview(this.value);
    });
    
    // Bulk actions
    document.getElementById('bulkAction')?.addEventListener('change', function() {
        if (this.value === 'delete') {
            confirmBulkDelete();
        } else if (this.value !== '') {
            applyBulkAction(this.value);
        }
    });
    
    // Select all checkbox
    document.getElementById('selectAllNews')?.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.news-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = this.checked;
        });
    });
    
    // Refresh button
    document.getElementById('refreshNewsBtn')?.addEventListener('click', async function() {
        this.innerHTML = '<i class="bi bi-arrow-clockwise me-1 spin"></i> Memuat...';
        await loadNews();
        this.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refresh';
    });
    
    // Export button
    document.getElementById('exportNewsBtn')?.addEventListener('click', exportNews);
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Modal events
    document.getElementById('newsEditorModal')?.addEventListener('shown.bs.modal', function() {
        document.getElementById('newsTitle')?.focus();
    });
    
    document.getElementById('newsEditorModal')?.addEventListener('hidden.bs.modal', function() {
        resetEditor();
    });
}

// Setup rich text editor
function setupEditor() {
    const editor = document.getElementById('newsContentEditor');
    if (!editor) return;
    
    // Basic editor functions
    const toolbarButtons = [
        { id: 'boldBtn', command: 'bold', icon: 'bi-type-bold', title: 'Tebal (Ctrl+B)' },
        { id: 'italicBtn', command: 'italic', icon: 'bi-type-italic', title: 'Miring (Ctrl+I)' },
        { id: 'underlineBtn', command: 'underline', icon: 'bi-type-underline', title: 'Garis Bawah (Ctrl+U)' },
        { id: 'separator1', type: 'separator' },
        { id: 'bulletListBtn', command: 'insertUnorderedList', icon: 'bi-list-ul', title: 'Daftar poin' },
        { id: 'numberListBtn', command: 'insertOrderedList', icon: 'bi-list-ol', title: 'Daftar nomor' },
        { id: 'separator2', type: 'separator' },
        { id: 'linkBtn', command: 'createLink', icon: 'bi-link', title: 'Tautan' },
        { id: 'imageBtn', command: 'insertImage', icon: 'bi-image', title: 'Gambar' },
        { id: 'separator3', type: 'separator' },
        { id: 'headingBtn', command: 'formatBlock', value: 'h3', icon: 'bi-type-h3', title: 'Judul' },
        { id: 'paragraphBtn', command: 'formatBlock', value: 'p', icon: 'bi-paragraph', title: 'Paragraf' },
        { id: 'separator4', type: 'separator' },
        { id: 'undoBtn', command: 'undo', icon: 'bi-arrow-counterclockwise', title: 'Undo (Ctrl+Z)' },
        { id: 'redoBtn', command: 'redo', icon: 'bi-arrow-clockwise', title: 'Redo (Ctrl+Y)' },
        { id: 'separator5', type: 'separator' },
        { id: 'clearBtn', command: 'removeFormat', icon: 'bi-eraser', title: 'Hapus format' }
    ];
    
    // Create toolbar
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
        toolbarButtons.forEach(btn => {
            if (btn.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'vr mx-2';
                toolbar.appendChild(separator);
            } else {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-sm btn-outline-secondary';
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
            }
        });
    }
    
    // Sync editor content with textarea
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
        }
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
            document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${text}</a>`);
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
            `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; width: ${width}px;" class="img-fluid rounded">`);
        syncEditor();
    }
}

// Load profil pengguna
function loadUserProfile() {
    const savedUser = localStorage.getItem('eggTrackUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            if (userRoleDisplay) {
                userRoleDisplay.textContent = user.name || 'Administrator';
            }
            // Set author name in form
            const authorField = document.getElementById('newsAuthor');
            if (authorField && !authorField.value) {
                authorField.value = user.name || 'Admin EggTrack';
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    } else {
        window.location.href = 'login.html';
    }
}

// Check connection status
async function checkConnection() {
    try {
        const test = await fetch(`${APPS_SCRIPT_URL}?action=ping`);
        const result = await test.json();
        isOnline = result && result.success;
        updateConnectionStatus(isOnline);
    } catch (error) {
        isOnline = false;
        updateConnectionStatus(false);
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
        showToast('Memuat data berita...', 'info');
        
        const result = await fetchData('getNews');
        
        if (result && result.success) {
            newsData = result.news || [];
            filteredNewsData = [...newsData];
            
            // Sort by date (newest first)
            newsData.sort((a, b) => new Date(b.CreatedAt || b.Date) - new Date(a.CreatedAt || a.Date));
            filteredNewsData.sort((a, b) => new Date(b.CreatedAt || b.Date) - new Date(a.CreatedAt || a.Date));
            
            displayNews();
            updateNewsStats();
            showToast(`Berhasil memuat ${newsData.length} berita`, 'success');
        } else {
            throw new Error(result?.message || 'Gagal memuat data');
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        
        // Use demo data if online mode fails
        if (!isOnline) {
            useDemoNewsData();
            showToast('Menggunakan data demo (mode offline)', 'warning');
        } else {
            showToast('Gagal memuat data berita', 'danger');
        }
    } finally {
        showLoading('newsTableBody', false);
    }
}

// Gunakan data demo untuk pengujian
function useDemoNewsData() {
    newsData = [
        {
            ID: 1,
            Title: 'Inovasi Pengolahan Telur Bebek dengan Teknologi Modern',
            Excerpt: 'Peternakan telur bebek di Indonesia mulai mengadopsi teknologi canggih untuk meningkatkan kualitas dan produktivitas...',
            Content: '<p>Industri peternakan telur bebek di Indonesia sedang mengalami transformasi digital yang signifikan. Peternak mulai mengadopsi teknologi canggih untuk meningkatkan kualitas dan produktivitas produksi telur bebek.</p><p>Berdasarkan data dari Kementerian Pertanian, implementasi sistem manajemen digital seperti EggTrack telah membantu peternak meningkatkan efisiensi operasional hingga 40%.</p>',
            ImageURL: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            Category: 'Terbaru',
            Author: 'Admin EggTrack',
            Status: 'Published',
            Date: '2024-03-15',
            CreatedAt: new Date().toISOString(),
            Featured: true,
            Views: 1250
        },
        {
            ID: 2,
            Title: 'Peluang Pasar Ekspor Telur Bebek Meningkat 25% di Kuartal Pertama 2024',
            Excerpt: 'Permintaan telur bebek dari pasar internasional menunjukkan peningkatan signifikan, membuka peluang baru bagi peternak lokal...',
            Content: '<p>Permintaan telur bebek dari pasar internasional menunjukkan peningkatan signifikan di awal tahun 2024. Berdasarkan data dari Badan Pusat Statistik, ekspor telur bebek Indonesia naik 25% dibandingkan periode yang sama tahun lalu.</p>',
            ImageURL: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            Category: 'Trending',
            Author: 'Admin EggTrack',
            Status: 'Published',
            Date: '2024-03-10',
            CreatedAt: new Date().toISOString(),
            Featured: false,
            Views: 890
        },
        {
            ID: 3,
            Title: 'Tips Manajemen Peternakan yang Efisien dengan Sistem Digital',
            Excerpt: 'Penerapan sistem manajemen digital terbukti meningkatkan efisiensi operasional peternakan hingga 40% berdasarkan studi terkini...',
            Content: '<p>Penerapan sistem manajemen digital terbukti meningkatkan efisiensi operasional peternakan hingga 40% berdasarkan studi terkini. Dengan sistem yang tepat, peternak dapat mengoptimalkan seluruh aspek operasional.</p>',
            ImageURL: 'https://images.unsplash.com/photo-1505253668822-42074d58a7c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            Category: 'Tips',
            Author: 'Admin EggTrack',
            Status: 'Published',
            Date: '2024-03-05',
            CreatedAt: new Date().toISOString(),
            Featured: true,
            Views: 750
        },
        {
            ID: 4,
            Title: 'Studi Terbaru: Telur Bebek Lebih Kaya Omega-3 dibanding Telur Ayam',
            Excerpt: 'Penelitian terbaru menunjukkan kandungan nutrisi telur bebek lebih unggul dalam hal asam lemak omega-3 dan vitamin...',
            Content: '<p>Penelitian terbaru menunjukkan kandungan nutrisi telur bebek lebih unggul dalam hal asam lemak omega-3 dan vitamin. Studi ini memberikan insight baru tentang manfaat kesehatan dari telur bebek.</p>',
            ImageURL: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            Category: 'Kesehatan',
            Author: 'Admin EggTrack',
            Status: 'Draft',
            Date: '2024-02-28',
            CreatedAt: new Date().toISOString(),
            Featured: false,
            Views: 0
        }
    ];
    
    filteredNewsData = [...newsData];
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
                <td colspan="8" class="text-center py-5">
                    <i class="bi bi-newspaper display-4 text-muted d-block mb-3"></i>
                    <h5 class="text-muted mb-3">Belum ada berita</h5>
                    <p class="text-muted mb-4">Mulai dengan menambahkan berita pertama Anda</p>
                    <button class="btn btn-primary" id="addFirstNewsBtn">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Berita Pertama
                    </button>
                </td>
            </tr>
        `;
        
        document.getElementById('addFirstNewsBtn')?.addEventListener('click', openNewsEditor);
        updatePagination(0);
        return;
    }
    
    // Pagination
    const totalPages = Math.ceil(filteredNewsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredNewsData.slice(startIndex, endIndex);
    
    // Generate table rows
    tableBody.innerHTML = '';
    
    pageData.forEach((news, index) => {
        const row = document.createElement('tr');
        row.className = 'align-middle';
        
        // Status badge
        let statusClass = 'secondary';
        let statusText = news.Status;
        if (news.Status === 'Published') {
            statusClass = 'success';
            statusText = '<i class="bi bi-check-circle me-1"></i> Terbit';
        } else if (news.Status === 'Draft') {
            statusClass = 'warning';
            statusText = '<i class="bi bi-pencil me-1"></i> Draf';
        } else if (news.Status === 'Archived') {
            statusClass = 'secondary';
            statusText = '<i class="bi bi-archive me-1"></i> Arsip';
        }
        
        // Featured badge
        const featuredBadge = news.Featured ? 
            '<span class="badge bg-warning text-dark ms-1" title="Berita Unggulan"><i class="bi bi-star-fill"></i></span>' : '';
        
        // Views badge
        const viewsBadge = news.Views > 100 ? 
            `<span class="badge bg-info ms-1" title="Dilihat ${news.Views} kali"><i class="bi bi-eye me-1"></i>${news.Views}</span>` : '';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="form-check-input news-checkbox" value="${news.ID}">
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${news.ImageURL || 'https://via.placeholder.com/60x40?text=No+Image'}" 
                         alt="${news.Title}" 
                         class="news-image-preview rounded me-3"
                         onerror="this.src='https://via.placeholder.com/60x40?text=Error'">
                    <div>
                        <strong class="d-block">${news.Title}</strong>
                        <small class="text-muted">${(news.Excerpt || '').substring(0, 80)}...</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="small">${formatDate(news.Date)}</div>
                <div class="text-muted smaller">${formatTime(news.CreatedAt)}</div>
            </td>
            <td>
                <span class="badge bg-primary">${news.Category}</span>
                ${featuredBadge}
                ${viewsBadge}
            </td>
            <td>
                <span class="badge bg-${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td class="text-center">
                ${news.Author || 'Admin'}
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary edit-news-btn" data-id="${news.ID}" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-success publish-news-btn" data-id="${news.ID}" 
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
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    addRowEventListeners();
    
    // Update pagination
    updatePagination(totalPages);
    
    // Update selected count
    updateSelectedCount();
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
    
    // Checkboxes
    document.querySelectorAll('.news-checkbox').forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
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
    
    // Calculate page range
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Adjust if at start
    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    
    // Adjust if at end
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        pagination.appendChild(li);
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

// Update selected news count
function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('.news-checkbox:checked').length;
    const selectedElement = document.getElementById('selectedCount');
    const bulkActionElement = document.getElementById('bulkAction');
    
    if (selectedElement) {
        selectedElement.textContent = selectedCount;
        selectedElement.parentElement.style.display = selectedCount > 0 ? 'inline-block' : 'none';
    }
    
    if (bulkActionElement) {
        bulkActionElement.disabled = selectedCount === 0;
    }
}

// Open news editor modal
function openNewsEditor(newsId = null) {
    const modal = new bootstrap.Modal(document.getElementById('newsEditorModal'));
    const form = document.getElementById('newsForm');
    
    // Reset form
    form.reset();
    document.getElementById('newsContentEditor').innerHTML = '';
    document.getElementById('imagePreview').classList.add('d-none');
    
    // Set default date to today
    document.getElementById('publishDate').value = new Date().toISOString().split('T')[0];
    
    if (newsId) {
        // Edit mode
        editMode = true;
        document.getElementById('newsEditorModalLabel').textContent = 'Edit Berita';
        document.getElementById('saveNewsBtn').innerHTML = '<i class="bi bi-save me-2"></i> Update Berita';
        
        const news = newsData.find(n => n.ID == newsId);
        
        if (news) {
            document.getElementById('newsId').value = news.ID;
            document.getElementById('newsTitle').value = news.Title;
            document.getElementById('newsExcerpt').value = news.Excerpt || '';
            document.getElementById('newsContentEditor').innerHTML = news.Content || '';
            document.getElementById('newsContent').value = news.Content || '';
            document.getElementById('newsImage').value = news.ImageURL || '';
            document.getElementById('newsCategory').value = news.Category || 'Terbaru';
            document.getElementById('newsAuthor').value = news.Author || 'Admin EggTrack';
            document.getElementById('newsStatus').value = news.Status || 'Draft';
            document.getElementById('publishDate').value = news.Date || '';
            document.getElementById('featuredNews').checked = news.Featured || false;
            document.getElementById('allowComments').checked = news.AllowComments !== false;
            
            // Show image preview
            if (news.ImageURL) {
                updateImagePreview(news.ImageURL);
            }
        }
    } else {
        // Add mode
        editMode = false;
        document.getElementById('newsEditorModalLabel').textContent = 'Tambah Berita Baru';
        document.getElementById('saveNewsBtn').innerHTML = '<i class="bi bi-save me-2"></i> Simpan Berita';
    }
    
    modal.show();
}

// Update image preview
function updateImagePreview(imageUrl) {
    const preview = document.getElementById('imagePreview');
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
        const title = document.getElementById('newsTitle').value.trim();
        const content = document.getElementById('newsContent').value.trim();
        const image = document.getElementById('newsImage').value.trim();
        
        if (!title) {
            showToast('Judul berita wajib diisi', 'warning');
            document.getElementById('newsTitle').focus();
            return;
        }
        
        if (!content) {
            showToast('Konten berita wajib diisi', 'warning');
            document.getElementById('newsContentEditor').focus();
            return;
        }
        
        if (!image) {
            showToast('URL gambar wajib diisi', 'warning');
            document.getElementById('newsImage').focus();
            return;
        }
        
        const newsData = {
            Title: title,
            Excerpt: document.getElementById('newsExcerpt').value.trim(),
            Content: content,
            ImageURL: image,
            Category: document.getElementById('newsCategory').value,
            Author: document.getElementById('newsAuthor').value.trim(),
            Status: document.getElementById('newsStatus').value,
            Date: document.getElementById('publishDate').value || new Date().toISOString().split('T')[0],
            Featured: document.getElementById('featuredNews').checked ? 1 : 0,
            AllowComments: document.getElementById('allowComments').checked ? 1 : 0
        };
        
        const newsId = document.getElementById('newsId').value;
        let result;
        
        // Show loading on save button
        const saveBtn = document.getElementById('saveNewsBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Menyimpan...';
        saveBtn.disabled = true;
        
        if (newsId) {
            // Update existing news
            newsData.ID = newsId;
            result = await fetchData('updateNews', newsData);
        } else {
            // Add new news
            result = await fetchData('addNews', newsData);
        }
        
        if (result && result.success) {
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('newsEditorModal')).hide();
            
            // Reload news
            await loadNews();
            
            // Show success message
            showToast(`Berita berhasil ${newsId ? 'diperbarui' : 'ditambahkan'}!`, 'success');
            
            // Log activity
            logActivity(newsId ? 'UPDATE_NEWS' : 'ADD_NEWS', 
                       `${newsId ? 'Updated' : 'Added'} news: ${title}`, 
                       newsId || result.id);
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
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    
    if (title || content) {
        const draft = {
            title: title,
            content: content,
            excerpt: document.getElementById('newsExcerpt').value.trim(),
            image: document.getElementById('newsImage').value.trim(),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('newsDraft', JSON.stringify(draft));
        showToast('Draf berita disimpan secara lokal', 'info');
    }
}

// Load draft if exists
function loadDraft() {
    const draft = localStorage.getItem('newsDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            if (confirm('Ada draf berita yang belum disimpan. Muat draf?')) {
                document.getElementById('newsTitle').value = data.title || '';
                document.getElementById('newsExcerpt').value = data.excerpt || '';
                document.getElementById('newsContentEditor').innerHTML = data.content || '';
                document.getElementById('newsContent').value = data.content || '';
                document.getElementById('newsImage').value = data.image || '';
                
                if (data.image) {
                    updateImagePreview(data.image);
                }
                
                syncEditor();
                showToast('Draf berita dimuat', 'success');
            }
        } catch (e) {
            console.error('Error loading draft:', e);
        }
    }
}

// Reset editor
function resetEditor() {
    editMode = false;
    const form = document.getElementById('newsForm');
    if (form) form.reset();
    document.getElementById('newsContentEditor').innerHTML = '';
    document.getElementById('imagePreview').classList.add('d-none');
}

// Confirm delete news
function confirmDelete(newsId) {
    deleteNewsId = newsId;
    const news = newsData.find(n => n.ID == newsId);
    
    if (news) {
        document.getElementById('deleteNewsTitle').textContent = news.Title;
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }
}

// Delete news
async function deleteNews() {
    try {
        if (!deleteNewsId) return;
        
        const result = await fetchData('deleteNews', { id: deleteNewsId });
        
        if (result && result.success) {
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            
            // Remove from local data
            newsData = newsData.filter(n => n.ID != deleteNewsId);
            filteredNewsData = filteredNewsData.filter(n => n.ID != deleteNewsId);
            
            // Update display
            displayNews();
            updateNewsStats();
            
            // Show success message
            showToast('Berita berhasil dihapus!', 'success');
            
            // Log activity
            logActivity('DELETE_NEWS', `Deleted news ID: ${deleteNewsId}`, deleteNewsId);
        } else {
            throw new Error(result?.message || 'Gagal menghapus berita');
        }
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
        
        const result = await fetchData('updateNews', {
            ID: newsId,
            Status: newStatus
        });
        
        if (result && result.success) {
            // Update local data
            news.Status = newStatus;
            
            // Update display
            displayNews();
            
            // Show success message
            showToast(`Berita ${newStatus === 'Published' ? 'diterbitkan' : 'diubah ke draf'}!`, 'success');
            
            // Log activity
            logActivity('UPDATE_NEWS_STATUS', 
                       `Changed status to ${newStatus} for: ${news.Title}`, 
                       newsId);
        } else {
            throw new Error(result?.message || 'Gagal mengubah status');
        }
    } catch (error) {
        console.error('Error toggling publish status:', error);
        showToast('Gagal mengubah status berita', 'danger');
    }
}

// Preview news in new window
function previewNews(newsId) {
    const news = newsData.find(n => n.ID == newsId);
    if (news) {
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview: ${news.Title}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
                    .preview-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                    .news-image { width: 100%; height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; }
                    .news-meta { color: #6c757d; font-size: 0.9em; margin-bottom: 20px; }
                    .news-content { line-height: 1.8; }
                    .news-content img { max-width: 100%; height: auto; }
                    .news-content h1, .news-content h2, .news-content h3 { color: #333; margin-top: 1.5em; }
                    .news-content p { margin-bottom: 1em; }
                    .badge { font-size: 0.8em; }
                </style>
            </head>
            <body>
                <div class="preview-container mt-4 mb-4">
                    <h1 class="mb-3">${news.Title}</h1>
                    <div class="news-meta">
                        <span class="badge bg-primary me-2">${news.Category}</span>
                        <i class="bi bi-calendar me-1"></i> ${formatDate(news.Date)} 
                        <i class="bi bi-person ms-3 me-1"></i> ${news.Author}
                        <span class="ms-3"><i class="bi bi-eye me-1"></i> ${news.Views || 0} views</span>
                    </div>
                    <img src="${news.ImageURL}" alt="${news.Title}" class="news-image">
                    <div class="news-content">
                        ${news.Content}
                    </div>
                    <hr class="my-4">
                    <div class="text-center">
                        <p class="text-muted">Preview Mode - Berita ini ${news.Status === 'Published' ? 'sudah diterbitkan' : 'masih dalam status draf'}</p>
                        <button class="btn btn-primary" onclick="window.close()">
                            <i class="bi bi-x-circle me-1"></i> Tutup Preview
                        </button>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
}

// Search news
function searchNews() {
    const searchTerm = document.getElementById('searchNews').value.toLowerCase().trim();
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    let filtered = newsData;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(news => 
            news.Title.toLowerCase().includes(searchTerm) ||
            (news.Excerpt && news.Excerpt.toLowerCase().includes(searchTerm)) ||
            (news.Content && news.Content.toLowerCase().includes(searchTerm)) ||
            (news.Author && news.Author.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by category
    if (category) {
        filtered = filtered.filter(news => news.Category === category);
    }
    
    // Filter by status
    if (status) {
        filtered = filtered.filter(news => news.Status === status);
    }
    
    // Sort results
    switch (sortOrder) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.CreatedAt || b.Date) - new Date(a.CreatedAt || a.Date));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.CreatedAt || a.Date) - new Date(b.CreatedAt || b.Date));
            break;
        case 'title_asc':
            filtered.sort((a, b) => a.Title.localeCompare(b.Title));
            break;
        case 'title_desc':
            filtered.sort((a, b) => b.Title.localeCompare(a.Title));
            break;
        case 'popular':
            filtered.sort((a, b) => (b.Views || 0) - (a.Views || 0));
            break;
    }
    
    filteredNewsData = filtered;
    currentPage = 1;
    displayNews();
}

// Filter news (alias for search)
function filterNews() {
    searchNews();
}

// Apply bulk action
async function applyBulkAction(action) {
    const selectedCheckboxes = document.querySelectorAll('.news-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showToast('Tidak ada berita yang dipilih', 'warning');
        return;
    }
    
    try {
        let successCount = 0;
        
        for (const id of selectedIds) {
            let result;
            
            if (action === 'publish') {
                result = await fetchData('updateNews', { ID: id, Status: 'Published' });
            } else if (action === 'draft') {
                result = await fetchData('updateNews', { ID: id, Status: 'Draft' });
            } else if (action === 'archive') {
                result = await fetchData('updateNews', { ID: id, Status: 'Archived' });
            } else if (action === 'feature') {
                result = await fetchData('updateNews', { ID: id, Featured: 1 });
            } else if (action === 'unfeature') {
                result = await fetchData('updateNews', { ID: id, Featured: 0 });
            }
            
            if (result && result.success) {
                successCount++;
            }
        }
        
        if (successCount > 0) {
            await loadNews();
            showToast(`${successCount} berita berhasil di${getActionText(action)}`, 'success');
            
            // Reset bulk action
            document.getElementById('bulkAction').value = '';
            
            // Log activity
            logActivity('BULK_ACTION', 
                       `Applied ${action} to ${successCount} news items`, 
                       selectedIds.join(','));
        }
    } catch (error) {
        console.error('Error applying bulk action:', error);
        showToast('Gagal menerapkan aksi', 'danger');
    }
}

// Confirm bulk delete
function confirmBulkDelete() {
    const selectedCount = document.querySelectorAll('.news-checkbox:checked').length;
    
    if (selectedCount === 0) {
        showToast('Tidak ada berita yang dipilih', 'warning');
        document.getElementById('bulkAction').value = '';
        return;
    }
    
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedCount} berita yang dipilih?`)) {
        applyBulkDelete();
    } else {
        document.getElementById('bulkAction').value = '';
    }
}

// Apply bulk delete
async function applyBulkDelete() {
    const selectedCheckboxes = document.querySelectorAll('.news-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    try {
        let successCount = 0;
        
        for (const id of selectedIds) {
            const result = await fetchData('deleteNews', { id: id });
            if (result && result.success) {
                successCount++;
            }
        }
        
        if (successCount > 0) {
            await loadNews();
            showToast(`${successCount} berita berhasil dihapus`, 'success');
            
            // Reset bulk action
            document.getElementById('bulkAction').value = '';
            
            // Log activity
            logActivity('BULK_DELETE', 
                       `Deleted ${successCount} news items`, 
                       selectedIds.join(','));
        }
    } catch (error) {
        console.error('Error applying bulk delete:', error);
        showToast('Gagal menghapus berita', 'danger');
    }
}

// Get action text for toast
function getActionText(action) {
    const actions = {
        'publish': 'terbitkan',
        'draft': 'ubah ke draf',
        'archive': 'arsipkan',
        'feature': 'jadikan unggulan',
        'unfeature': 'hapus dari unggulan',
        'delete': 'hapus'
    };
    return actions[action] || action;
}

// Update news statistics
function updateNewsStats() {
    const totalNews = newsData.length;
    const publishedNews = newsData.filter(n => n.Status === 'Published').length;
    const draftNews = newsData.filter(n => n.Status === 'Draft').length;
    const featuredNews = newsData.filter(n => n.Featured).length;
    const totalViews = newsData.reduce((sum, news) => sum + (news.Views || 0), 0);
    
    // Update stats in UI
    const statsContainer = document.getElementById('newsStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="row g-3">
                <div class="col-6 col-md-3">
                    <div class="stat-card text-center p-3 rounded bg-white shadow-sm">
                        <div class="stat-icon text-primary mb-2">
                            <i class="bi bi-newspaper fs-1"></i>
                        </div>
                        <div class="stat-value fw-bold fs-3">${totalNews}</div>
                        <div class="stat-label text-muted">Total Berita</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card text-center p-3 rounded bg-white shadow-sm">
                        <div class="stat-icon text-success mb-2">
                            <i class="bi bi-cloud-arrow-up fs-1"></i>
                        </div>
                        <div class="stat-value fw-bold fs-3">${publishedNews}</div>
                        <div class="stat-label text-muted">Terbit</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card text-center p-3 rounded bg-white shadow-sm">
                        <div class="stat-icon text-warning mb-2">
                            <i class="bi bi-pencil fs-1"></i>
                        </div>
                        <div class="stat-value fw-bold fs-3">${draftNews}</div>
                        <div class="stat-label text-muted">Draf</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card text-center p-3 rounded bg-white shadow-sm">
                        <div class="stat-icon text-info mb-2">
                            <i class="bi bi-star fs-1"></i>
                        </div>
                        <div class="stat-value fw-bold fs-3">${featuredNews}</div>
                        <div class="stat-label text-muted">Unggulan</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Export news data
async function exportNews() {
    try {
        const format = prompt('Pilih format export (csv/json):', 'csv').toLowerCase();
        
        if (format !== 'csv' && format !== 'json') {
            showToast('Format tidak valid', 'warning');
            return;
        }
        
        const dataToExport = filteredNewsData.length > 0 ? filteredNewsData : newsData;
        
        if (format === 'csv') {
            exportToCSV(dataToExport);
        } else if (format === 'json') {
            exportToJSON(dataToExport);
        }
        
    } catch (error) {
        console.error('Error exporting news:', error);
        showToast('Gagal mengexport data', 'danger');
    }
}

// Export to CSV
function exportToCSV(data) {
    const headers = ['ID', 'Title', 'Excerpt', 'Category', 'Author', 'Status', 'Date', 'Featured', 'Views'];
    const rows = data.map(item => [
        item.ID,
        `"${(item.Title || '').replace(/"/g, '""')}"`,
        `"${(item.Excerpt || '').replace(/"/g, '""')}"`,
        item.Category,
        item.Author,
        item.Status,
        item.Date,
        item.Featured ? 'Yes' : 'No',
        item.Views || 0
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `eggtrack-news-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data berhasil diexport ke CSV', 'success');
}

// Export to JSON
function exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `eggtrack-news-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data berhasil diexport ke JSON', 'success');
}

// Log activity
function logActivity(action, description, referenceId) {
    const activity = {
        timestamp: new Date().toISOString(),
        action: action,
        description: description,
        referenceId: referenceId,
        user: localStorage.getItem('eggTrackUser') ? 
              JSON.parse(localStorage.getItem('eggTrackUser')).name : 'Unknown'
    };
    
    // Save to localStorage for offline viewing
    let activities = JSON.parse(localStorage.getItem('newsActivities') || '[]');
    activities.unshift(activity);
    if (activities.length > 50) activities = activities.slice(0, 50);
    localStorage.setItem('newsActivities', JSON.stringify(activities));
    
    console.log('Activity logged:', activity);
}

// Handler untuk logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        // Save any unsaved draft
        const title = document.getElementById('newsTitle')?.value.trim();
        const content = document.getElementById('newsContent')?.value.trim();
        
        if (title || content) {
            saveDraft();
        }
        
        // Clear user data
        localStorage.removeItem('eggTrackUser');
        
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
            redirect: 'follow',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle Apps Script redirects
        if (data.redirect) {
            const redirectedResponse = await fetch(data.redirect);
            return await redirectedResponse.json();
        }
        
        return data;
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
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

// Format time
function formatTime(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
}

// Show loading state
function showLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (isLoading) {
        element.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="d-flex flex-column align-items-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="text-muted">Memuat data berita...</p>
                        <small class="text-muted">Harap tunggu sebentar</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-container');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.id = toastId;
    
    // Toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${getToastIcon(type)} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, { 
        delay: 3000,
        autohide: true
    });
    
    bsToast.show();
    
    // Remove toast from DOM after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.remove();
    });
}

// Get icon for toast type
function getToastIcon(type) {
    const icons = {
        'success': 'bi-check-circle',
        'danger': 'bi-exclamation-triangle',
        'warning': 'bi-exclamation-circle',
        'info': 'bi-info-circle'
    };
    return icons[type] || 'bi-info-circle';
}

// Auto-refresh every 5 minutes
setInterval(() => {
    if (isOnline && document.visibilityState === 'visible') {
        loadNews();
    }
}, 300000);

// Check for drafts on page load
window.addEventListener('load', loadDraft);

// Add spinner animation for refresh button
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);