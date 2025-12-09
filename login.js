// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLWrZZ6CInf510NDjaX4HeZ2MYgbl_OSt0cScLDzb7YzjwfeFPcQdoj8_3J_f36yEz/exec';

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
});

// Fungsi inisialisasi login
function initializeLogin() {
    // Check koneksi
    checkConnection();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check jika user sudah login
    checkExistingLogin();
}

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

// Check koneksi ke server
async function checkConnection() {
    try {
        const result = await fetchData('test');
        const isConnected = result && result.success;
        
        updateConnectionStatus(isConnected);
        
        if (isConnected) {
            showToast('Terhubung ke server', 'success');
        } else {
            showToast('Tidak terhubung ke server', 'warning');
        }
    } catch (error) {
        console.error('Connection check failed:', error);
        updateConnectionStatus(false);
        showToast('Tidak dapat terhubung ke server', 'danger');
    }
}

// Update status koneksi
function updateConnectionStatus(isConnected) {
    const statusIndicator = document.querySelector('#loginConnectionStatus .status-indicator');
    const statusText = document.querySelector('#loginConnectionStatus span');
    
    if (isConnected) {
        statusIndicator.classList.remove('status-disconnected');
        statusIndicator.classList.add('status-connected');
        statusText.textContent = 'Terhubung ke server';
    } else {
        statusIndicator.classList.remove('status-connected');
        statusIndicator.classList.add('status-disconnected');
        statusText.textContent = 'Terputus dari server';
    }
}

// Check jika user sudah login
function checkExistingLogin() {
    const savedUser = localStorage.getItem('eggTrackUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        // Auto redirect ke dashboard
        window.location.href = 'dashboard.html';
    }
}

// Handler untuk submit login
async function handleLoginSubmit(e) {
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
    
    const loginBtn = document.getElementById('loginForm').querySelector('button[type="submit"]');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginText = document.getElementById('loginText');
    
    loginSpinner.classList.remove('d-none');
    loginText.classList.add('d-none');
    loginBtn.disabled = true;
    
    try {
        const result = await handleLogin(username, password, role);
        
        if (result.success) {
            showToast('Login berhasil! Mengarahkan ke dashboard...', 'success');
            
            // Simpan data user
            localStorage.setItem('eggTrackUser', JSON.stringify(result.user));
            
            // Redirect ke dashboard setelah delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showToast(result.message || 'Login gagal!', 'danger');
            document.getElementById('passwordError').textContent = result.message;
            document.getElementById('passwordError').classList.add('show');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Terjadi kesalahan saat login', 'danger');
    } finally {
        loginSpinner.classList.add('d-none');
        loginText.classList.remove('d-none');
        loginBtn.disabled = false;
    }
}

// Fungsi untuk login
async function handleLogin(username, password, role) {
    try {
        // Untuk demo, gunakan data sederhana
        const validUsers = {
            'admin': { password: 'admin123', role: 'admin', name: 'Administrator' },
            'manager': { password: 'manager123', role: 'manager', name: 'Manager' },
            'staff': { password: 'staff123', role: 'staff', name: 'Staff' }
        };

        if (validUsers[username] && validUsers[username].password === password && validUsers[username].role === role) {
            return {
                success: true,
                user: {
                    username: username,
                    name: validUsers[username].name,
                    role: role,
                    email: `${username}@eggtrack.com`
                }
            };
        } else {
            return {
                success: false,
                message: 'Username, password, atau peran tidak sesuai'
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan saat login'
        };
    }
}

// Fungsi utility
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
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        throw error;
    }
}

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