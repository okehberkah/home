// public-news.js - VERSI FINAL (SISTEM BERITA PUBLIK EGGTRACK)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Configuration
let allNewsData = [];
let filteredNewsData = [];
let currentPage = 1;
const itemsPerPage = 9;
let isInitialized = false;

// DEMO DATA - Backup jika koneksi gagal
const DEMO_NEWS_DATA = [
    {
        ID: 1,
        title: 'Inovasi Pengolahan Telur Bebek dengan Teknologi Modern',
        excerpt: 'Peternakan telur bebek di Indonesia mulai mengadopsi teknologi canggih untuk meningkatkan kualitas dan produktivitas...',
        content: '<p>Industri peternakan telur bebek di Indonesia sedang mengalami transformasi digital yang signifikan. Peternak mulai mengadopsi teknologi canggih untuk meningkatkan kualitas dan produktivitas produksi telur bebek.</p><p>Berdasarkan data dari Kementerian Pertanian, implementasi sistem manajemen digital seperti EggTrack telah membantu peternak meningkatkan efisiensi operasional hingga 40%.</p><h3>Manfaat Teknologi Digital</h3><p>Dengan sistem terintegrasi, peternak dapat:</p><ul><li>Memantau produksi secara real-time</li><li>Mengelola inventaris dengan efisien</li><li>Menganalisis data untuk pengambilan keputusan</li><li>Meningkatkan akurasi pencatatan</li></ul>',
        imageURL: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Terbaru',
        author: 'Admin EggTrack',
        status: 'Published',
        date: '2024-03-15',
        createdAt: '2024-03-15T10:00:00Z',
        featured: true,
        views: 1250
    },
    {
        ID: 2,
        title: 'Peluang Pasar Ekspor Telur Bebek Meningkat 25% di Kuartal Pertama 2024',
        excerpt: 'Permintaan telur bebek dari pasar internasional menunjukkan peningkatan signifikan, membuka peluang baru bagi peternak lokal...',
        content: '<p>Permintaan telur bebek dari pasar internasional menunjukkan peningkatan signifikan di awal tahun 2024. Berdasarkan data dari Badan Pusat Statistik, ekspor telur bebek Indonesia naik 25% dibandingkan periode yang sama tahun lalu.</p><p>Negara tujuan utama ekspor meliputi:</p><ul><li>Singapura</li><li>Malaysia</li><li>Jepang</li><li>Korea Selatan</li></ul>',
        imageURL: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Trending',
        author: 'Tim Riset EggTrack',
        status: 'Published',
        date: '2024-03-10',
        createdAt: '2024-03-10T14:30:00Z',
        featured: false,
        views: 890
    },
    {
        ID: 3,
        title: 'Tips Manajemen Peternakan yang Efisien dengan Sistem Digital',
        excerpt: 'Penerapan sistem manajemen digital terbukti meningkatkan efisiensi operasional peternakan hingga 40% berdasarkan studi terkini...',
        content: '<p>Penerapan sistem manajemen digital terbukti meningkatkan efisiensi operasional peternakan hingga 40% berdasarkan studi terkini. Dengan sistem yang tepat, peternak dapat mengoptimalkan seluruh aspek operasional.</p><h3>Tips Efisiensi:</h3><ol><li>Gunakan software manajemen terintegrasi</li><li>Lakukan pencatatan real-time</li><li>Analisis data secara berkala</li><li>Optimalkan penggunaan pakan</li><li>Kelola inventaris dengan sistem otomatis</li></ol>',
        imageURL: 'https://images.unsplash.com/photo-1505253668822-42074d58a7c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Tips',
        author: 'Admin EggTrack',
        status: 'Published',
        date: '2024-03-05',
        createdAt: '2024-03-05T09:15:00Z',
        featured: true,
        views: 750
    },
    {
        ID: 4,
        title: 'Studi Terbaru: Telur Bebek Lebih Kaya Omega-3 dibanding Telur Ayam',
        excerpt: 'Penelitian terbaru menunjukkan kandungan nutrisi telur bebek lebih unggul dalam hal asam lemak omega-3 dan vitamin...',
        content: '<p>Penelitian terbaru menunjukkan kandungan nutrisi telur bebek lebih unggul dalam hal asam lemak omega-3 dan vitamin. Studi ini memberikan insight baru tentang manfaat kesehatan dari telur bebek.</p><p>Menurut penelitian yang dilakukan oleh Institut Pertanian Bogor, telur bebek mengandung:</p><ul><li>Omega-3: 25% lebih tinggi</li><li>Vitamin B12: 30% lebih tinggi</li><li>Protein: 15% lebih tinggi</li><li>Mineral: Lebih lengkap</li></ul>',
        imageURL: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Kesehatan',
        author: 'Dr. Agus Santoso',
        status: 'Published',
        date: '2024-02-28',
        createdAt: '2024-02-28T11:45:00Z',
        featured: false,
        views: 620
    },
    {
        ID: 5,
        title: 'Panduan Sertifikasi Halal untuk Produk Telur Bebek',
        excerpt: 'Kementerian Agama mengeluarkan panduan baru untuk sertifikasi halal produk telur bebek...',
        content: '<p>Kementerian Agama mengeluarkan panduan baru untuk sertifikasi halal produk telur bebek. Panduan ini diharapkan dapat memudahkan peternak dalam mengurus sertifikasi.</p><h3>Tahapan Sertifikasi:</h3><ol><li>Pendaftaran online</li><li>Audit dokumen</li><li>Inspeksi lapangan</li><li>Evaluasi hasil</li><li>Penerbitan sertifikat</li></ol>',
        imageURL: 'https://images.unsplash.com/photo-1556909115-6ce2b04c994b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Sertifikasi',
        author: 'Badan Sertifikasi Halal',
        status: 'Published',
        date: '2024-02-20',
        createdAt: '2024-02-20T13:20:00Z',
        featured: false,
        views: 450
    },
    {
        ID: 6,
        title: 'Edukasi Pakan Ternak yang Tepat untuk Telur Bebek Berkualitas',
        excerpt: 'Pemilihan pakan ternak yang tepat sangat mempengaruhi kualitas telur bebek...',
        content: '<p>Pemilihan pakan ternak yang tepat sangat mempengaruhi kualitas telur bebek. Penelitian menunjukkan bahwa pakan yang kaya nutrisi dapat meningkatkan kualitas telur hingga 30%.</p><p>Komposisi pakan ideal untuk bebek petelur:</p><ul><li>Protein: 16-18%</li><li>Energi: 2800-3000 kkal/kg</li><li>Kalsium: 3.5-4.0%</li><li>Fosfor: 0.45-0.50%</li></ul>',
        imageURL: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Edukasi',
        author: 'Dosen Fakultas Peternakan',
        status: 'Published',
        date: '2024-02-15',
        createdAt: '2024-02-15T10:10:00Z',
        featured: false,
        views: 520
    },
    {
        ID: 7,
        title: 'Teknologi Inkubator Modern Meningkatkan Daya Tetas Telur Bebek',
        excerpt: 'Penggunaan inkubator dengan teknologi terkini mampu meningkatkan daya tetas telur bebek hingga 85%...',
        content: '<p>Penggunaan inkubator dengan teknologi terkini mampu meningkatkan daya tetas telur bebek hingga 85%. Teknologi ini dilengkapi dengan sistem kontrol otomatis yang menjaga suhu dan kelembaban optimal.</p><h3>Keunggulan Inkubator Modern:</h3><ul><li>Kontrol suhu otomatis</li><li>Monitoring kelembaban real-time</li><li>Sistem pemutaran telur otomatis</li><li>Alarm notifikasi</li><li>Efisiensi energi tinggi</li></ul>',
        imageURL: 'https://images.unsplash.com/photo-1542736667-069246bdbc6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Teknologi',
        author: 'Engineer PT. Tekno Peternakan',
        status: 'Published',
        date: '2024-02-10',
        createdAt: '2024-02-10T15:45:00Z',
        featured: false,
        views: 380
    },
    {
        ID: 8,
        title: 'Strategi Pemasaran Digital untuk Peternak Telur Bebek',
        excerpt: 'Pemasaran digital menjadi kunci sukses dalam menjual produk telur bebek di era digital...',
        content: '<p>Pemasaran digital menjadi kunci sukses dalam menjual produk telur bebek di era digital. Dengan strategi yang tepat, peternak dapat menjangkau pasar yang lebih luas.</p><h3>Platform Pemasaran Digital:</h3><ol><li>Marketplace (Tokopedia, Shopee)</li><li>Media Sosial (Instagram, Facebook)</li><li>Website e-commerce</li><li>Aplikasi mobile</li><li>Email marketing</li></ol>',
        imageURL: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Pemasaran',
        author: 'Digital Marketing Specialist',
        status: 'Published',
        date: '2024-02-05',
        createdAt: '2024-02-05T11:30:00Z',
        featured: false,
        views: 410
    },
    {
        ID: 9,
        title: 'Peran Pemerintah dalam Pengembangan Peternakan Telur Bebek',
        excerpt: 'Pemerintah mengeluarkan berbagai kebijakan untuk mendukung pengembangan peternakan telur bebek...',
        content: '<p>Pemerintah mengeluarkan berbagai kebijakan untuk mendukung pengembangan peternakan telur bebek. Dukungan ini mencakup bantuan modal, pelatihan, dan akses pasar.</p><p>Program pemerintah untuk peternak telur bebek:</p><ul><li>Kredit usaha rakyat (KUR)</li><li>Program sertifikasi</li><li>Pelatihan teknis</li><li>Bantuan peralatan</li><li>Promosi produk</li></ul>',
        imageURL: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        category: 'Kebijakan',
        author: 'Kementerian Pertanian',
        status: 'Published',
        date: '2024-01-30',
        createdAt: '2024-01-30T09:00:00Z',
        featured: true,
        views: 290
    }
];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on news-related page
    if (document.getElementById('newsListContainer') || 
        document.getElementById('latestNewsContainer') || 
        window.location.pathname.includes('news-detail.html')) {
        
        initializePublicNews();
    }
});

// Main initialization function
async function initializePublicNews() {
    if (isInitialized) return;
    
    try {
        setupEventListeners();
        
        // Check connection
        const isOnline = await checkConnection();
        
        if (isOnline) {
            await loadPublicNews();
        } else {
            useDemoNewsData();
            showToast('Mode offline: Menampilkan data demo', 'warning');
        }
        
        // Load latest news for homepage
        if (document.getElementById('latestNewsContainer')) {
            await loadLatestNews(3);
        }
        
        // Check if we're on news detail page
        if (window.location.pathname.includes('news-detail.html')) {
            await loadNewsDetail();
        }
        
        isInitialized = true;
    } catch (error) {
        console.error('Error initializing public news:', error);
        useDemoNewsData();
        showToast('Gagal memuat berita, menggunakan data demo', 'warning');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter button
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', filterNews);
    }
    
    // Filter on category change
    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.addEventListener('change', filterNews);
    }
    
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchNews');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
}

// Check connection to server
async function checkConnection() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=ping`, {
            method: 'GET',
            mode: 'no-cors'
        });
        return true;
    } catch (error) {
        console.log('Offline mode:', error);
        return false;
    }
}

// Load public news from server or demo data
async function loadPublicNews() {
    try {
        showLoadingState(true);
        
        // Try to load from server
        const result = await fetchData('getNews');
        
        if (result && result.success && result.data && result.data.length > 0) {
            // Process server data
            allNewsData = normalizeNewsData(result.data);
        } else {
            // Fallback to demo data
            useDemoNewsData();
            return;
        }
        
        // Filter only published news
        allNewsData = allNewsData.filter(news => 
            news.status === 'Published' || news.Status === 'Published'
        );
        
        // Sort by date (newest first)
        allNewsData.sort((a, b) => {
            const dateA = getDateFromNews(a);
            const dateB = getDateFromNews(b);
            return dateB - dateA;
        });
        
        filteredNewsData = [...allNewsData];
        
        displayNewsList();
        displayFeaturedNews();
        updatePagination();
        
        showLoadingState(false);
        showToast(`Berhasil memuat ${allNewsData.length} berita`, 'success');
        
    } catch (error) {
        console.error('Error loading public news:', error);
        showLoadingState(false);
        useDemoNewsData();
        showToast('Gagal memuat berita dari server', 'warning');
    }
}

// Normalize news data from various formats
function normalizeNewsData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => {
        // Handle various field name formats
        return {
            id: item.ID || item.id || generateId(),
            title: item.Title || item.title || item.Headline || 'Tanpa Judul',
            excerpt: item.Excerpt || item.excerpt || item.Summary || item.description || '',
            content: item.Content || item.content || item.Body || item.body || '',
            imageURL: item.ImageURL || item.imageURL || item.Image || item.image || 
                     'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
            category: item.Category || item.category || item.Type || 'Umum',
            author: item.Author || item.author || item.Creator || 'Admin EggTrack',
            status: item.Status || item.status || 'Published',
            date: item.Date || item.date || item.PublishDate || new Date().toISOString().split('T')[0],
            createdAt: item.CreatedAt || item.createdAt || item.Timestamp || new Date().toISOString(),
            featured: Boolean(item.Featured || item.featured || item.Highlight || false),
            views: parseInt(item.Views || item.views || item.ViewCount || 0)
        };
    });
}

// Generate ID for demo data
function generateId() {
    return Math.floor(Math.random() * 1000000);
}

// Get date from news object (handle different date field names)
function getDateFromNews(news) {
    if (news.date) return new Date(news.date);
    if (news.Date) return new Date(news.Date);
    if (news.createdAt) return new Date(news.createdAt);
    if (news.CreatedAt) return new Date(news.CreatedAt);
    return new Date();
}

// Use demo data for testing
function useDemoNewsData() {
    allNewsData = [...DEMO_NEWS_DATA];
    
    // Filter only published news
    allNewsData = allNewsData.filter(news => 
        news.status === 'Published' || news.Status === 'Published'
    );
    
    // Sort by date (newest first)
    allNewsData.sort((a, b) => {
        const dateA = getDateFromNews(a);
        const dateB = getDateFromNews(b);
        return dateB - dateA;
    });
    
    filteredNewsData = [...allNewsData];
    
    if (document.getElementById('newsListContainer')) {
        displayNewsList();
        displayFeaturedNews();
        updatePagination();
    }
    
    if (document.getElementById('latestNewsContainer')) {
        loadLatestNews(3);
    }
}

// Display news list
function displayNewsList() {
    const container = document.getElementById('newsListContainer');
    if (!container) return;
    
    if (filteredNewsData.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-newspaper display-4 text-muted mb-3"></i>
                        <h5 class="text-muted">Tidak ada berita ditemukan</h5>
                        <p class="text-muted">Silakan coba dengan filter yang berbeda atau coba lagi nanti.</p>
                        <button class="btn btn-primary mt-2" onclick="window.location.reload()">
                            <i class="bi bi-arrow-clockwise me-2"></i>Refresh Halaman
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        hidePagination();
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredNewsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredNewsData.slice(startIndex, endIndex);
    
    // Generate news cards
    let html = '';
    
    pageData.forEach(news => {
        const newsId = news.id || news.ID;
        const title = news.title || news.Title || 'Tanpa Judul';
        const excerpt = news.excerpt || news.Excerpt || '';
        const imageUrl = news.imageURL || news.ImageURL || 'https://via.placeholder.com/400x200?text=No+Image';
        const category = news.category || news.Category || 'Umum';
        const date = formatDate(news.date || news.Date || news.createdAt);
        const views = news.views || news.Views || 0;
        const featured = news.featured || news.Featured;
        
        const newsClass = featured ? 'featured-news' : '';
        const featuredBadge = featured ? 
            '<div class="featured-badge"><i class="bi bi-star-fill me-1"></i>Unggulan</div>' : '';
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="news-card ${newsClass}">
                    ${featuredBadge}
                    <img src="${imageUrl}" 
                         alt="${title}" 
                         class="news-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x200?text=Gambar+Tidak+Tersedia'">
                    <div class="news-content">
                        <div class="news-category">${category}</div>
                        <h5 class="news-title">${title}</h5>
                        <div class="news-meta">
                            <i class="bi bi-calendar me-1"></i> ${date}
                            <i class="bi bi-eye ms-3 me-1"></i> ${views}
                        </div>
                        <p class="news-excerpt">${excerpt.substring(0, 100)}${excerpt.length > 100 ? '...' : ''}</p>
                        <a href="news-detail.html?id=${newsId}" class="btn btn-outline-primary btn-sm">
                            Baca Selengkapnya <i class="bi bi-arrow-right ms-1"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Show/hide pagination
    const pagination = document.getElementById('newsPagination');
    if (pagination) {
        pagination.style.display = totalPages > 1 ? 'block' : 'none';
        if (totalPages > 1) {
            renderPagination(totalPages);
        }
    }
}

// Display featured news in sidebar
function displayFeaturedNews() {
    const container = document.getElementById('featuredNewsSidebar');
    if (!container) return;
    
    const featuredNews = allNewsData.filter(news => 
        (news.featured || news.Featured) && 
        (news.status === 'Published' || news.Status === 'Published')
    ).slice(0, 3);
    
    if (featuredNews.length === 0) {
        container.innerHTML = '<p class="text-muted">Belum ada berita unggulan</p>';
        return;
    }
    
    let html = '';
    
    featuredNews.forEach(news => {
        const newsId = news.id || news.ID;
        const title = news.title || news.Title || 'Tanpa Judul';
        const date = formatDate(news.date || news.Date || news.createdAt);
        
        html += `
            <div class="sidebar-news-item">
                <h6 class="mb-2">
                    <a href="news-detail.html?id=${newsId}" class="text-decoration-none text-dark">
                        <i class="bi bi-star-fill text-warning me-1 small"></i>
                        ${title}
                    </a>
                </h6>
                <div class="small text-muted">
                    <i class="bi bi-calendar me-1"></i> ${date}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filter news by category
function filterNews() {
    const categorySelect = document.getElementById('filterCategory');
    if (!categorySelect) return;
    
    const category = categorySelect.value;
    
    if (category) {
        filteredNewsData = allNewsData.filter(news => 
            (news.category === category || news.Category === category) &&
            (news.status === 'Published' || news.Status === 'Published')
        );
    } else {
        filteredNewsData = allNewsData.filter(news => 
            news.status === 'Published' || news.Status === 'Published'
        );
    }
    
    currentPage = 1;
    displayNewsList();
    updatePagination();
}

// Search news
function performSearch() {
    const searchInput = document.getElementById('searchNews');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm) {
        filteredNewsData = allNewsData.filter(news => {
            const title = (news.title || news.Title || '').toLowerCase();
            const excerpt = (news.excerpt || news.Excerpt || '').toLowerCase();
            const content = (news.content || news.Content || '').toLowerCase();
            const author = (news.author || news.Author || '').toLowerCase();
            const category = (news.category || news.Category || '').toLowerCase();
            
            return title.includes(searchTerm) || 
                   excerpt.includes(searchTerm) || 
                   content.includes(searchTerm) || 
                   author.includes(searchTerm) ||
                   category.includes(searchTerm);
        });
    } else {
        filteredNewsData = [...allNewsData];
    }
    
    currentPage = 1;
    displayNewsList();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredNewsData.length / itemsPerPage);
    renderPagination(totalPages);
}

// Render pagination controls
function renderPagination(totalPages) {
    const pagination = document.getElementById('newsPagination');
    if (!pagination) return;
    
    const ul = pagination.querySelector('ul');
    if (!ul) return;
    
    if (totalPages <= 1) {
        ul.innerHTML = '';
        return;
    }
    
    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Show page numbers (max 5 pages)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="1">1</a>
            </li>
        `;
        if (startPage > 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        html += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
            </li>
        `;
    }
    
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    ul.innerHTML = html;
    
    // Add event listeners
    ul.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                currentPage = page;
                displayNewsList();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

// Hide pagination
function hidePagination() {
    const pagination = document.getElementById('newsPagination');
    if (pagination) {
        pagination.style.display = 'none';
    }
}

// Load news detail
async function loadNewsDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) {
        showErrorAndRedirect('Berita tidak ditemukan');
        return;
    }
    
    try {
        // Try to load from server first
        const result = await fetchData('getNews');
        let news = null;
        
        if (result && result.success && result.data) {
            const normalizedData = normalizeNewsData(result.data);
            news = normalizedData.find(n => 
                (n.id == newsId || n.ID == newsId) && 
                (n.status === 'Published' || n.Status === 'Published')
            );
        }
        
        // If not found in server data, check demo data
        if (!news) {
            news = DEMO_NEWS_DATA.find(n => n.ID == newsId);
        }
        
        if (!news) {
            throw new Error('Berita tidak ditemukan');
        }
        
        displayNewsDetail(news);
        
        // Increment view count
        await incrementViewCount(newsId);
        
    } catch (error) {
        console.error('Error loading news detail:', error);
        
        // Try to find in demo data
        const demoNews = DEMO_NEWS_DATA.find(n => n.ID == newsId);
        if (demoNews) {
            displayNewsDetail(demoNews);
        } else {
            showErrorAndRedirect('Gagal memuat berita');
        }
    }
}

// Display news detail
function displayNewsDetail(news) {
    // Update page title
    document.title = `${news.title || news.Title} - EggTrack`;
    
    // Update meta tags for social sharing
    updateMetaTags(news);
    
    // Display news content
    const titleElement = document.getElementById('newsDetailTitle');
    const metaElement = document.getElementById('newsDetailMeta');
    const imageElement = document.getElementById('newsDetailImage');
    const contentElement = document.getElementById('newsDetailContent');
    
    if (titleElement) {
        titleElement.textContent = news.title || news.Title || 'Tanpa Judul';
    }
    
    if (metaElement) {
        const category = news.category || news.Category || 'Umum';
        const date = formatDate(news.date || news.Date || news.createdAt);
        const author = news.author || news.Author || 'Admin EggTrack';
        const views = (news.views || news.Views || 0) + 1;
        
        metaElement.innerHTML = `
            <span class="badge bg-primary me-2">${category}</span>
            <i class="bi bi-calendar me-1"></i> ${date}
            <i class="bi bi-person ms-3 me-1"></i> ${author}
            <i class="bi bi-eye ms-3 me-1"></i> ${views}
        `;
    }
    
    if (imageElement) {
        const imageUrl = news.imageURL || news.ImageURL || 
                        'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80';
        imageElement.src = imageUrl;
        imageElement.alt = news.title || news.Title || 'Gambar Berita';
        imageElement.onerror = function() {
            this.src = 'https://via.placeholder.com/1200x400?text=Gambar+Tidak+Tersedia';
        };
    }
    
    if (contentElement) {
        const content = news.content || news.Content || '<p>Konten berita tidak tersedia.</p>';
        contentElement.innerHTML = content;
    }
}

// Update meta tags for SEO and social sharing
function updateMetaTags(news) {
    const title = news.title || news.Title || 'Berita EggTrack';
    const excerpt = news.excerpt || news.Excerpt || 'Sistem manajemen terintegrasi untuk peternakan telur bebek';
    const imageUrl = news.imageURL || news.ImageURL || 
                    'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80';
    const url = window.location.href;
    
    // Update or create meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', excerpt);
    updateMetaTag('og:image', imageUrl);
    updateMetaTag('og:url', url);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', excerpt);
    updateMetaTag('twitter:image', imageUrl);
    
    // Update description meta tag
    updateMetaTag('description', excerpt, 'name');
}

// Update meta tag helper
function updateMetaTag(property, content, attribute = 'property') {
    let metaTag = document.querySelector(`meta[${attribute}="${property}"]`);
    if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, property);
        document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
}

// Increment view count (simulated)
async function incrementViewCount(newsId) {
    try {
        // In a real application, you would send a request to increment view count
        // For demo purposes, we'll just update localStorage
        let viewCounts = JSON.parse(localStorage.getItem('eggTrackNewsViews') || '{}');
        viewCounts[newsId] = (viewCounts[newsId] || 0) + 1;
        localStorage.setItem('eggTrackNewsViews', JSON.stringify(viewCounts));
        
        // Update the view count display
        const viewsElement = document.querySelector('#newsDetailMeta .bi-eye').parentElement;
        if (viewsElement) {
            const currentViews = parseInt(viewsElement.textContent.trim()) || 0;
            viewsElement.innerHTML = `<i class="bi bi-eye me-1"></i> ${currentViews + 1}`;
        }
        
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}

// Load latest news for homepage
async function loadLatestNews(limit = 3) {
    const container = document.getElementById('latestNewsContainer');
    if (!container) return;
    
    try {
        // Use existing data or load fresh
        if (allNewsData.length === 0) {
            await loadPublicNews();
        }
        
        // Get latest published news
        const latestNews = allNewsData
            .filter(news => news.status === 'Published' || news.Status === 'Published')
            .slice(0, limit);
        
        displayLatestNews(latestNews, container);
        
    } catch (error) {
        console.error('Error loading latest news:', error);
        // Use demo data
        const demoNews = DEMO_NEWS_DATA.slice(0, limit);
        displayLatestNews(demoNews, container);
    }
}

// Display latest news on homepage
function displayLatestNews(newsArray, container) {
    if (!container) return;
    
    if (newsArray.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <i class="bi bi-newspaper display-4 text-muted mb-3"></i>
                <h5 class="text-muted">Belum ada berita</h5>
                <p class="text-muted">Berita terbaru akan segera tersedia.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    newsArray.forEach(news => {
        const newsId = news.id || news.ID;
        const title = news.title || news.Title || 'Tanpa Judul';
        const excerpt = news.excerpt || news.Excerpt || '';
        const imageUrl = news.imageURL || news.ImageURL || 
                        'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
        const category = news.category || news.Category || 'Umum';
        const date = formatDate(news.date || news.Date || news.createdAt);
        
        html += `
            <div class="col-md-4 mb-4">
                <div class="card h-100 border-0 shadow-sm hover-lift">
                    <img src="${imageUrl}" 
                         alt="${title}" 
                         class="card-img-top"
                         style="height: 200px; object-fit: cover;"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x250?text=Gambar+Berita'">
                    <div class="card-body">
                        <span class="badge bg-primary mb-2">${category}</span>
                        <h5 class="card-title">${title}</h5>
                        <p class="card-text text-muted">${excerpt.substring(0, 100)}${excerpt.length > 100 ? '...' : ''}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-calendar me-1"></i> ${date}
                            </small>
                            <a href="news-detail.html?id=${newsId}" class="btn btn-sm btn-outline-primary">
                                Baca <i class="bi bi-arrow-right ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add hover effect CSS if not already added
    if (!document.querySelector('style[data-hover-effect]')) {
        const style = document.createElement('style');
        style.setAttribute('data-hover-effect', 'true');
        style.textContent = `
            .hover-lift {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .hover-lift:hover {
                transform: translateY(-8px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Show loading state
function showLoadingState(show) {
    const container = document.getElementById('newsListContainer');
    if (!container) return;
    
    if (show) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Memuat berita...</p>
                <div class="progress mt-3" style="height: 5px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
                </div>
            </div>
        `;
        hidePagination();
    }
}

// Fetch data from Google Apps Script
async function fetchData(action, params = {}) {
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

// Format date to Indonesian format
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const options = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        
        return date.toLocaleDateString('id-ID', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
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

// Show error and redirect
function showErrorAndRedirect(message) {
    showToast(message, 'danger');
    setTimeout(() => {
        window.location.href = 'news.html';
    }, 2000);
}

// Add share functions to global scope
window.shareOnFacebook = function() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`, '_blank', 'width=600,height=400');
};

window.shareOnTwitter = function() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
};

window.shareOnWhatsApp = function() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.title);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank', 'width=600,height=400');
};

// Initialize when window loads
window.addEventListener('load', function() {
    // Small delay to ensure all elements are loaded
    setTimeout(() => {
        if (!isInitialized && 
            (document.getElementById('newsListContainer') || 
             document.getElementById('latestNewsContainer') || 
             window.location.pathname.includes('news-detail.html'))) {
            initializePublicNews();
        }
    }, 100);
});