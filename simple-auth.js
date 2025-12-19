// simple-auth.js - Sistem autentikasi SANGAT SEDERHANA untuk EggTrack

const SIMPLE_AUTH = {
    // Simpan data user di memory saja (tidak pakai localStorage)
    currentUser: null,
    
    // Cek login dengan cara sederhana
    checkLogin: function() {
        // Cek di URL jika ada parameter login
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('forceLogin') === 'true') {
            return false;
        }
        
        // Cek session di localStorage (sederhana)
        const savedUser = localStorage.getItem('eggSimpleUser');
        if (!savedUser) return false;
        
        try {
            const user = JSON.parse(savedUser);
            // Cek session (24 jam)
            const loginTime = new Date(user.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff >= 24) {
                localStorage.removeItem('eggSimpleUser');
                return false;
            }
            
            this.currentUser = user;
            return true;
        } catch (e) {
            localStorage.removeItem('eggSimpleUser');
            return false;
        }
    },
    
    // Login sederhana
    login: function(username, password, role) {
        // User credentials (sangat sederhana)
        const users = {
            'admin': { password: 'admin123', role: 'Administrator', name: 'Admin Utama' },
            'manager': { password: 'manager123', role: 'Manager', name: 'Manager Produksi' },
            'staff': { password: 'staff123', role: 'Staff', name: 'Staff Peternakan' }
        };
        
        // Validasi
        if (!users[username] || users[username].password !== password) {
            return { success: false, message: 'Username atau password salah' };
        }
        
        // Buat user data
        const userData = {
            username: username,
            name: users[username].name,
            role: users[username].role,
            loginTime: new Date().toISOString()
        };
        
        // Simpan ke localStorage
        localStorage.setItem('eggSimpleUser', JSON.stringify(userData));
        this.currentUser = userData;
        
        return { success: true, user: userData };
    },
    
    // Logout
    logout: function() {
        localStorage.removeItem('eggSimpleUser');
        this.currentUser = null;
        window.location.href = 'index.html';
    },
    
    // Cek permission untuk halaman
    checkPermission: function(page) {
        if (!this.currentUser) return false;
        
        const rolePermissions = {
            'Administrator': ['dashboard', 'production', 'sales', 'expenses', 'inventory', 'customer', 'reports', 'settings', 'hpp', 'news'],
            'Manager': ['dashboard', 'production', 'sales', 'expenses', 'inventory', 'customer', 'reports', 'hpp', 'news'],
            'Staff': ['dashboard', 'production', 'sales', 'inventory', 'hpp']
        };
        
        const pageMap = {
            'dashboard.html': 'dashboard',
            'production.html': 'production',
            'sales.html': 'sales',
            'expenses.html': 'expenses',
            'inventory.html': 'inventory',
            'customer.html': 'customer',
            'reports.html': 'reports',
            'settings.html': 'settings',
            'hpp.html': 'hpp',
            'news-management.html': 'news'
        };
        
        const userRole = this.currentUser.role;
        const requiredPermission = pageMap[page];
        
        if (!requiredPermission) return true; // Halaman tidak ada di list = boleh akses
        
        return rolePermissions[userRole]?.includes(requiredPermission) || false;
    },
    
    // Redirect jika belum login
    requireLogin: function() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!this.checkLogin()) {
            if (currentPage !== 'index.html') {
                window.location.href = 'index.html?forceLogin=true';
            }
            return false;
        }
        
        // Cek permission
        if (!this.checkPermission(currentPage)) {
            alert('Anda tidak memiliki izin untuk mengakses halaman ini');
            window.location.href = 'dashboard.html';
            return false;
        }
        
        return true;
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', function() {
    SIMPLE_AUTH.requireLogin();
});