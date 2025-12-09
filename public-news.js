// public-news.js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Configuration
let allNewsData = [];
let filteredNewsData = [];
let currentPage = 1;
const itemsPerPage = 9;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializePublicNews();
});

// Main initialization function
async function initializePublicNews() {
    try {
        setupEventListeners();
        await loadPublicNews();
    } catch (error) {
        console.error('Error initializing public news:', error);
        showToast('Gagal memuat berita', 'danger');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter button
    document.getElementById('applyFilter')?.addEventListener('click', filterNews);
    
    // Filter on category change
    document.getElementById('filterCategory')?.addEventListener('change', filterNews);
    
    // Check if we're on news detail page
    if (window.location.pathname.includes('news-detail.html')) {
        loadNewsDetail();
    }
}

// Load public news
async function loadPublicNews() {
    try {
        const result = await fetchData('getNews');
        
        if (result && result.success) {
            allNewsData = result.news || [];
            
            // Filter only published news
            allNewsData = allNewsData.filter(news => news.Status === 'Published');
            
            // Sort by date (newest first)
            allNewsData.sort((a, b) => new Date(b.Date || b.CreatedAt) - new Date(a.Date || a.CreatedAt));
            
            filteredNewsData = [...allNewsData];
            
            displayNewsList();
            displayFeaturedNews();
            updatePagination();
        } else {
            throw new Error(result?.message || 'Gagal memuat data berita');
        }
    } catch (error) {
        console.error('Error loading public news:', error);
        
        // Use demo data if online mode fails
        if (!navigator.onLine) {
            useDemoNewsData();
            showToast('Menggunakan data demo (mode offline)', 'warning');
        } else {
            showToast('Gagal memuat berita. Silakan coba lagi.', 'danger');
        }
    }
}

// Use demo data for testing
function useDemoNewsData() {
    allNewsData = [
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
            Status: 'Published',
            Date: '2024-02-28',
            CreatedAt: new Date().toISOString(),
            Featured: false,
            Views: 620
        }
    ];
    
    filteredNewsData = [...allNewsData];
    displayNewsList();
    displayFeaturedNews();
    updatePagination();
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
                        <h5 class="text-muted">Belum ada berita</h5>
                        <p class="text-muted">Belum ada berita yang tersedia untuk saat ini.</p>
                    </div>
                </div>
            </div>
        `;
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
        const newsClass = news.Featured ? 'featured-news' : '';
        const featuredBadge = news.Featured ? '<div class="featured-badge"><i class="bi bi-star-fill me-1"></i>Unggulan</div>' : '';
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="news-card ${newsClass}">
                    ${featuredBadge}
                    <img src="${news.ImageURL || 'https://via.placeholder.com/400x200?text=No+Image'}" 
                         alt="${news.Title}" 
                         class="news-image"
                         onerror="this.src='https://via.placeholder.com/400x200?text=Image+Error'">
                    <div class="news-content">
                        <div class="news-category">${news.Category || 'Umum'}</div>
                        <h5 class="news-title">${news.Title}</h5>
                        <div class="news-meta">
                            <i class="bi bi-calendar me-1"></i> ${formatDate(news.Date)}
                            <i class="bi bi-eye ms-3 me-1"></i> ${news.Views || 0}
                        </div>
                        <p class="news-excerpt">${(news.Excerpt || '').substring(0, 100)}...</p>
                        <a href="news-detail.html?id=${news.ID}" class="btn btn-outline-primary btn-sm">
                            Baca Selengkapnya <i class="bi bi-arrow-right ms-1"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Show pagination if needed
    if (totalPages > 1) {
        document.getElementById('newsPagination').style.display = 'block';
    }
}

// Display featured news in sidebar
function displayFeaturedNews() {
    const container = document.getElementById('featuredNewsSidebar');
    if (!container) return;
    
    const featuredNews = allNewsData.filter(news => news.Featured).slice(0, 3);
    
    if (featuredNews.length === 0) {
        container.innerHTML = '<p class="text-muted">Belum ada berita unggulan</p>';
        return;
    }
    
    let html = '';
    
    featuredNews.forEach(news => {
        html += `
            <div class="sidebar-news-item">
                <h6 class="mb-2">
                    <a href="news-detail.html?id=${news.ID}" class="text-decoration-none text-dark">
                        ${news.Title}
                    </a>
                </h6>
                <div class="small text-muted">
                    <i class="bi bi-calendar me-1"></i> ${formatDate(news.Date)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filter news
function filterNews() {
    const category = document.getElementById('filterCategory').value;
    
    if (category) {
        filteredNewsData = allNewsData.filter(news => news.Category === category);
    } else {
        filteredNewsData = [...allNewsData];
    }
    
    currentPage = 1;
    displayNewsList();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('newsPagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredNewsData.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    pagination.querySelector('ul').innerHTML = html;
    
    // Add event listeners
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                displayNewsList();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

// Load news detail
async function loadNewsDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) {
        showToast('Berita tidak ditemukan', 'danger');
        window.location.href = 'news.html';
        return;
    }
    
    try {
        const result = await fetchData('getNews');
        
        if (result && result.success) {
            const news = result.news.find(n => n.ID == newsId && n.Status === 'Published');
            
            if (!news) {
                throw new Error('Berita tidak ditemukan');
            }
            
            displayNewsDetail(news);
            
            // Increment view count (simulated)
            await incrementViewCount(newsId);
        }
    } catch (error) {
        console.error('Error loading news detail:', error);
        showToast('Gagal memuat berita', 'danger');
        window.location.href = 'news.html';
    }
}

// Display news detail
function displayNewsDetail(news) {
    // Update page title
    document.title = `${news.Title} - EggTrack`;
    
    // Update meta tags for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = news.Excerpt || news.Title;
    }
    
    // Update Open Graph tags for social sharing
    updateMetaTag('og:title', news.Title);
    updateMetaTag('og:description', news.Excerpt || '');
    updateMetaTag('og:image', news.ImageURL);
    updateMetaTag('og:url', window.location.href);
    
    // Display news content
    document.getElementById('newsDetailTitle').textContent = news.Title;
    document.getElementById('newsDetailMeta').innerHTML = `
        <span class="badge bg-primary me-2">${news.Category}</span>
        <i class="bi bi-calendar me-1"></i> ${formatDate(news.Date)}
        <i class="bi bi-person ms-3 me-1"></i> ${news.Author}
        <i class="bi bi-eye ms-3 me-1"></i> ${(news.Views || 0) + 1}
    `;
    
    document.getElementById('newsDetailImage').src = news.ImageURL;
    document.getElementById('newsDetailImage').alt = news.Title;
    document.getElementById('newsDetailContent').innerHTML = news.Content || '';
}

// Update meta tag
function updateMetaTag(property, content) {
    let metaTag = document.querySelector(`meta[property="${property}"]`);
    if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
}

// Increment view count
async function incrementViewCount(newsId) {
    try {
        // In a real application, you would send a request to increment view count
        // For now, we'll just simulate it
        await fetchData('incrementView', { id: newsId });
    } catch (error) {
        console.error('Error incrementing view count:', error);
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
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
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