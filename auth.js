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
        // Safe Storage Helper
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
        
        // Ambil data user dari storage
        const userData = safeStorage.get('eggTrackUser');
        const sessionToken = safeStorage.get('eggTrackSession');
        
        if (userData && sessionToken) {
            try {
                const user = JSON.parse(userData);
                
                // Cek apakah session masih valid (24 jam)
                const loginTime = new Date(user.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.currentUser = user;
                    this.isAuthenticated = true;
                    
                    // Update display role di sidebar
                    this.updateUserDisplay(user);
                    
                    // Tambahkan event listener untuk logout jika belum ada
                    this.setupLogoutListeners();
                    
                    console.log('User authenticated:', user.username);
                } else {
                    // Session expired
                    console.log('Session expired');
                    this.logout();
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        } else {
            this.isAuthenticated = false;
            console.log('User not authenticated');
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

            // Validasi kredensial
            const users = [
                { username: 'admin', password: 'admin123', role: 'Administrator', name: 'Administrator' },
                { username: 'manager', password: 'manager123', role: 'Manager', name: 'Manager Produksi' },
                { username: 'staff', password: 'staff123', role: 'Staff', name: 'Staff Peternakan' }
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

            // Safe Storage Helper
            const safeStorage = {
                set: (key, value) => {
                    try {
                        localStorage.setItem(key, value);
                    } catch (e) {
                        console.warn('localStorage tidak dapat diakses:', e.message);
                        try {
                            sessionStorage.setItem(key, value);
                        } catch (e2) {
                            console.warn('sessionStorage juga tidak dapat diakses:', e2.message);
                            if (!window._eggTrackMemoryStorage) {
                                window._eggTrackMemoryStorage = {};
                            }
                            window._eggTrackMemoryStorage[key] = value;
                        }
                    }
                }
            };

            // Simpan ke storage
            safeStorage.set('eggTrackUser', JSON.stringify(userData));
            
            // Buat session token
            const sessionToken = this.generateSessionToken();
            safeStorage.set('eggTrackSession', sessionToken);
            
            // Jika remember me dicentang, simpan flag
            if (rememberMe) {
                safeStorage.set('eggTrackRemember', 'true');
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
        // Safe Storage Helper
        const safeStorage = {
            remove: (key) => {
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
            },
            clear: () => {
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
            }
        };
        
        // Hapus data dari storage
        safeStorage.remove('eggTrackUser');
        safeStorage.remove('eggTrackRemember');
        safeStorage.remove('eggTrackSession');
        
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
            'Staff': 1,
            'Manager': 2,
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
        if (!user) return;
        
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
            'Manager': ['dashboard', 'production', 'sales', 'expenses', 'inventory', 'customer', 'reports'],
            'Staff': ['dashboard', 'production', 'sales', 'inventory']
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