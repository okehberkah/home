// latest-news.js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Load latest news on homepage
async function loadLatestNews(limit = 3) {
    try {
        const container = document.getElementById('latestNewsContainer');
        if (!container) return;
        
        const result = await fetchData('getNews');
        
        if (result && result.success) {
            let news = result.news || [];
            
            // Filter only published news
            news = news.filter(item => item.Status === 'Published');
            
            // Sort by date (newest first)
            news.sort((a, b) => new Date(b.Date || b.CreatedAt) - new Date(a.Date || a.CreatedAt));
            
            // Get limited number of news
            news = news.slice(0, limit);
            
            displayLatestNews(news, container);
        }
    } catch (error) {
        console.error('Error loading latest news:', error);
        
        // Use demo data if failed
        const demoNews = getDemoNews(limit);
        const container = document.getElementById('latestNewsContainer');
        if (container) {
            displayLatestNews(demoNews, container);
        }
    }
}

// Display latest news
function displayLatestNews(newsArray, container) {
    if (newsArray.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <i class="bi bi-newspaper display-4 text-muted mb-3"></i>
                <h5 class="text-muted">Belum ada berita</h5>
                <p class="text-muted">Belum ada berita yang tersedia untuk saat ini.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    newsArray.forEach(news => {
        html += `
            <div class="col-md-4 mb-4">
                <div class="card h-100 border-0 shadow-sm">
                    <img src="${news.ImageURL || 'https://via.placeholder.com/400x250?text=No+Image'}" 
                         alt="${news.Title}" 
                         class="card-img-top"
                         style="height: 200px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/400x200?text=Image+Error'">
                    <div class="card-body">
                        <span class="badge bg-primary mb-2">${news.Category || 'Umum'}</span>
                        <h5 class="card-title">${news.Title}</h5>
                        <p class="card-text text-muted">${(news.Excerpt || '').substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-calendar me-1"></i> ${formatDate(news.Date)}
                            </small>
                            <a href="news-detail.html?id=${news.ID}" class="btn btn-sm btn-outline-primary">
                                Baca <i class="bi bi-arrow-right ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Get demo news for fallback
function getDemoNews(limit = 3) {
    return [
        {
            ID: 1,
            Title: 'Inovasi Pengolahan Telur Bebek dengan Teknologi Modern',
            Excerpt: 'Peternakan telur bebek di Indonesia mulai mengadopsi teknologi canggih untuk meningkatkan kualitas dan produktivitas...',
            ImageURL: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            Category: 'Terbaru',
            Date: '2024-03-15'
        },
        {
            ID: 2,
            Title: 'Peluang Pasar Ekspor Telur Bebek Meningkat 25%',
            Excerpt: 'Permintaan telur bebek dari pasar internasional menunjukkan peningkatan signifikan...',
            ImageURL: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            Category: 'Trending',
            Date: '2024-03-10'
        },
        {
            ID: 3,
            Title: 'Tips Manajemen Peternakan yang Efisien',
            Excerpt: 'Penerapan sistem manajemen digital terbukti meningkatkan efisiensi operasional...',
            ImageURL: 'https://images.unsplash.com/photo-1505253668822-42074d58a7c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            Category: 'Tips',
            Date: '2024-03-05'
        }
    ].slice(0, limit);
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
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

// Load latest news when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('latestNewsContainer')) {
        loadLatestNews(3);
    }
});