// auth.js - Sistem Autentikasi EggTrack

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Cek status login saat aplikasi dimulai
        this.checkAuthStatus();
        
        // Setup event listeners untuk logout
        this.setupLogoutListeners();
    }

    checkAuthStatus() {
        // Ambil data user dari localStorage
        const userData = localStorage.getItem('eggTrackUser');
        const sessionToken = sessionStorage.getItem('eggTrackSession');
        
        if (userData && sessionToken) {
            try {
                const user = JSON.parse(userData);
                this.currentUser = user;
                this.isAuthenticated = true;
                
                // Update display role di sidebar
                this.updateUserDisplay(user);
                
                // Tambahkan event listener untuk logout jika belum ada
                this.setupLogoutListeners();
                
                console.log('User authenticated:', user.username);
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        } else {
            this.isAuthenticated = false;
        }
    }

    async login(username, password, rememberMe = false) {
        try {
            // Validasi input
            if (!username || !password) {
                throw new Error('Username dan password harus diisi');
            }

            // Simulasi API call dengan timeout
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Validasi kredensial (dalam aplikasi real, ini akan panggil API)
            const users = [
                { username: 'admin', password: 'admin123', role: 'Administrator', name: 'Administrator' },
                { username: 'operator', password: 'op123', role: 'Operator', name: 'Operator Produksi' },
                { username: 'demo', password: 'demo123', role: 'Demo User', name: 'Pengguna Demo' }
            ];

            const user = users.find(u => u.username === username && u.password === password);
            
            if (!user) {
                throw new Error('Username atau password salah');
            }

            // Buat user data tanpa password
            const userData = {
                username: user.username,
                name: user.name,
                role: user.role,
                email: `${user.username}@eggtrack.id`,
                loginTime: new Date().toISOString(),
                permissions: this.getPermissionsByRole(user.role)
            };

            // Simpan ke localStorage/sessionStorage
            localStorage.setItem('eggTrackUser', JSON.stringify(userData));
            
            // Buat session token
            const sessionToken = this.generateSessionToken();
            sessionStorage.setItem('eggTrackSession', sessionToken);
            
            // Jika remember me dicentang, simpan juga di localStorage
            if (rememberMe) {
                localStorage.setItem('eggTrackRemember', 'true');
            }

            this.currentUser = userData;
            this.isAuthenticated = true;

            // Update display
            this.updateUserDisplay(userData);

            return {
                success: true,
                user: userData,
                message: 'Login berhasil'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    logout() {
        // Hapus data dari storage
        localStorage.removeItem('eggTrackUser');
        localStorage.removeItem('eggTrackRemember');
        sessionStorage.removeItem('eggTrackSession');
        
        // Reset state
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Redirect ke halaman index
        window.location.href = 'index.html';
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            // Redirect ke index dengan parameter untuk membuka modal login
            window.location.href = 'index.html?login=required';
            return false;
        }
        return true;
    }

    requireRole(requiredRole) {
        if (!this.isAuthenticated) {
            return this.requireAuth();
        }

        const userRole = this.currentUser?.role;
        const rolesHierarchy = {
            'Demo User': 1,
            'Operator': 2,
            'Administrator': 3
        };

        if (rolesHierarchy[userRole] >= rolesHierarchy[requiredRole]) {
            return true;
        } else {
            // Redirect ke dashboard dengan pesan error
            alert('Anda tidak memiliki izin untuk mengakses halaman ini');
            window.location.href = 'dashboard.html';
            return false;
        }
    }

    updateUserDisplay(user) {
        // Update semua elemen dengan class user-role-display
        const displayElements = document.querySelectorAll('.user-role-display, #userRoleDisplay');
        displayElements.forEach(el => {
            if (user && user.role) {
                el.textContent = user.role;
                el.classList.remove('d-none');
            }
        });

        // Update nama user jika ada elemen untuk itu
        const nameElements = document.querySelectorAll('.user-name-display');
        nameElements.forEach(el => {
            if (user && user.name) {
                el.textContent = user.name;
            }
        });
    }

    setupLogoutListeners() {
        // Setup untuk semua tombol logout
        document.querySelectorAll('.logout-btn, #logoutBtn').forEach(btn => {
            // Hapus event listener lama jika ada
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Tambahkan event listener baru
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Apakah Anda yakin ingin logout?')) {
                    this.logout();
                }
            });
        });
    }

    generateSessionToken() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getPermissionsByRole(role) {
        const permissions = {
            'Administrator': ['dashboard', 'production', 'sales', 'expenses', 'inventory', 'customer', 'reports', 'settings', 'hpp'],
            'Operator': ['dashboard', 'production', 'sales', 'inventory'],
            'Demo User': ['dashboard', 'production', 'sales', 'inventory', 'reports']
        };
        return permissions[role] || [];
    }

    hasPermission(permission) {
        if (!this.isAuthenticated) return false;
        return this.currentUser?.permissions?.includes(permission) || false;
    }

    getUserInfo() {
        return this.currentUser;
    }
}

// Buat instance global
const auth = new AuthSystem();

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = auth;
}