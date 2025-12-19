// login.js - Sistem Login Sederhana untuk EggTrack
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // Cek jika user sudah login
    checkExistingLogin();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update connection status
    updateConnectionStatus(true);
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
    
    // Role selector
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('role').value = this.dataset.role;
        });
    });
}

// Check jika user sudah login
function checkExistingLogin() {
    const savedUser = localStorage.getItem('eggUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            
            // Cek apakah session masih valid (24 jam)
            const loginTime = new Date(user.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                // Auto redirect ke dashboard
                console.log('User already logged in, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            } else {
                // Session expired, hapus data
                localStorage.removeItem('eggUser');
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('eggUser');
        }
    }
}

// Update status koneksi
function updateConnectionStatus(isConnected) {
    const connectionStatus = document.getElementById('loginConnectionStatus');
    if (!connectionStatus) return;
    
    const indicator = connectionStatus.querySelector('.status-indicator');
    const statusText = connectionStatus.querySelector('span');
    
    if (isConnected) {
        if (indicator) {
            indicator.className = 'status-indicator status-connected';
        }
        if (statusText) {
            statusText.textContent = 'Terhubung ke server';
        }
    } else {
        if (indicator) {
            indicator.className = 'status-indicator status-disconnected';
        }
        if (statusText) {
            statusText.textContent = 'Terputus dari server';
        }
    }
}

// Handler untuk submit login
function handleLoginSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('role').value;
    
    // Reset error messages
    document.getElementById('usernameError').classList.remove('show');
    document.getElementById('passwordError').classList.remove('show');
    document.getElementById('roleError').classList.remove('show');
    
    let isValid = true;
    
    if (!username) {
        document.getElementById('usernameError').textContent = 'Username harus diisi';
        document.getElementById('usernameError').classList.add('show');
        isValid = false;
    }
    
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password harus diisi';
        document.getElementById('passwordError').classList.add('show');
        isValid = false;
    }
    
    if (!role) {
        document.getElementById('roleError').textContent = 'Peran harus dipilih';
        document.getElementById('roleError').classList.add('show');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading
    const loginBtn = document.getElementById('loginForm').querySelector('button[type="submit"]');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginText = document.getElementById('loginText');
    
    loginSpinner.classList.remove('d-none');
    loginText.classList.add('d-none');
    loginBtn.disabled = true;
    
    // Simulasi proses login
    setTimeout(() => {
        handleLogin(username, password, role);
    }, 1000);
}

// Fungsi untuk login
function handleLogin(username, password, role) {
    // Data user valid (untuk demo)
    const validUsers = {
        'admin': { password: 'admin123', role: 'admin', name: 'Administrator' },
        'manager': { password: 'manager123', role: 'manager', name: 'Manager' },
        'staff': { password: 'staff123', role: 'staff', name: 'Staff' }
    };

    const loginBtn = document.getElementById('loginForm').querySelector('button[type="submit"]');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginText = document.getElementById('loginText');
    
    if (validUsers[username] && 
        validUsers[username].password === password && 
        validUsers[username].role === role) {
        
        // Buat data user
        const userData = {
            username: username,
            name: validUsers[username].name,
            role: role,
            email: `${username}@eggtrack.com`,
            loginTime: new Date().toISOString(),
            permissions: getPermissionsByRole(role)
        };
        
        // Simpan ke localStorage
        localStorage.setItem('eggUser', JSON.stringify(userData));
        
        // Tampilkan pesan sukses
        showToast('Login berhasil! Mengarahkan ke dashboard...', 'success');
        
        // Redirect ke dashboard setelah 1.5 detik
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } else {
        // Tampilkan pesan error
        showToast('Username, password, atau peran tidak sesuai', 'danger');
        document.getElementById('passwordError').textContent = 'Username, password, atau peran tidak sesuai';
        document.getElementById('passwordError').classList.add('show');
    }
    
    // Reset button
    loginSpinner.classList.add('d-none');
    loginText.classList.remove('d-none');
    loginBtn.disabled = false;
}

// Fungsi untuk mendapatkan permissions berdasarkan role
function getPermissionsByRole(role) {
    const permissions = {
        'admin': ['dashboard', 'production', 'sales', 'expenses', 'inventory', 'customer', 'reports', 'settings', 'hpp', 'news'],
        'manager': ['dashboard', 'production', 'sales', 'expenses', 'inventory', 'customer', 'reports', 'news'],
        'staff': ['dashboard', 'production', 'sales', 'inventory', 'news']
    };
    return permissions[role] || [];
}

// Fungsi untuk menampilkan toast
function showToast(message, type = 'info') {
    // Buat container jika belum ada
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    // Buat toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Tampilkan dengan Bootstrap
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    // Hapus setelah selesai
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}