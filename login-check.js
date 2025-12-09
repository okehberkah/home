// login-check.js - Validasi cepat di semua halaman
(function() {
    // Cek apakah user sudah login
    const user = localStorage.getItem('eggTrackUser');
    const session = sessionStorage.getItem('eggTrackSession');
    
    // Jika tidak ada user atau session, redirect ke index
    if (!user || !session) {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Hanya redirect jika bukan halaman index
        if (currentPage !== 'index.html') {
            // Simpan halaman yang dituju untuk redirect setelah login
            sessionStorage.setItem('redirectAfterLogin', currentPage);
            
            // Redirect ke index dengan parameter login
            window.location.href = 'index.html?login=required';
        }
    } else {
        // Jika sudah login dan di halaman index, redirect ke dashboard
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html') {
            const redirectTo = sessionStorage.getItem('redirectAfterLogin') || 'dashboard.html';
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectTo;
        }
    }
})();