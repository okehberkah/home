// logout.js - Handler untuk logout

// Fungsi utama logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        // Hapus data user dari localStorage
        localStorage.removeItem('eggUser');
        
        // Redirect ke halaman login
        window.location.href = 'login.html?logout=success';
    }
}

// Setup event listeners untuk logout
document.addEventListener('DOMContentLoaded', function() {
    // Setup untuk tombol dengan id logoutBtn
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Setup untuk semua elemen dengan class logout-btn
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
});

// Export fungsi logout untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logout };
}