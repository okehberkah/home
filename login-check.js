// login-check.js - Validasi cepat di semua halaman

// Safe Storage Helper (sama seperti di index.html)
const safeStorage = {
    get: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage tidak dapat diakses:', e.message);
            try {
                return sessionStorage.getItem(key);
            } catch (e2) {
                console.warn('sessionStorage juga tidak dapat diakses:', e2.message);
                return window._eggTrackMemoryStorage?.[key] || null;
            }
        }
    }
};

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Halaman yang tidak memerlukan login
    const publicPages = ['index.html', ''];
    
    // Jika bukan halaman publik, cek login
    if (!publicPages.includes(currentPage)) {
        // Cek apakah user sudah login
        const userData = safeStorage.get('eggTrackUser');
        const sessionToken = safeStorage.get('eggTrackSession');
        
        // Jika tidak ada user atau session, redirect ke index.html
        if (!userData || !sessionToken) {
            console.log('User not logged in, redirecting to index.html');
            window.location.href = 'index.html?login=required';
            return;
        }
        
        // Validasi session (24 jam)
        try {
            const user = JSON.parse(userData);
            const loginTime = new Date(user.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff >= 24) {
                // Session expired
                console.log('Session expired, clearing storage and redirecting');
                safeStorage.remove('eggTrackUser');
                safeStorage.remove('eggTrackSession');
                window.location.href = 'index.html?session=expired';
            }
        } catch (error) {
            console.error('Error validating session:', error);
            // Jika data user tidak valid, redirect ke index
            safeStorage.remove('eggTrackUser');
            safeStorage.remove('eggTrackSession');
            window.location.href = 'index.html?login=required';
        }
    } else {
        // Jika di halaman index.html dan sudah login, redirect ke dashboard
        const userData = safeStorage.get('eggTrackUser');
        const sessionToken = safeStorage.get('eggTrackSession');
        
        if (userData && sessionToken) {
            try {
                const user = JSON.parse(userData);
                const loginTime = new Date(user.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    // Session masih valid, redirect ke dashboard
                    console.log('User already logged in, redirecting to dashboard');
                    window.location.href = 'dashboard.html';
                } else {
                    // Session expired, hapus data
                    safeStorage.remove('eggTrackUser');
                    safeStorage.remove('eggTrackSession');
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                safeStorage.remove('eggTrackUser');
                safeStorage.remove('eggTrackSession');
            }
        }
    }
});

// Juga jalankan saat window load untuk memastikan
window.addEventListener('load', function() {
    // Cek jika ada parameter login=required di URL (untuk index.html)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'required') {
        // Tampilkan modal login otomatis
        setTimeout(() => {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            if (loginModal) loginModal.show();
        }, 500);
    }
    
    if (urlParams.get('session') === 'expired') {
        // Tampilkan toast bahwa session expired
        setTimeout(() => {
            showToast('Session Anda telah berakhir, silakan login kembali', 'warning');
        }, 1000);
    }
});

// Fungsi helper untuk showToast (jika belum ada)
function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Tambahkan metode remove dan clear untuk safeStorage
safeStorage.remove = function(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('localStorage tidak dapat diakses:', e.message);
        try {
            sessionStorage.removeItem(key);
        } catch (e2) {
            console.warn('sessionStorage juga tidak dapat diakses:', e2.message);
            if (window._eggTrackMemoryStorage) {
                delete window._eggTrackMemoryStorage[key];
            }
        }
    }
};

safeStorage.clear = function() {
    try {
        localStorage.clear();
    } catch (e) {
        console.warn('localStorage tidak dapat diakses:', e.message);
        try {
            sessionStorage.clear();
        } catch (e2) {
            console.warn('sessionStorage juga tidak dapat diakses:', e2.message);
            window._eggTrackMemoryStorage = {};
        }
    }
};