// auth-check.js - Sistem Proteksi Halaman Sederhana

// Fungsi untuk cek login status
function checkLoginStatus() {
    const savedUser = localStorage.getItem('eggUser');
    
    if (!savedUser) {
        return false;
    }
    
    try {
        const user = JSON.parse(savedUser);
        
        // Cek apakah session masih valid (24 jam)
        const loginTime = new Date(user.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff >= 24) {
            // Session expired
            localStorage.removeItem('eggUser');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking login status:', error);
        localStorage.removeItem('eggUser');
        return false;
    }
}

// Fungsi untuk mendapatkan data user
function getUserData() {
    const savedUser = localStorage.getItem('eggUser');
    if (savedUser) {
        try {
            return JSON.parse(savedUser);
        } catch (error) {
            return null;
        }
    }
    return null;
}

// Fungsi logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('eggUser');
        window.location.href = 'login.html?logout=success';
    }
}

// Fungsi untuk update user display
function updateUserDisplay() {
    const user = getUserData();
    if (user) {
        // Update role display
        const roleMap = {
            'admin': 'Administrator',
            'manager': 'Manager',
            'staff': 'Staff'
        };
        
        const roleDisplay = document.getElementById('userRoleDisplay');
        if (roleDisplay) {
            roleDisplay.textContent = roleMap[user.role] || user.role;
        }
        
        // Update name display
        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay) {
            nameDisplay.textContent = user.name || user.username;
        }
    }
}

// Cek login saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Halaman yang tidak perlu login
    const publicPages = ['login.html', ''];
    
    // Jika bukan halaman publik, cek login
    if (!publicPages.includes(currentPage)) {
        if (!checkLoginStatus()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Update user display jika ada
        updateUserDisplay();
    } else {
        // Jika di halaman login dan sudah login, redirect ke dashboard
        if (currentPage === 'login.html' && checkLoginStatus()) {
            window.location.href = 'dashboard.html';
        }
    }
});

// Setup event listeners untuk logout
document.addEventListener('DOMContentLoaded', function() {
    // Setup untuk tombol logout
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