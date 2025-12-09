// auth-guard.js - Middleware untuk proteksi halaman

// Mapping halaman ke permission yang dibutuhkan
const PAGE_PERMISSIONS = {
    'dashboard.html': 'dashboard',
    'production.html': 'production',
    'sales.html': 'sales',
    'expenses.html': 'expenses',
    'inventory.html': 'inventory',
    'customer.html': 'customer',
    'reports.html': 'reports',
    'settings.html': 'settings',
    'hpp.html': 'hpp'
};

// Role requirements untuk halaman tertentu
const PAGE_ROLES = {
    'settings.html': 'Administrator'
};

// Jalankan proteksi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Cek apakah user sudah login
    if (!auth.isAuthenticated) {
        if (currentPage !== 'index.html') {
            auth.requireAuth();
        }
        return;
    }

    // Cek permission untuk halaman ini
    const requiredPermission = PAGE_PERMISSIONS[currentPage];
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
        alert('Anda tidak memiliki izin untuk mengakses halaman ini');
        window.location.href = 'dashboard.html';
        return;
    }

    // Cek role requirement jika ada
    const requiredRole = PAGE_ROLES[currentPage];
    if (requiredRole) {
        auth.requireRole(requiredRole);
    }

    // Update UI dengan info user
    auth.updateUserDisplay(auth.getUserInfo());
    
    // Setup auto-logout untuk sesi demo
    if (auth.currentUser?.role === 'Demo User') {
        setupDemoSessionTimeout();
    }
});

// Setup timeout untuk sesi demo (1 jam)
function setupDemoSessionTimeout() {
    const DEMO_SESSION_TIMEOUT = 60 * 60 * 1000; // 1 jam dalam milidetik
    
    let timeoutId = setTimeout(() => {
        alert('Sesi demo telah berakhir. Silakan login kembali.');
        auth.logout();
    }, DEMO_SESSION_TIMEOUT);

    // Reset timeout pada aktivitas user
    const resetTimeout = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            alert('Sesi demo telah berakhir. Silakan login kembali.');
            auth.logout();
        }, DEMO_SESSION_TIMEOUT);
    };

    // Reset timeout pada interaksi user
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
        document.addEventListener(event, resetTimeout, { passive: true });
    });
}

// Intercept semua link yang mengarah ke halaman yang diproteksi
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http')) return;

    const page = href.split('/').pop();
    
    // Cek jika halaman memerlukan autentikasi
    if (PAGE_PERMISSIONS[page] && !auth.isAuthenticated) {
        e.preventDefault();
        alert('Silakan login terlebih dahulu untuk mengakses halaman ini');
        window.location.href = 'index.html?login=required';
        return;
    }

    // Cek jika user memiliki permission
    if (PAGE_PERMISSIONS[page] && !auth.hasPermission(PAGE_PERMISSIONS[page])) {
        e.preventDefault();
        alert('Anda tidak memiliki izin untuk mengakses halaman ini');
        return;
    }
}, true);